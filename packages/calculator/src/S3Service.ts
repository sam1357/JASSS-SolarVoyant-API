import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { DEFAULT_RETRIES } from "./constants";
import { ErrorWithStatus } from "./types/errorWithStatus";
import { fromEnv } from "@aws-sdk/credential-providers";

/**
 * Represents a service for interacting with AWS S3
 */
export class S3Service {
  private s3: S3Client;

  /**
   * Constructs a new S3Service instance.
   */
  constructor() {
    this.s3 = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      credentials: fromEnv(),
      region: process.env.DEFAULT_REGION,
      maxAttempts: DEFAULT_RETRIES,
    });
  }

  /**
   * Reads the contents of an object from AWS S3.
   * @param key The key of the object to read.
   * @returns A Promise that resolves with the content of the object.
   */
  async readBucket(key: string): Promise<any> {
    try {
      const getCommand = new GetObjectCommand({
        Bucket: process.env.BUCKET,
        Key: key,
      });

      const { Body } = await this.s3.send(getCommand);
      const fileContents: string = (await Body?.transformToString()) as string;
      return JSON.parse(fileContents);
    } catch (err: any) {
      throw new ErrorWithStatus(err.message + ` Key: ${key}`, err.$response?.statusCode);
    }
  }
}
