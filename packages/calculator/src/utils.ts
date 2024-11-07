import { APIGatewayProxyEvent, APIGatewayProxyResult, LambdaFunctionURLEvent } from "aws-lambda";
import { ErrorWithStatus } from "./types/errorWithStatus";
import { GROUP_NAME, SHORTWAVE_RATIO, SUBURB_LAMBDA_NAME, logger } from "./constants";
import { InvocationType, InvokeCommand, Lambda } from "@aws-sdk/client-lambda";
import { headers } from ".";
import { S3Service } from "./S3Service";
import dotenv from "dotenv";
import { JSONData } from "./types/interfaces";

dotenv.config();

export async function handleCalculation(
  event: LambdaFunctionURLEvent
): Promise<APIGatewayProxyResult> {
  try {
    if (!event.queryStringParameters) {
      throw new ErrorWithStatus("Required params 'suburb' and 'surfaceAarea' are missing.", 400);
    }
    if (!Object.keys(event.queryStringParameters).includes("surfaceArea")) {
      throw new ErrorWithStatus("Required param surfaceArea is missing.", 400);
    }

    if (!Object.keys(event.queryStringParameters).includes("suburb")) {
      throw new ErrorWithStatus("Required param suburb is missing.", 400);
    }

    const suburb: string = event.queryStringParameters["suburb"] ?? "";
    if (!(await isValidSuburb(suburb))) {
      throw new ErrorWithStatus(`Invalid suburb name '${suburb}'`, 400);
    }

    const surface_area = parseFloat(event.queryStringParameters["surfaceArea"] as string);

    const data: JSONData = await getData(suburb);
    let energyGeneration: number = 0;
    let totalTemp: number = 0;
    let tempCount: number = 0;
    let totalDaylightDuration: number = 0;
    let daylightDurationCount: number = 0;

    if (data && data.events) {
      for (const event of data.events) {
        const temperature: number = parseFloat(event.attributes.temperature_2m ?? "0");
        const dayLightDuration: number = parseFloat(event.attributes.daylight_duration ?? "0");
        let shortwaveRadiation: number =
          parseFloat(event.attributes.shortwave_radiation ?? "0") / 8;

        shortwaveRadiation *= SHORTWAVE_RATIO;
        if (dayLightDuration !== 0) {
          totalDaylightDuration += dayLightDuration;
          daylightDurationCount++;
        }

        if (temperature === 0) {
          continue;
        } else if (temperature > 25) {
          energyGeneration += surface_area * shortwaveRadiation * (1 - 0.004 * (temperature - 25));
        } else if (temperature <= 25) {
          energyGeneration += surface_area * shortwaveRadiation;
        }
        totalTemp += temperature;
        tempCount++;
      }
    }

    const tempAverage = totalTemp / tempCount;
    const dayLightAverage = totalDaylightDuration / daylightDurationCount;

    return {
      statusCode: 200,
      body: JSON.stringify({
        energyGeneration: energyGeneration,
        tempAverage: tempAverage,
        dayLightAverage: dayLightAverage,
      }),
    };
  } catch (err: any) {
    logger.error("An exception has occurred with the calculations microservice.", err);
    return {
      headers,
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ message: err.message }),
    };
  }
}

export async function getData(suburb: string): Promise<JSONData> {
  const constructEvent: APIGatewayProxyEvent = {
    path: "/data-retrieval/retrieve",
    httpMethod: "GET",
    queryStringParameters: {
      suburb: suburb,
      startDate: getDate(0),
      endDate: getDate(6),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  const params = {
    FunctionName: `${GROUP_NAME}_${process.env.STAGING_ENV}_${SUBURB_LAMBDA_NAME}`,
    InvocationType: InvocationType.RequestResponse,
    Payload: JSON.stringify(constructEvent),
  };

  const lambda = new Lambda({ region: process.env.DEFAULT_REGION });

  try {
    const response = await lambda.send(new InvokeCommand(params));

    const data = JSON.parse(response?.Payload?.transformToString() as string);
    return JSON.parse(data.body);
  } catch (error) {
    logger.error("Exception thrown when fetching from data retrieval", JSON.stringify(error));
    throw new ErrorWithStatus("Exception occured when fetching from data retrieval", 400);
  }
}

export function getDate(daysAhead: number): string {
  let yourDate: Date = new Date();
  const offset: number = yourDate.getTimezoneOffset();
  yourDate = new Date(yourDate.getTime() - offset * 60 * 1000);
  yourDate.setDate(yourDate.getDate() + daysAhead);
  return yourDate.toISOString().split("T")[0];
}

export async function isValidSuburb(suburb: string): Promise<boolean> {
  const filePath = "SE3011-24-F14A-03/suburbsData/sydney_suburbs.json";
  const data = await new S3Service().readBucket(filePath);
  const validSuburbs: string[] = [];
  for (const entry of data) {
    validSuburbs.push(entry.suburb.toLowerCase());
  }
  return validSuburbs.includes(suburb.toLowerCase());
}
