import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { ErrorWithStatus } from "@src/customTypes/errorWithStatus";
import { fetchDataForBatch } from "@src/utils";
import * as fs from "fs";
import { mockClient } from "aws-sdk-client-mock";
import { Uint8ArrayBlobAdapter } from "@smithy/util-stream";
import { mockFetch } from "./helpers/mockFetch";
import S3Service from "@src/s3Service";
import { DEFAULT_JSON } from "@src/constants";

const originalEnv = process.env;

const mockS3 = mockClient(S3Client);

const s3 = new S3Service();

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

    const res = JSON.parse(await s3.readBucket(fileName));

    const realDataJSON = JSON.parse(realData);
    expect(res).toStrictEqual(realDataJSON);
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
    const res = JSON.parse(await s3.readBucket(DEFAULT_JSON));

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
    expect(async () => fetchDataForBatch("not latitude", "not longitude")).rejects.toThrow(
      ErrorWithStatus
    );
  });
});
