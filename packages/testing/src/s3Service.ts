import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  _Object,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { DEFAULT_RETRIES } from "./constants";
import { ErrorWithStatus } from "./interfaces/errorWithStatus";
import { fromEnv } from "@aws-sdk/credential-providers";
import logger from "./logger";
import { extractTimestamp } from "./utils";

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
   * Fetches a list of keys in a specified folder from AWS S3.
   * @param folder The folder the retrieve keys from
   * @returns A Promise that resolves with an array of keys
   */
  async fetchKeys(folder: string): Promise<_Object[]> {
    try {
      const listObjects = new ListObjectsV2Command({
        Bucket: process.env.BUCKET,
        Prefix: folder,
      });

      const res = await this.s3.send(listObjects);

      if (res.Contents) {
        return res.Contents;
      } else {
        throw new ErrorWithStatus("S3Service: No reports found.", 404);
      }
    } catch (err: any) {
      logger.error("S3Service: Failed to fetch existing reports in S3.", err);
      throw new ErrorWithStatus(err.message, err.$response?.statusCode || err.statusCode || 500);
    }
  }

  /**
   * Fetches the oldest key in a specified folder from AWS S3 and deletes it if the
   * number of keys exceeds a threshold.
   * @param folder The folder to fetch keys from.
   * @param threshold The threshold number of keys. If the number of keys exceeds this threshold,
   * the oldest key will be deleted.
   * @returns A Promise that resolves when the oldest key is deleted.
   */
  async fetchAndDeleteOldestKey(folder: string, threshold: number): Promise<void> {
    try {
      const keys = await this.fetchKeys(folder);
      if (keys.length <= threshold) {
        return;
      }

      // Sort keys by last modified time
      keys.sort((a, b) => {
        const timestampA = extractTimestamp(a.Key || "");
        const timestampB = extractTimestamp(b.Key || "");
        return timestampA.localeCompare(timestampB);
      });

      const oldestKey = keys[0];
      logger.info(
        `S3Service: There are ${keys.length} reports in ${folder} which exceeds the set threshold \
of ${threshold}. Deleting oldest key ${oldestKey.Key}.`
      );

      const deleteObject = new DeleteObjectCommand({
        Bucket: process.env.BUCKET,
        Key: oldestKey.Key,
      });

      await this.s3.send(deleteObject);
    } catch (err: any) {
      logger.error("S3Service: Failed deleting key.", err);
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
      return fileContents;
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
      logger.info(`S3Service: Successfully wrote contents to S3 bucket with key: ${key}`);
    } catch (err: any) {
      logger.error(`S3Service: Failed writing to key ${key}`, err);
      throw new ErrorWithStatus(err.message + ` Key: ${key}`, err.$response?.statusCode || 500);
    }
  }
}

export default S3Service;
