import { InvocationType, InvokeCommand, Lambda } from "@aws-sdk/client-lambda";
import { ErrorWithStatus } from "@src/customTypes/errorWithStatus";
import { fetchAndParseJSON, fetchDataForBatch, processHistoricalData } from "@src/utils";
import { handler } from "@src/index";
import { APIGatewayEvent } from "aws-lambda";
import { mockClient } from "aws-sdk-client-mock";
import * as fs from "fs";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mockFetch } from "./helpers/mockFetch";
import { Uint8ArrayBlobAdapter } from "@smithy/util-stream";

// Causes handler function and processHistoricalData to fail.
const lambdaMock = mockClient(Lambda);

const originalEnv = process.env;

const mockS3 = mockClient(S3Client);

describe("Test fetch from S3 Bucket", () => {
  jest.spyOn(global, "fetch").mockImplementation(mockFetch);

  beforeEach(() => {
    mockS3.reset();
  });

  it("should return suburb data if fetched successfully", async () => {
    const fileName = "suburbsData/sydney_suburbs_test.json";

    const realData = fs.readFileSync("./tests/resources/sydney_suburbs_test.json", {
      encoding: "utf-8",
      flag: "r",
    });
    mockS3.on(GetObjectCommand).resolves({
      Body: Uint8ArrayBlobAdapter.fromString(realData) as any,
    });

    const res = await fetchAndParseJSON(fileName);
    const realDataJSON = JSON.parse(realData);
    expect(res).toStrictEqual(realDataJSON);
  });

  it("should throw an error if failed to fetch file", async () => {
    const fileName = "sydney_suburbs_nope.json";
    mockS3.on(GetObjectCommand).rejects(new Error("Bad"));

    expect(async () => await fetchAndParseJSON(fileName)).rejects.toThrow(ErrorWithStatus);

    // check status code
    try {
      await fetchAndParseJSON(fileName);
    } catch (error: any) {
      expect(error.message).toBe("Bad");
    }
  });
});

describe("Testing functions on production environment that have branches for test env", () => {
  beforeEach(() => {
    mockS3.reset();
  });

  beforeAll(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      NODE_ENV: "production",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("fetchAndParseJSON should be able to get the real suburbs data", async () => {
    const f = fs.readFileSync("./tests/resources/sydney_suburbs.json", {
      encoding: "utf-8",
      flag: "r",
    });

    mockS3.on(GetObjectCommand).resolves({ Body: Uint8ArrayBlobAdapter.fromString(f) as any });
    const res = await fetchAndParseJSON();
    const suburbs = JSON.parse(f);
    expect(res.length).toEqual(suburbs.length);
  });
});

describe("Test fetchDataForBatch function branches", () => {
  jest.spyOn(global, "fetch").mockImplementation(async () => {
    return {
      status: 400,
      json: async () => ({ message: "hi" }),
    } as Response;
  });

  it("should throw an error if fetch failed", async () => {
    expect(async () =>
      fetchDataForBatch("not latitude", "not longitude", "date", "dates")
    ).rejects.toThrow(ErrorWithStatus);
  });
});

describe("processHistoricalData function", () => {
  test("testing processHistoricalData where Lambda fails", async () => {
    const payload = {
      transformToString: () =>
        JSON.stringify({ body: JSON.stringify({ message: "Failed" }), statusCode: 500 }),
    };

    lambdaMock.on(InvokeCommand).resolves({ Payload: payload as any });

    const params = {
      FunctionName: "testFunction",
      InvocationType: InvocationType.RequestResponse,
      Payload: JSON.stringify({ key: "value" }),
    };

    const result = await processHistoricalData(params);

    expect(result.statusCode).toBe(500);
    expect(result.body).toContain("Lambda invocation failed");
  });
});

describe("handler function", () => {
  jest.spyOn(global, "fetch").mockImplementation(async () => {
    return {
      status: 500,
      json: async () => ({ reason: "Error occurred during preprocessing." }),
    } as Response;
  });
  test("handler function returns error response when preprocessing fails", async () => {
    const event: APIGatewayEvent = {
      queryStringParameters: { startDate: "2024-03-05", endDate: "2024-03-05" },
    } as any;

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({ message: "Error occurred during preprocessing." });
  });
});
