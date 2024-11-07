import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import dotenv from "dotenv";
import { HEADERS, LOGGER } from "./constants";
import { SuburbHandler, WeatherHandler } from "./endpoints";

dotenv.config({ path: "../.env" });

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  const { httpMethod, path } = event;

  LOGGER.info(
    `Received event. Path: ${path ?? ""}, httpMethod: ${httpMethod ?? ""},
    params: ${JSON.stringify(event.queryStringParameters) ?? ""}`
  );

  if (!path) {
    LOGGER.error("Path was not provided to the handler.");
    return {
      headers: HEADERS,
      statusCode: 400,
      body: JSON.stringify({ message: "No path provided" }),
    };
  }

  if (!httpMethod) {
    LOGGER.error("httpMethod was not provided to the handler.");
    return {
      headers: HEADERS,
      statusCode: 400,
      body: JSON.stringify({ message: "No httpMethod provided" }),
    };
  }

  if (httpMethod === "GET" && isCorrectPath(path, "weather")) {
    return WeatherHandler(event);
  } else if (httpMethod === "GET" && isCorrectPath(path, "suburbs")) {
    return SuburbHandler();
  }

  return {
    statusCode: 400,
    body: JSON.stringify({ message: "Unrecognised path and method combination" }),
  };
};

const isCorrectPath = (path: string, correct: string) =>
  new RegExp(`^(/(dev|staging|prod))?/data-collection/${correct}$`).test(path);
