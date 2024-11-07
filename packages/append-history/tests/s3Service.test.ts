import S3Service from "@src/s3Service";
import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import { ErrorWithStatus } from "@src/interfaces/errorWithStatus";
import { Uint8ArrayBlobAdapter } from "@smithy/util-stream";

describe("S3Service", () => {
  const s3Service: S3Service = new S3Service();

  it("fetchSuburbs - should throw error when no content is returned", async () => {
    const mockS3Client = mockClient(S3Client);
    mockS3Client.on(ListObjectsV2Command).resolves({});

    try {
      await s3Service.fetchSuburbs();
    } catch (err: any) {
      expect(err.message).toEqual("Failed to fetch existing files in S3.");
      expect(err.statusCode).toEqual(500);
    }
  });

  it("fetchSuburbs - should throw error when s3 fails", async () => {
    const mockS3Client = mockClient(S3Client);
    mockS3Client.on(ListObjectsV2Command).rejects(new ErrorWithStatus("Bad", 500));

    try {
      await s3Service.fetchSuburbs();
    } catch (err: any) {
      expect(err.message).toEqual("Bad");
      expect(err.statusCode).toEqual(500);
    }
  });

  it("fetchSuburbs - successfully fetched suburbs", async () => {
    const mockS3Client = mockClient(S3Client);
    mockS3Client.on(ListObjectsV2Command).resolves({
      Contents: [{ Key: "." }, { Key: "Abbotsbury" }, { Key: "Kensington" }, { Key: "" }],
    });

    const res = await s3Service.fetchSuburbs();
    expect(res).toBeDefined();
    // should remove first element because it is root folder
    expect(res.length).toEqual(3);
  });

  it("readBucket - should throw error on failed fetch", async () => {
    const mockS3Client = mockClient(S3Client);
    mockS3Client.on(GetObjectCommand).resolves({});

    try {
      await s3Service.readBucket("a");
    } catch (err: any) {
      expect(err.message).toEqual("Unexpected token u in JSON at position 0");
      expect(err.statusCode).toEqual(500);
    }
  });

  it("readBucket - successfully read bucket", async () => {
    const mockS3Client = mockClient(S3Client);
    mockS3Client.on(GetObjectCommand).resolves({
      Body: Uint8ArrayBlobAdapter.fromString(JSON.stringify({ a: "Some content" })) as any,
    });

    const res = await s3Service.readBucket("a");
    expect(res).toEqual({ a: "Some content" });
  });

  it("writeBucket - should handle errors when write operation fails", async () => {
    const mockS3Client = mockClient(S3Client);
    mockS3Client.on(PutObjectCommand).rejects(new ErrorWithStatus("Bad", 500));

    try {
      await s3Service.writeBucket("a", "a");
    } catch (err: any) {
      expect(err.message).toBe("Bad Key: a");
      expect(err.statusCode).toBe(500);
    }
  });

  it("writeBucket - succeeds", async () => {
    const mockS3Client = mockClient(S3Client);
    mockS3Client.on(PutObjectCommand).resolves({});

    expect(async () => await s3Service.writeBucket("a", "a")).not.toThrow();
  });
});
