import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { S3Service } from "../src/S3Service";
import { getSuburbs } from "../src/utils";
import { mockClient } from "aws-sdk-client-mock";
import { ErrorWithStatus } from "../src/types/errorWithStatus";

const mockS3 = mockClient(S3Client);

describe("GetSuburbs", () => {
  afterEach(() => {
    mockS3.reset();
  });

  it("Test no (invalid) address provided", async () => {
    try {
      await getSuburbs("");
    } catch (err: any) {
      expect(err.statusCode).toBe(404);
    }
  });
});

describe("S3 read bucket", () => {
  it("Throws error on invalid request", async () => {
    mockS3.on(GetObjectCommand).rejects(new ErrorWithStatus("Bad", 404));

    const s3 = new S3Service();
    try {
      await s3.readBucket("test");
    } catch (err: any) {
      expect(err.message).toBe("Bad Key: test");
    }
  });
});
