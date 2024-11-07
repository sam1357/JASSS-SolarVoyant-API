import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { ErrorWithStatus } from "./types/errorWithStatus";
import { JSONData } from "./types/dataInterface";
import { BUCKET, logger, ROOT_FOLDER } from "./constants";
import dotenv from "dotenv";
import { fromEnv } from "@aws-sdk/credential-providers";

dotenv.config();

const client: S3Client = new S3Client({
  region: process.env.DEFAULT_REGION,
  credentials: fromEnv(),
});

/**
 * Takes in a Sydney suburb, returns weather event data of a specified suburb
 * @param suburb name of suburb. Pass in "TEST" for testing purposes
 * @param timeFrame is either "history" or "forecast".
 * @returns weather event data
 */
export async function readSuburbs(suburb: string, timeFrame: string): Promise<JSONData> {
  const fileName = `weatherData/${timeFrame}/${capitalise(suburb)}.json`;
  const key: string = suburb === "TEST" ? "TEST/dummyInput.json" : fileName;

  return JSON.parse(await readBucket(`${ROOT_FOLDER}${key}`));
}

/**
 * Reads the contents of an object from AWS S3.
 * @param key The key of the object to read.
 * @param getExpiry Whether to include the expiry of the object, if present
 * @returns A Promise that resolves with the content of the object.
 */
export async function readBucket(key: string, getExpiry = false): Promise<string> {
  const input = { Bucket: BUCKET, Key: key };
  try {
    const getCommand = new GetObjectCommand(input);
    const headObjectCommand = new HeadObjectCommand(input);

    const { Body } = await client.send(getCommand);
    const fileContents: string = (await Body?.transformToString()) as string;

    if (getExpiry) {
      const { Expires } = await client.send(headObjectCommand);
      return JSON.stringify({ fileContents, Expires });
    } else {
      return fileContents;
    }
  } catch (err: any) {
    logger.error(`S3Service: Failed reading for key ${key}`, err);
    throw new ErrorWithStatus(
      `Unable to read from S3 bucket | key: ${key} | error: ${err.message}`,
      err.$response?.statusCode || 500
    );
  }
}

/**
 * Writes the contents of an object to AWS S3.
 * @param key The key of the object to read.
 * @param contents The contents to write to the object.
 * @param ttl The time-to-live of the object.
 */
export async function writeBucket(key: string, contents: string, ttl: number) {
  // add ttl to current time
  const d = new Date();
  d.setTime(d.getTime() + ttl * 1000);

  try {
    const putCommand = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: contents,
      Expires: d,
    });

    await client.send(putCommand);
    logger.info(`S3Service: Successfully wrote contents to S3 bucket with key: ${key}`);
  } catch (err: any) {
    logger.error(`S3Service: Failed writing to key ${key}`, err);
    throw new ErrorWithStatus(err.message + ` Key: ${key}`, err.$response?.statusCode || 500);
  }
}

/**
 * Deletes an object from AWS S3.
 * @param key The key of the object to delete.
 */
export async function deleteFromBucket(key: string) {
  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    );
    logger.info(`S3Service: Successfully deleted object with key: ${key}`);
  } catch (err: any) {
    logger.error(`S3Service: Failed deleting object with key: ${key}`, err);
    throw new ErrorWithStatus(
      `Unable to delete object from S3 bucket | key: ${key} | error: ${err.message}`,
      err.$response?.statusCode || 500
    );
  }
}

/**
 * Capitalises a suburb name as a proper noun. For example surry hills -> Surry Hills
 * @param suburb the suburb to capitalise
 * @returns the suburb with capitalised letters per word
 */
export function capitalise(suburb: string): string {
  const words: string[] = suburb.split(" ");
  const capitalisedWords = words.map((word) => {
    if (word.length > 0) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    return word;
  });
  return capitalisedWords.join(" ");
}
