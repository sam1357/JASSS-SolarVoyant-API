import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { logger, headers } from "./constants";
import {
  analyseHandler,
  analyseSelectiveHandler,
  getDataHandler,
  heatmapHandler,
  summariseHandler,
} from "./endpoints";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { httpMethod, path } = event;
    logger.info(`Received request to analyse on route: ${path}`);

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

    /* internal route for data retrieval
     * necessary to modularise in order to provide an option for where the data comes from
     * simply gets data from retrieval
     */
    if (isCorrectPath(path, "get-data") && httpMethod === "GET") {
      return await getDataHandler(event);

      /* internal route for history
       * allows specific aggregate calculations for each requested attribute
       * on a custom weather input object
       */
    } else if (isCorrectPath(path, "summarise") && httpMethod === "POST") {
      return await summariseHandler(event);

      /* external route
       * applies all requested aggregates to all requested attributes
       */
    } else if (isCorrectPath(path, "analyse(-history)?") && httpMethod === "GET") {
      return await analyseHandler(event);
    }

    // external route
    else if (isCorrectPath(path, "analyse-selective(-history)?") && httpMethod === "POST") {
      return await analyseSelectiveHandler(event);

      // internal route for heatmap
    } else if (isCorrectPath(path, "analyse-heatmap") && httpMethod === "GET") {
      return await heatmapHandler(event);
    }

    // Incorrect path
    else {
      return {
        headers,
        statusCode: 404,
        body: JSON.stringify({
          message: "Route not found",
        }),
      };
    }
  } catch (error: any) {
    return {
      headers,
      body: JSON.stringify({
        message: error.message,
      }),
      statusCode: error.statusCode,
    };
  }
};

function isCorrectPath(path: string, correctPath: string): boolean {
  return new RegExp(`^(/(dev|staging|prod))?/data-analytics/${correctPath}$`).test(path);
}
