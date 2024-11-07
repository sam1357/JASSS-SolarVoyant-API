import { DEFAULT_FOLDER } from "@src/constants";
import { type CleanedFullWeatherData } from "@src/customTypes/types";
import { handler } from "@src/index";
import S3Service from "@src/s3Service";
import { APIGatewayEvent } from "aws-lambda";

const s3 = new S3Service();

describe("Full integration test for weather collection", () => {
  it("should successfully write data to s3 correctly", async () => {
    const event: APIGatewayEvent = {
      httpMethod: "GET",
      path: "/dev/data-collection/weather",
      queryStringParameters: { s3Key: `${DEFAULT_FOLDER}/rawData/test.json` },
    } as any;
    const response = await handler(event);

    const metadata = {
      units: {
        time: "iso8601",
        temperature_2m: "°C",
        relative_humidity_2m: "%",
        precipitation: "mm",
        precipitation_probability: "%",
        apparent_temperature: "°C",
        surface_pressure: "hPa",
        visibility: "m",
        weather_code: "wmo code",
        wind_gusts_10m: "km/h",
        cloud_cover: "%",
        wind_speed_10m: "km/h",
        wind_direction_10m: "°",
        uv_index: "",
        shortwave_radiation: "W/m²",
        daylight_duration: "s",
        sunshine_duration: "s",
      },
      timezone: "Australia/Sydney",
      timezone_abbreviation: expect.any(String),
    };

    expect(response.statusCode).toEqual(200);
    // get data from s3
    const weatherRes: CleanedFullWeatherData = JSON.parse(
      await s3.readBucket(`${DEFAULT_FOLDER}/rawData/test.json`)
    );
    expect(weatherRes).toBeDefined();
    expect(weatherRes.metadata).toStrictEqual(metadata);
    expect(weatherRes.suburbs_data.length).toEqual(1);

    ["suburb", "latitude", "longitude", "elevation", "hourly", "daily"].map((i) =>
      expect(weatherRes.suburbs_data[0]).toHaveProperty(i)
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    weatherRes.suburbs_data[0].daily.time.forEach((v) => {
      expect(new Date(v).getTime()).toBeGreaterThanOrEqual(today.getTime());
    });
  });

  it("should fail during a simulated failure of fetching data from s3", async () => {
    const event: APIGatewayEvent = {
      queryStringParameters: { testPath: "notexist", s3Key: `${DEFAULT_FOLDER}/rawData/test.json` },
      httpMethod: "GET",
      path: "/dev/data-collection/weather",
    } as any;
    const res = await handler(event);
    expect(JSON.parse(res.body)).toEqual({
      message: "The specified key does not exist.",
    });
    expect(res.statusCode).toEqual(404);
  });

  it("should fail during a failure of fetching data for batch (due to invalid input)", async () => {
    const event: APIGatewayEvent = {
      queryStringParameters: {
        testPath: `${DEFAULT_FOLDER}/suburbsData/sydney_suburbs_bad.json`,
        s3Key: `${DEFAULT_FOLDER}/rawData/test.json`,
      },
      httpMethod: "GET",
      path: "/dev/data-collection/weather",
    } as any;
    const res = await handler(event);
    expect(JSON.parse(res.body)).toEqual({
      message: "Data corrupted at path ''. Cannot initialize Float from invalid String value a.",
    });
    expect(res.statusCode).toEqual(400);
  });
});

describe("main handler routing of paths", () => {
  it("should fail with 400 with no path", async () => {
    const event: APIGatewayEvent = {} as any;
    const res = await handler(event);
    expect(JSON.parse(res.body)).toEqual({
      message: "No path provided",
    });
    expect(res.statusCode).toEqual(400);
  });

  it("should fail with 400 with no httpmethod", async () => {
    const event: APIGatewayEvent = { path: "/dev/data-collection/weather" } as any;
    const res = await handler(event);
    expect(JSON.parse(res.body)).toEqual({
      message: "No httpMethod provided",
    });
    expect(res.statusCode).toEqual(400);
  });

  it("should fail with 400 with invalid combination", async () => {
    const event: APIGatewayEvent = { path: "/dev/data-collection/a", httpMethod: "GET" } as any;
    const res = await handler(event);
    expect(JSON.parse(res.body)).toEqual({
      message: "Unrecognised path and method combination",
    });
    expect(res.statusCode).toEqual(400);
  });
});

describe("Full integration test for suburb collection", () => {
  it("should return suburb data when fetch is successful", async () => {
    const event: APIGatewayEvent = {
      httpMethod: "GET",
      path: "/dev/data-collection/suburbs",
    } as any;
    const response = await handler(event);
    expect(response).toBeDefined();
  });
});
