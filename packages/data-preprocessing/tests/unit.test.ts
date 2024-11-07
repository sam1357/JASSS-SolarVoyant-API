import { handler } from "@src/index";
import { handleSuburb, mapToEvents } from "@src/utils";
import { CleanedFullWeatherData, EventTimeObject } from "@src/interfaces";
import { createTimeObject, formatTimeWithOffset, testJSON } from "@src/utils";
import * as fs from "fs";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import { ErrorWithStatus } from "@src/interfaces/errorWithStatus";
import { InvokeCommand, Lambda } from "@aws-sdk/client-lambda";
import { Uint8ArrayBlobAdapter } from "@smithy/util-stream";

const mockS3Client = mockClient(S3Client);
const mockLambda = mockClient(Lambda);

afterEach(() => {
  jest.clearAllMocks();
});

describe("mapToEvents unit test", () => {
  it("should map correctly to the result object", () => {
    const f = fs.readFileSync("./tests/resources/in.json", { encoding: "utf-8", flag: "r" });
    const inJson: CleanedFullWeatherData = JSON.parse(f);

    const res = mapToEvents(inJson.suburbs_data[0], inJson.metadata, false);
    const fout = fs.readFileSync("./tests/resources/out.json", { encoding: "utf-8", flag: "r" });

    expect(res).toStrictEqual(JSON.parse(fout));
  });
});

describe("createTimeObject", () => {
  test("it should create an EventTimeObject with correct properties", () => {
    const timestamp = "2024-03-10T10:00:00";
    const duration = 2;
    const unit = "hours";
    const timeZone = "Australia/Sydney";

    const expected: EventTimeObject = {
      timestamp: "2024-03-10T10:00:00+11:00",
      duration: 2,
      duration_unit: "hours",
      timezone: "Australia/Sydney",
    };

    const result = createTimeObject(timestamp, duration, unit, timeZone);

    expect(result).toEqual(expected);
  });
});

describe("formatTimeWithOffset", () => {
  test("Formats time correctly", () => {
    const time = new Date("2024-03-11T12:00:00");
    const timeZone = "Australia/Sydney";
    const expectedResult = "2024-03-11T12:00:00+11:00";

    expect(formatTimeWithOffset(time, timeZone)).toBe(expectedResult);
  });
});

describe("handleSuburb", () => {
  test("testing handleSuburb where putObject throws error", async () => {
    const f = fs.readFileSync("./tests/resources/in.json", { encoding: "utf-8", flag: "r" });
    const inJson: CleanedFullWeatherData = JSON.parse(f);
    mockS3Client.on(PutObjectCommand).rejects(new Error("Bad"));
    expect(
      async () => await handleSuburb(inJson.suburbs_data[0], inJson.metadata, false)
    ).rejects.toThrow(ErrorWithStatus);
  });

  test("testing handleSuburb where putObject is successful", async () => {
    const f = fs.readFileSync("./tests/resources/in.json", { encoding: "utf-8", flag: "r" });
    const inJson: CleanedFullWeatherData = JSON.parse(f);
    mockS3Client.on(PutObjectCommand).resolves({});
    expect(async () => await handleSuburb(inJson.suburbs_data[0], inJson.metadata, false)).resolves;
  });
});

describe("main handler", () => {
  test("testing handler when lambda invocation fails with status code", async () => {
    mockLambda.on(InvokeCommand).rejects(new ErrorWithStatus("Failed", 400));

    const res = await handler({} as any);
    expect(JSON.parse(res.body)).toEqual({
      message: "An error occurred trying to collect weather data. Error: Failed",
    });
    expect(res.statusCode).toEqual(400);
  });

  test("testing handler when lambda invocation fails without status code", async () => {
    mockLambda.on(InvokeCommand).rejects(new Error("Failed"));

    const res = await handler({} as any);
    expect(JSON.parse(res.body)).toEqual({
      message: "An error occurred trying to collect weather data. Error: Failed",
    });
    expect(res.statusCode).toEqual(500);
  });

  test("testing handler when lambda invocation fails without message", async () => {
    mockLambda.on(InvokeCommand).rejects(new Error(""));

    const res = await handler({} as any);
    expect(JSON.parse(res.body)).toEqual({
      message: "An error occurred trying to collect weather data. Error: ",
    });
    expect(res.statusCode).toEqual(500);
  });

  test("testing handler when invoke succeeds, but status code !== 200", async () => {
    const payload = Uint8ArrayBlobAdapter.fromString(
      JSON.stringify({ body: JSON.stringify({ message: "Failed" }), statusCode: 400 })
    );
    mockLambda.on(InvokeCommand).resolves({ Payload: payload });

    const res = await handler({} as any);
    expect(JSON.parse(res.body)).toEqual({
      message: "An error occurred trying to collect weather data. Error: Failed",
    });
    expect(res.statusCode).toEqual(400);
  });

  test("testing handler when invoke succeeds, but no body", async () => {
    const payload = Uint8ArrayBlobAdapter.fromString(JSON.stringify({}));
    mockLambda.on(InvokeCommand).resolves({ Payload: payload });

    const res = await handler({} as any);
    expect(JSON.parse(res.body)).toEqual({
      message: "An error occurred trying to collect weather data. Error: An unknown error occurred",
    });
    expect(res.statusCode).toEqual(500);
  });

  test("testing handler when invoke succeeds, but no data returned", async () => {
    mockLambda.on(InvokeCommand).resolves({});
    const errMsg =
      // eslint-disable-next-line
      "An error occurred trying to collect weather data. Error: No return object received from lambda.";

    const res = await handler({} as any);
    expect(JSON.parse(res.body)).toEqual({
      message: errMsg,
    });
    expect(res.statusCode).toEqual(500);
  });

  test("testing handler on history path but no body provided", async () => {
    const res = await handler({
      "httpMethod": "POST",
      "path": "/dev/data-preprocessing/history-process",
    } as any);
    expect(JSON.parse(res.body)).toEqual({
      message: "Please provide an event body as a JSON object",
    });
    expect(res.statusCode).toEqual(400);
  });

  test("testing handler on history path but body is not a JSON object", async () => {
    const res = await handler({
      "httpMethod": "POST",
      "path": "/dev/data-preprocessing/history-process",
      "body": JSON.stringify({ test: "test" }),
    } as any);
    expect(JSON.parse(res.body)).toEqual({
      message: "Please provide an event body as a JSON object",
    });
    expect(res.statusCode).toEqual(400);
  });

  test("testing handler on history path but body is {}", async () => {
    const res = await handler({
      "httpMethod": "POST",
      "path": "/dev/data-preprocessing/history-process",
      "body": JSON.stringify({}),
    } as any);
    expect(JSON.parse(res.body)).toEqual({
      message: "Please provide an event body as a JSON object",
    });
    expect(res.statusCode).toEqual(400);
  });
});

describe("testJSON function", () => {
  test("should return true for valid JSON string", () => {
    // eslint-disable-next-line
    const validJSONString = `{"name": "John", "age": 30}`;
    expect(testJSON(validJSONString)).toBe(true);
  });

  test("should return false for invalid JSON string", () => {
    // eslint-disable-next-line
    const invalidJSONString = `{"name": "John", "age": 30`;
    expect(testJSON(invalidJSONString)).toBe(false);
  });

  test("should return false for empty string", () => {
    const emptyString = "";
    expect(testJSON(emptyString)).toBe(false);
  });
});
