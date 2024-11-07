import S3Service from "@src/s3Service";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
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
      console.warn(err);
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
});
