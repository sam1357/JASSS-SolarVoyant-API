import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { DEFAULT_RETRIES, GROUP_NAME, logger } from "./constants";
import { ErrorWithStatus } from "./interfaces/errorWithStatus";
import { fromEnv } from "@aws-sdk/credential-providers";

/**
 * Represents a service for interacting with AWS S3 while limiting number of concurrent operations.
 */
class S3Service {
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
   * Fetches the list of suburbs from AWS S3.
   * @returns A Promise that resolves with an array of suburb names.
   */
  async fetchSuburbs(): Promise<string[]> {
    try {
      const listObjects = new ListObjectsV2Command({
        Bucket: process.env.BUCKET,
        Prefix: `${GROUP_NAME}/weatherData/forecast/`,
      });

      const res = await this.s3.send(listObjects);

      if (res.Contents) {
        // Remove the first element, which is the root
        return res.Contents.map((c) => c.Key || "").slice(1);
      } else {
        throw new ErrorWithStatus("Failed to fetch existing files in S3.", 500);
      }
    } catch (err: any) {
      throw new ErrorWithStatus(err.message, err.$response?.statusCode || 500);
    }
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
      logger.error(`S3Service: Failed reading for key ${key}`, err);
      throw new ErrorWithStatus(err.message, err.$response?.statusCode || 500);
    }
  }

  /**
   * Writes contents to an object in AWS S3.
   * @param key The key of the object to write.
   * @param contents The contents to write to the object.
   * @returns A Promise that resolves when the write operation is complete.
   */
  async writeBucket(key: string, contents: string): Promise<void> {
    const putCommand = new PutObjectCommand({
      Bucket: process.env.BUCKET,
      Key: key,
      Body: contents,
    });

    try {
      await this.s3.send(putCommand);
      logger.info(`Successfully wrote contents to S3 bucket with key: ${key}`);
    } catch (err: any) {
      logger.error(`S3Service: Failed writing to key ${key}`, err);
      throw new ErrorWithStatus(err.message + ` Key: ${key}`, err.$response?.statusCode || 500);
    }
  }
}

export default S3Service;
