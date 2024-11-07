import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import dotenv from "dotenv";
import { logger } from "./constants";
import { collectWeatherData, handleSuburb, invokeNotificationMicroservice } from "./utils";
import { CleanedFullWeatherData } from "./interfaces";
import { ErrorWithStatus } from "./interfaces/errorWithStatus";

dotenv.config({ path: "../.env" });

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  const { httpMethod, path } = event;
  const headers = { "Content-Type": "application/json" };
  logger.info(`Received event. Path: ${path ?? ""}, httpMethod: ${httpMethod ?? ""}`);

  try {
    let weatherData: CleanedFullWeatherData;
    const isHistory = httpMethod === "POST" && isCorrectPath(path, "history-process");

    if (isHistory) {
      if (!event.body || Object.keys(event.body).length === 0 || typeof event.body === "string") {
        throw new ErrorWithStatus("Please provide an event body as a JSON object", 400);
      }

      // shorten the body during logging
      const logBody = JSON.stringify(event.body).substring(0, 250).concat("...");
      logger.info(`Processing and uploading history data. Body: ${logBody}`);
      weatherData = event.body as any;
    } else {
      const testPath = event.queryStringParameters?.testPath ?? "";
      logger.info(`Performing refresh of forecast data in S3. Query string: ${testPath}`);
      weatherData = await collectWeatherData(testPath);
    }

    // process concurrently
    await Promise.all(
      weatherData.suburbs_data.map((v) => handleSuburb(v, weatherData.metadata, isHistory))
    );

    // Invoke the notification microservice
    await invokeNotificationMicroservice();
  } catch (err: any) {
    logger.error("An exception has occurred with the pre-processing of data.", err);
    return {
      headers,
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ message: err.message }),
    };
  }

  return {
    headers,
    statusCode: 200,
    body: JSON.stringify({ message: "Refresh completed successfully." }),
  };
};

const isCorrectPath = (path: string, correct: string) =>
  new RegExp(`^(/(dev|staging|prod))?/data-preprocessing/${correct}$`).test(path);
