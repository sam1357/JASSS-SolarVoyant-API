import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  handleEnergyDataRetrieve,
  handleHeatmapRetrieve,
  handleMappingRetrieve,
  handlePing,
  handleRetrieve,
  handleWmoRetrieve,
} from "./endpoints";
import { logger } from "./constants";

export const headers = { "Content-Type": "application/json" };

export async function handler(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
  const { httpMethod, path } = event;

  logger.info(
    `Received event, processing data. path: ${path ?? ""}, httpMethod: ${httpMethod ?? ""},
    params: ${JSON.stringify(event.queryStringParameters) ?? ""}`
  );

  if (!path) {
    logger.error("Path was not provided to the handler.");
    return {
      headers,
      statusCode: 400,
      body: JSON.stringify({ message: "No path provided" }),
    };
  }

  if (!httpMethod) {
    logger.error("httpMethod was not provided to the handler.");
    return {
      headers,
      statusCode: 400,
      body: JSON.stringify({ message: "No httpMethod provided" }),
    };
  }

  if (httpMethod === "GET" && isCorrectPath(path, "ping")) {
    return handlePing();
  }

  if (httpMethod === "GET" && isCorrectPath(path, "retrieve")) {
    return handleRetrieve(event, "forecast");
  }

  if (httpMethod === "GET" && isCorrectPath(path, "retrieve-history")) {
    return handleRetrieve(event, "history");
  }

  if (httpMethod === "GET" && isCorrectPath(path, "retrieve-wmo")) {
    return handleWmoRetrieve();
  }

  if (httpMethod === "GET" && isCorrectPath(path, "retrieve-heatmap")) {
    return handleHeatmapRetrieve();
  }

  if (httpMethod === "GET" && isCorrectPath(path, "retrieve-energy-data")) {
    return handleEnergyDataRetrieve(event);
  }

  if (httpMethod === "GET" && isCorrectPath(path, "retrieve-mapping")) {
    return handleMappingRetrieve();
  }

  return {
    statusCode: 400,
    body: JSON.stringify({ message: "Unrecognised path and method combination" }),
  };
}

function isCorrectPath(path: string, correctPath: string): boolean {
  return new RegExp(`^(/(dev|staging|prod))?/data-retrieval/${correctPath}$`).test(path);
}
