import { APIGatewayProxyResult } from "aws-lambda";
import { logger } from "./constants";
import { handleNotifications } from "./utils";

/**
 * Acts as the handle for the notification microservice
 */
export const handler = async (): Promise<APIGatewayProxyResult> => {
  const headers = { "Content-Type": "application/json" };
  logger.info("Received notification event. Processing now.");
  try {
    await handleNotifications();
    return {
      headers,
      statusCode: 200,
      body: JSON.stringify({ message: "Notification microservice successfully ran" }),
    };
  } catch (err: any) {
    logger.error("An exception has occurred with the notification microservice.", err);
    return {
      headers,
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ message: err.message }),
    };
  }
};
