import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import { ErrorWithStatus } from "./types/errorWithStatus";
import { getSuburbs, getSydneySuburbs } from "./utils";

export const logger = new Logger();
export const headers = { "Content-Type": "application/json" };

export async function handler(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
  try {
    const { httpMethod, path } = event;

    logger.info(
      `Received event, processing data. path: ${path ?? ""}, httpMethod: ${httpMethod ?? ""},
      params: ${JSON.stringify(event.queryStringParameters) ?? ""}`
    );

    if (httpMethod !== "GET") {
      throw new ErrorWithStatus("httpMethod must be 'GET'", 405);
    }

    if (!event.queryStringParameters || !event.queryStringParameters.address) {
      throw new ErrorWithStatus("No 'address' param provided", 400);
    }

    const address: string = event.queryStringParameters.address;

    const suburbs: string[] = await getSuburbs(address);

    const sydneySuburbs: string[] = await getSydneySuburbs(suburbs);

    if (sydneySuburbs.length === 0) {
      throw new ErrorWithStatus("Address not recognised by 'Google Maps' as one in Sydney", 400);
    }

    return {
      headers,
      statusCode: 200,
      body: JSON.stringify({ suburbs: sydneySuburbs }),
    };
  } catch (error: any) {
    logger.error("Error processing the request", error);
    if (error instanceof ErrorWithStatus) {
      return {
        headers,
        statusCode: error.statusCode,
        body: JSON.stringify({ message: error.message }),
      };
    } else {
      return {
        headers,
        statusCode: 400,
        body: JSON.stringify({ message: error.message }),
      };
    }
  }
}
