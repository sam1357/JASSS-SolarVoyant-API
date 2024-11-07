import { APIGatewayProxyResult, LambdaFunctionURLEvent } from "aws-lambda";
import { logger } from "./constants";
import { handleCalculation } from "./utils";

export const headers = { "Content-Type": "application/json" };

export async function handler(event: LambdaFunctionURLEvent): Promise<APIGatewayProxyResult> {
  logger.info(
    `Received event, processing data. path: ${event.requestContext.http.path ?? ""}, 
    httpMethod: ${event.requestContext.http.method ?? ""},
    params: ${JSON.stringify(event.queryStringParameters) ?? ""}`
  );

  if (!event.requestContext.http.path) {
    logger.error("Path was not provided to the handler.");
    return {
      headers,
      statusCode: 400,
      body: JSON.stringify({ message: "No path provided" }),
    };
  }

  if (!event.requestContext.http.method) {
    logger.error("httpMethod was not provided to the handler.");
    return {
      headers,
      statusCode: 400,
      body: JSON.stringify({ message: "No httpMethod provided" }),
    };
  }

  if (
    event.requestContext.http.method === "GET" &&
    isCorrectPath(event.requestContext.http.path, "calculateSuburb")
  ) {
    return handleCalculation(event);
  }

  return {
    statusCode: 400,
    body: JSON.stringify({ message: "Unrecognised path and method combination" }),
  };
}

function isCorrectPath(path: string, correctPath: string): boolean {
  return new RegExp(`^(/(dev|staging|prod))?/calculator/${correctPath}$`).test(path);
}
