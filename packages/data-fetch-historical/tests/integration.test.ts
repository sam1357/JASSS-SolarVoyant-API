import { handler } from "@src/index";
import { APIGatewayEvent } from "aws-lambda";
import { mockFetch } from "./helpers/mockFetch";
import { mockClient } from "aws-sdk-client-mock";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { ErrorWithStatus } from "@src/customTypes/errorWithStatus";
import { Uint8ArrayBlobAdapter } from "@smithy/util-stream";

describe("Full integration test", () => {
  jest.spyOn(global, "fetch").mockImplementation(mockFetch);

  it("should return cleaned weather data when fetch is successful", async () => {
    const event: APIGatewayEvent = {
      queryStringParameters: { startDate: "2024-03-05", endDate: "2024-03-05" },
    } as any;
    const response = await handler(event);

    const metadata = {
      units: {
        time: "iso8601",
        temperature_2m: "°C",
        relative_humidity_2m: "%",
        precipitation: "mm",
        precipitation_probability: "%",
        cloud_cover: "%",
        wind_speed_10m: "km/h",
        wind_direction_10m: "°",
        uv_index: "",
        shortwave_radiation: "MJ/m²",
        daylight_duration: "s",
        sunshine_duration: "s",
        apparent_temperature: "°C",
        surface_pressure: "hPa",
        visibility: "m",
        wind_gusts_10m: "km/h",
        weather_code: "wmo code",
      },
      timezone: "Australia/Sydney",
      timezone_abbreviation: "AEDT",
    };

    const weatherRes = JSON.parse(response.body);
    expect(weatherRes).toBeDefined();
    expect(weatherRes.metadata).toStrictEqual(metadata);
    expect(weatherRes.suburbs_data.length).toEqual(1);

    ["suburb", "latitude", "longitude", "elevation", "daily"].map((i) =>
      expect(weatherRes.suburbs_data[0]).toHaveProperty(i)
    );
  }, 100000);

  it("should fail during a simulated failure of fetching data from s3", async () => {
    const mockS3 = mockClient(S3Client);
    mockS3
      .on(GetObjectCommand)
      .rejects(new ErrorWithStatus("The specified key does not exist.", 404));

    const event: APIGatewayEvent = {
      queryStringParameters: {
        testPath: "notexist",
        startDate: "2024-03-05",
        endDate: "2024-03-05",
      },
    } as any;
    const res = await handler(event);
    expect(JSON.parse(res.body)).toEqual({
      message: "The specified key does not exist.",
    });
  });

  it("should fail during a failure of fetching data for batch (due to invalid data)", async () => {
    const mockS3 = mockClient(S3Client);
    mockS3.on(GetObjectCommand).resolves({
      Body: Uint8ArrayBlobAdapter.fromString(JSON.stringify({})) as any,
    });

    const event: APIGatewayEvent = {
      queryStringParameters: {
        testPath: "suburbsData/sydney_suburbs_bad.json",
        startDate: "2024-03-05",
        endDate: "2024-03-05",
      },
    } as any;

    const res = await handler(event);

    expect(JSON.parse(res.body)).toEqual({
      message: "Cannot read properties of undefined (reading 'daily_units')",
    });
    expect(res.statusCode).toEqual(500);
  });
});
