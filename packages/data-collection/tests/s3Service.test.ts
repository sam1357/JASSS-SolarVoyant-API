import S3Service from "@src/s3Service";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import { ErrorWithStatus } from "@src/customTypes/errorWithStatus";
import { Uint8ArrayBlobAdapter } from "@smithy/util-stream";

describe("S3Service", () => {
  const s3Service: S3Service = new S3Service();

  it("readBucket - should throw error on failed fetch", async () => {
    const mockS3Client = mockClient(S3Client);
    mockS3Client
      .on(GetObjectCommand)
      .rejects(new Error("Unexpected token u in JSON at position 0"));

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
    expect(JSON.parse(res)).toEqual({ a: "Some content" });
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
