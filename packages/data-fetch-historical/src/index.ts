import {
  type HistoricalRawWeatherData,
  type Params,
  type Payload,
  type SuburbData,
} from "./customTypes/types";
import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { InvocationType } from "@aws-sdk/client-lambda";
import dotenv from "dotenv";
import {
  cleanData,
  fetchAndParseJSON,
  fetchDataForSuburbs,
  transformHourlyToDaily,
  processHistoricalData,
} from "./utils";
import { PREPROCESSING_LAMBDA_NAME, GROUP_NAME, logger } from "./constants";

dotenv.config({ path: "../.env" });

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  const headers = { "Content-Type": "application/json" };
  logger.info(
    `Received event, processing data. Query string: ${event.queryStringParameters?.testPath ?? ""}`
  );
  let suburbData: SuburbData[];

  // check for start and end date
  if (!event.queryStringParameters?.startDate || !event.queryStringParameters?.endDate) {
    return {
      headers,
      statusCode: 400,
      body: JSON.stringify({ message: "Missing start or end date." }),
    };
  }

  const startDate = event.queryStringParameters.startDate;
  const endDate = event.queryStringParameters.endDate;

  try {
    suburbData = await fetchAndParseJSON(event.queryStringParameters?.testPath);
  } catch (err: any) {
    logger.error("An error has occurred while fetching the JSON suburbs data.", err);
    return {
      headers,
      statusCode: err.statusCode,
      body: JSON.stringify({ message: err.message }),
    };
  }

  let res: HistoricalRawWeatherData[];

  try {
    res = await fetchDataForSuburbs(suburbData, startDate, endDate);

    // transforms any hourly conditions into daily conditions by averaging
    const transformedData = await transformHourlyToDaily(res);
    const cleanedData = cleanData(transformedData, suburbData);

    // sends data to preprocessing to process and upload to s3
    const payload: Payload = {
      httpMethod: "POST",
      path: `/${process.env.STAGING_ENV}/data-preprocessing/history-process`,
      body: cleanedData,
    };

    const params: Params = {
      FunctionName: `${GROUP_NAME}_${process.env.STAGING_ENV}_${PREPROCESSING_LAMBDA_NAME}`,
      InvocationType: InvocationType.RequestResponse,
      Payload: JSON.stringify(payload),
    };

    // ensures that preprocessing occurred successfully before resolving
    const preprocessingResult = await processHistoricalData(params);

    if (preprocessingResult.statusCode !== 200) {
      logger.error("Preprocessing lambda function did not return a successful status code.", {
        statusCode: preprocessingResult.statusCode,
      });
      return {
        headers,
        statusCode: preprocessingResult.statusCode,
        body: JSON.stringify({ message: "Error occurred during preprocessing." }),
      };
    }

    return {
      headers,
      statusCode: 200,
      body: JSON.stringify(cleanedData),
    };
  } catch (err: any) {
    logger.error("An error occurred when fetching weather data.", err);
    return {
      headers,
      body: JSON.stringify({ message: err.message }),
      statusCode: err.statusCode || 500,
    };
  }
};
