import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { InvocationType, InvokeCommand, Lambda } from "@aws-sdk/client-lambda";
import {
  GROUP_NAME,
  RETRIEVAL_LAMBDA_NAME,
  logger,
  headers,
  HEATMAP_AVAILABLE_CONDITIONS,
} from "./constants";
import { InputObject, ReturnObject, SummariseInput } from "./customTypes/dataModel";
import { analysis, getAnalytics } from "./analytics";
import { ErrorWithStatus } from "./customTypes/errorWithStatus";
import dotenv from "dotenv";
import { testJSON, transformHeatmapData } from "./utils";
dotenv.config({ path: "../.env" });

const lambda = new Lambda({ region: process.env.DEFAULT_REGION });

/* internal route for data retrieval
 * simply gets data from retrieval
 */
export const getDataHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { startDate, endDate, suburb, attributes, address } = event.queryStringParameters || {};
  const isPast = event.path.includes("history");

  // construct event based on params provided by user
  const path = "/data-retrieval/retrieve";
  const historicalPath = "/data-retrieval/retrieve-history";
  const httpMethod = "GET";

  const constructEvent = {
    path: isPast ? historicalPath : path,
    httpMethod: httpMethod,
    queryStringParameters: {
      startDate,
      endDate,
      address,
      suburb,
      attributes,
    },
  } as any;

  const params = {
    FunctionName: `${GROUP_NAME}_${process.env.STAGING_ENV}_${RETRIEVAL_LAMBDA_NAME}`,
    InvocationType: InvocationType.RequestResponse,
    Payload: JSON.stringify(constructEvent),
  };

  try {
    // call lambda
    const response = await lambda.send(new InvokeCommand(params));

    // error condition: no reponse or payload received
    if (!response || !response.Payload) {
      logger.error("getDataHandler: Response payload from retrieval was empty");
      throw new ErrorWithStatus("No return object received from lambda.", 500);
    }

    const data = JSON.parse(response?.Payload?.transformToString() as string);
    // error condition: issue with payload data
    if (!data || data.statusCode !== 200) {
      logger.error(
        "getDataHandler: An issue occured with the payload data obtained from retrieval"
      );
      throw new ErrorWithStatus(
        testJSON(data.body) ? JSON.parse(data.body).message : "An unknown error occurred",
        data?.statusCode
      );
    }

    // success
    logger.info("getDataHandler: Successfully received response from data retrieval");
    return {
      headers,
      statusCode: 200,
      body: data.body,
    };
  } catch (error: any) {
    // unknown exception from data retrieval
    logger.error("getDataHandler: An exception occurred when fetching data from retrieval", error);
    return {
      headers,
      body: JSON.stringify({
        message: error.message,
      }),
      statusCode: error.statusCode,
    };
  }
};

/* external route
 * applies all requested aggregates to all requested attributes
 */
export const analyseHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  let { aggregates } = event.queryStringParameters || {};

  if (!aggregates) {
    aggregates = "";
  }

  try {
    // retrieve requested data
    const response = await getDataHandler(event);

    // error condition: no reponse or payload received
    if (!response || response.statusCode !== 200) {
      logger.error("Response payload from retrieval was empty");
      const responseBody = JSON.parse(response.body);
      return {
        headers,
        body: JSON.stringify({
          message: responseBody.message,
        }),
        statusCode: response.statusCode,
      };
    }
    logger.info("analyseHandler: Successfully received response from data retrieval");

    // analyse the data retrieved
    const body: InputObject = response.body as unknown as InputObject;
    const analyticsResult: ReturnObject = await getAnalytics(body, null, aggregates);

    logger.info("analyseHandler: Successfully analysed data");
    // success
    return {
      headers,
      statusCode: 200,
      body: JSON.stringify(analyticsResult),
    };
  } catch (error: any) {
    // unknown error
    logger.error("analyseHandler: An exception occurred when fetching data from retrieval", error);
    return {
      headers,
      body: JSON.stringify({
        message: error.message,
      }),
      statusCode: error.statusCode,
    };
  }
};

/* internal route for history
 * allows specific aggregate calculations for each requested attribute
 * on a custom weather input object
 */
