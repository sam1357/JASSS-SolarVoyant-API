import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import { ErrorWithStatus } from "../src/types/errorWithStatus";
import { Uint8ArrayBlobAdapter } from "@smithy/util-stream";
import { deleteFromBucket, readBucket, writeBucket } from "../src/s3";

describe("S3Service", () => {
  it("readBucket - should throw error on failed fetch", async () => {
    const mockS3Client = mockClient(S3Client);
    mockS3Client
      .on(GetObjectCommand)
      .rejects(new Error("Unexpected token u in JSON at position 0"));

    try {
      await readBucket("a");
    } catch (err: any) {
      expect(err.message).toEqual(
        "Unable to read from S3 bucket | key: a | error: Unexpected token u in JSON at position 0"
      );
      expect(err.statusCode).toEqual(500);
    }
  });

  it("readBucket - successfully read bucket", async () => {
    const mockS3Client = mockClient(S3Client);
    mockS3Client.on(GetObjectCommand).resolves({
      Body: Uint8ArrayBlobAdapter.fromString(JSON.stringify({ a: "Some content" })) as any,
    });

    const res = await readBucket("a");
    expect(JSON.parse(res)).toEqual({ a: "Some content" });
  });

  it("writeBucket - should handle errors when write operation fails", async () => {
    const mockS3Client = mockClient(S3Client);
    mockS3Client.on(PutObjectCommand).rejects(new ErrorWithStatus("Bad", 500));

    try {
      await writeBucket("a", "a", 1000);
      // this should not execute
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err.message).toBe("Bad Key: a");
      expect(err.statusCode).toBe(500);
    }
  });

  it("writeBucket - succeeds", async () => {
    const mockS3Client = mockClient(S3Client);
    mockS3Client.on(PutObjectCommand).resolves({});

    expect(async () => await writeBucket("a", "a", 1000)).not.toThrow();
  });

  it("deleteFromBucket - should handle errors when delete operation fails", async () => {
    const mockS3Client = mockClient(S3Client);
    mockS3Client.on(DeleteObjectCommand).rejects(new ErrorWithStatus("Bad", 500));

    try {
      await deleteFromBucket("a");
    } catch (err: any) {
      expect(err.message).toBe("Unable to delete object from S3 bucket | key: a | error: Bad");
      expect(err.statusCode).toBe(500);
    }
  });

  it("deleteFromBucket - succeeds", async () => {
    const mockS3Client = mockClient(S3Client);
    mockS3Client.on(DeleteObjectCommand).resolves({});

    expect(async () => await deleteFromBucket("a")).not.toThrow();
  });
});
