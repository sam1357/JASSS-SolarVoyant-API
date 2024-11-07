import { CUR_TIMEZONE, logger } from "./constants";
import dotenv from "dotenv";
import { createNewEvent, filterTodayEvents, summariseEvents } from "./utils";
import S3Service from "./s3Service";
import LambdaInvoker from "./lambdaInvoker";
import { ErrorWithStatus } from "./interfaces/errorWithStatus";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ADAGEDataModel } from "./interfaces";
import { format, utcToZonedTime } from "date-fns-tz";

dotenv.config({ path: "../.env" });

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const s3Service = new S3Service();
  const lambdaInvoker = new LambdaInvoker();
  const headers = { "Content-Type": "application/json" };

  logger.info("Shuffling data into history.");

  try {
    const suburbs =
      process.env.NODE_ENV === "test"
        ? JSON.parse(event?.queryStringParameters?.testKeys as string)
        : await s3Service.fetchSuburbs();

    // Use Promise.all with map to process multiple keys concurrently
    await Promise.all(
      suburbs.map(async (key: string) => {
        const suburbName = getSuburbName(key);
        const historyKey = key.replace("forecast", "history");
        try {
          // fetch forecast and history data concurrently
          const [data, existingHistory]: [ADAGEDataModel, ADAGEDataModel] = await Promise.all([
            s3Service.readBucket(key),
            s3Service.readBucket(historyKey),
          ]);

          // check if the history data is as expected, otherwise return error
          if (
            !existingHistory ||
            !existingHistory.events ||
            Object.keys(existingHistory.events).length === 0
          ) {
            throw new ErrorWithStatus(
              `Malformed history for ${suburbName}. Please run the fetch history microservice.`,
              500
            );
          }

          data.events = filterTodayEvents(data.events);
          const newData = await summariseEvents(data, lambdaInvoker);
          const newEvent = createNewEvent(newData);

          // check if the event for the day already exists, skip if it does
          if (
            existingHistory.events &&
            existingHistory.events.find(
              (e) => e.time_object.timestamp === newEvent.time_object.timestamp
            )
          ) {
            logger.warn(`Skipping appending for ${suburbName} as event already exists.`);
            return;
          }

          // push the new event into existing history
          existingHistory.events.push(newEvent);
          // update the last modified time
          existingHistory.time_object.timestamp = format(
            utcToZonedTime(new Date(), CUR_TIMEZONE),
            "yyyy-MM-dd'T'HH:mm:ssXXX"
          );

          // write to s3
          await s3Service.writeBucket(historyKey, JSON.stringify(existingHistory));
        } catch (error: any) {
          logger.error("Failed to process for suburb " + suburbName, error);
          throw new ErrorWithStatus(
            `Failed to process for suburb ${suburbName}. Error: ${error.message}`,
            500
          );
        }
      })
    );
  } catch (err: any) {
    logger.error("An exception occurred when trying to fetch data from data retrieval.", err);
    return {
      headers,
      statusCode: err.statusCode,
      body: JSON.stringify({ message: err.message }),
    };
  }

  return {
    headers,
    statusCode: 200,
    body: JSON.stringify({ message: "Operation completed successfully." }),
  };
};

const getSuburbName = (key: string): string => {
  const arr = key.split("/");
  return arr[arr.length - 1].replace(".json", "");
};