export const summariseHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // Check for and parse the event body
  let eventBody: SummariseInput;
  if (event.body) {
    try {
      eventBody = JSON.parse(event.body);
    } catch (error: any) {
      eventBody = event.body as unknown as SummariseInput;
    }

    // check if custom weather event and query have been provided
    if (!eventBody.weather || !eventBody.query) {
      logger.error(
        "summariseHandler: event did not contain the required weather and query parameters"
      );
      return {
        headers,
        statusCode: 400,
        body: JSON.stringify({
          message: "This route requires weather and query components in the body",
        }),
      };
    }

    logger.info("summariseHandler: Received all required inputs");
    // analyse the data received
    const analyticsResult: ReturnObject = getAnalytics(eventBody.weather, eventBody.query, null);

    logger.info("summariseHandler: Successfully analysed data");
    // success
    return {
      headers,
      statusCode: 200,
      body: JSON.stringify(analyticsResult),
    };
  } else {
    // error getting the request body */
    logger.error("summariseHandler: Request body is missing");
    return {
      headers,
      statusCode: 400,
      body: JSON.stringify({ message: "Request body is missing" }),
    };
  }
};

/* external route
 * allows specific aggregate calculations for each requested attribute
 * on retrieve weather data
 */
export const analyseSelectiveHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  let eventBody: SummariseInput;
  if (event.body) {
    try {
      eventBody = JSON.parse(event.body);
    } catch (error: any) {
      eventBody = event.body as unknown as SummariseInput;
    }

    // check if query has been provided
    if (!eventBody.query) {
      return {
        headers,
        statusCode: 400,
        body: JSON.stringify({ message: "This route requires a query component in the body" }),
      };
    }
    logger.info("analyseSelectiveHandler: Received all required inputs");

    // retrieve requested data
    const response = await getDataHandler(event);

    // error condition: no reponse or payload received
    if (!response || response.statusCode !== 200) {
      const responseBody = JSON.parse(response.body);
      return {
        headers,
        body: JSON.stringify({
          message: responseBody.message,
        }),
        statusCode: response.statusCode,
      };
    }
    logger.info("analyseSelectiveHandler: Successfully received response from data retrieval");

    // analyse retrieved data
    const data: InputObject = response.body as unknown as InputObject;
    const analyticsResult: ReturnObject = await getAnalytics(data, eventBody.query, null);

    logger.info("analyseSelectiveHandler: Successfully analysed data");
    // success
    return {
      headers,
      statusCode: 200,
      body: JSON.stringify(analyticsResult),
    };
  } else {
    logger.error(
      "analyseSelectiveHandler: An exception occurred when fetching data from retrieval"
    );
    return {
      headers,
      statusCode: 400,
      body: JSON.stringify({ message: "Request body is missing" }),
    };
  }
};

// heatmap handler
export const heatmapHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.queryStringParameters || !event.queryStringParameters.condition) {
      return {
        headers,
        statusCode: 400,
        body: JSON.stringify({ message: "This route requires a condition parameter" }),
      };
    }

    const { condition }: { condition: string } = event.queryStringParameters as any;
    if (!condition || !HEATMAP_AVAILABLE_CONDITIONS.includes(condition)) {
      return {
        headers,
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid condition provided." }),
      };
    }

    const params = {
      FunctionName: `${GROUP_NAME}_${process.env.STAGING_ENV}_${RETRIEVAL_LAMBDA_NAME}`,
      InvocationType: InvocationType.RequestResponse,
      Payload: JSON.stringify({ httpMethod: "GET", path: "/dev/data-retrieval/retrieve-heatmap" }),
    };

    // call lambda
    const response = await lambda.send(new InvokeCommand(params));
    // error condition: no response or payload received
    if (!response || !response.Payload) {
      logger.error("heatmapHandler: Response payload from retrieval was empty");
      throw new ErrorWithStatus("No return object received from lambda.", 500);
    }

    const data = JSON.parse(response?.Payload?.transformToString() as string);
    // error condition: issue with payload data
    if (!data || data.statusCode !== 200) {
      logger.error(
        "heatmapHandler: An issue occured with the payload data obtained from retrieval for heatmap"
      );
      throw new ErrorWithStatus(
        testJSON(data.body) ? JSON.parse(data.body).message : "An unknown error occurred",
        data?.statusCode
      );
    }

    const transformed = transformHeatmapData(JSON.parse(data.body), condition);
    const result = [];
    for (const suburb of transformed) {
      const analysedData = analysis(suburb.data, { [condition]: ["mean"] }, { [condition]: "" });
      result.push({ ...suburb, data: analysedData.analytics[condition].mean });
    }

    return {
      headers,
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error: any) {
    // unknown error
    logger.error("heatmapHandler: An exception occurred when fetching data from retrieval", error);
    return {
      headers,
      body: JSON.stringify({
        message: error.message,
      }),
      statusCode: error.statusCode,
    };
  }
};
