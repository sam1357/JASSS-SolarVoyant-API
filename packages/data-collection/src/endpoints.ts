import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { SuburbData } from "./customTypes/types";
import { fetchDataForSuburbs, cleanData } from "./utils";
import { DEFAULT_JSON, DEFAULT_TEST_JSON, LOGGER } from "./constants";
import S3Service from "./s3Service";

/**
 * Fetches weather from external API and returns it
 * @param event - the event passed from API gateway
 * @returns the result with the weather data
 */
export async function WeatherHandler(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
  const headers = { "Content-Type": "application/json" };
  const { testPath, s3Key } = event.queryStringParameters as any;

  LOGGER.info(`Event forwarded to weather. Test path: ${testPath ?? ""}, s3Key: ${s3Key}`);
  if (!s3Key && !s3Key.trim()) {
    return {
      headers,
      statusCode: 400,
      body: JSON.stringify({ message: "Please provide a key to save the file to in S3." }),
    };
  }

  // use test json in test env, but use testPath if present
  const testFile = process.env.NODE_ENV === "test" ? DEFAULT_TEST_JSON : DEFAULT_JSON;

  try {
    const suburbData: SuburbData[] = JSON.parse(
      await new S3Service().readBucket(testPath ? testPath : testFile)
    );

    const res = cleanData(await fetchDataForSuburbs(suburbData), suburbData);
    await new S3Service().writeBucket(s3Key, JSON.stringify(res));
  } catch (err: any) {
    LOGGER.error("WeatherHandler: an error has occurred: ", err);
    return {
      headers,
      statusCode: err.statusCode,
      body: JSON.stringify({ message: err.message }),
    };
  }

  return {
    headers,
    statusCode: 200,
    body: JSON.stringify({ message: `Collected and wrote data to ${s3Key}.` }),
  };
}

/**
 * Fetches suburb data from S3 and returns it
 * @returns the result with the suburbs data
 */
export async function SuburbHandler(): Promise<APIGatewayProxyResult> {
  const headers = { "Content-Type": "application/json" };
  LOGGER.info("Event forwarded to fetch suburbs.");

  try {
    return {
      headers,
      statusCode: 200,
      body: await new S3Service().readBucket(DEFAULT_JSON),
    };
  } catch (err: any) {
    LOGGER.error("An error has occurred while fetching the JSON suburbs data.", err);
    return {
      headers,
      statusCode: err.statusCode,
      body: JSON.stringify({ message: err.message }),
    };
  }
}
