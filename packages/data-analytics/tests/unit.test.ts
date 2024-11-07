import { APIGatewayProxyEvent } from "aws-lambda";
import { handler } from "../src";
import {
  analyseHandler,
  analyseSelectiveHandler,
  getDataHandler,
  summariseHandler,
} from "../src/endpoints";
import { ReturnObject } from "../src/customTypes/dataModel";
import * as kensington from "../tests/sampleData/Kensington.json";
import * as emptyEvents from "../tests/sampleData/sampleData2.json";
import * as emptyAttributes from "../tests/sampleData/sampleData3.json";
import * as datesCheck from "../tests/sampleData/datesCheck.json";
import * as fs from "fs";
import { InvokeCommand } from "@aws-sdk/client-lambda";
import { isInputObject, isReturnObject, testJSON, transformHeatmapData } from "../src/utils";
import { mockClient } from "aws-sdk-client-mock";
import { SNSClient } from "@aws-sdk/client-sns";
import { Uint8ArrayBlobAdapter } from "@smithy/util-stream";

// set up mock client to simulate retrieval microservice
const snsMock = mockClient(SNSClient);

// reset mock before each test
beforeEach(() => {
  snsMock.reset();
});

describe("Basic cases for each endpoint to test route diversion via main handler", () => {
  test("diversion to getDataHandler", async () => {
    const today: Date = new Date();
    const tomorrow: Date = new Date(today.setDate(today.getDate() + 1));

    // set up the mock response
    const f = fs.readFileSync("./tests/sampleData/Kensington.json", {
      encoding: "utf-8",
      flag: "r",
    });
    const payload = Uint8ArrayBlobAdapter.fromString(JSON.stringify({ body: f, statusCode: 200 }));

    // set up request event
    const event: APIGatewayProxyEvent = {
      path: "/data-analytics/get-data",
      httpMethod: "GET",
      queryStringParameters: {
        startDate: today.toISOString().split("T")[0],
        endDate: tomorrow.toISOString().split("T")[0],
        suburb: "Kensington",
        attributes: "temperature_2m, cloud_cover",
      },
    } as any;

    // mock the expected response
    snsMock.on(InvokeCommand).resolves({ Payload: payload });

    // send request through the main handler
    const result = await handler(event);

    // check the status code and layout of the return object
    expect(result.statusCode).toBe(200);
    const parsedBody = JSON.parse(result.body);
    expect(isInputObject(parsedBody)).toBe(true);
  });

  test("diversion to analyseHandler", async () => {
    const today: Date = new Date();
    const tomorrow: Date = new Date(today.setDate(today.getDate() + 1));

    // set up the mock response
    const f = fs.readFileSync("./tests/sampleData/analyticsResolve.json", {
      encoding: "utf-8",
      flag: "r",
    });
    const payload = Uint8ArrayBlobAdapter.fromString(JSON.stringify({ body: f, statusCode: 200 }));

    // set up request event
    const event: APIGatewayProxyEvent = {
      path: "/data-analytics/analyse",
      httpMethod: "GET",
      queryStringParameters: {
        startDate: today.toISOString().split("T")[0],
        endDate: tomorrow.toISOString().split("T")[0],
        suburb: "Kensington",
        attributes: "temperature_2m, cloud_cover",
      },
    } as any;

    // mock the expected response
    snsMock.on(InvokeCommand).resolves({ Payload: payload });

    // send request through the main handler
    const result = await handler(event);

    // check the status code and layout of the return object
    expect(result.statusCode).toBe(200);
    const parsedBody = JSON.parse(result.body);
    expect(isReturnObject(parsedBody)).toBe(true);
  });

  test("diversion to summariseHandler", async () => {
    // set up request event
    const event: APIGatewayProxyEvent = {
      path: "/data-analytics/summarise",
      httpMethod: "POST",
      body: {
        query: {
          temperature_2m: "min, max",
          cloud_cover: "median",
        },
        weather: kensington,
      },
    } as any;

    // no need to mock here - no dependency on any external microservice
    const result = await handler(event);

    // check response status code and layout
    expect(result.statusCode).toBe(200);
    const parsedBody = JSON.parse(result.body);
    expect(isReturnObject(parsedBody)).toBe(true);
  });

  test("diversion to analyseSelectiveHandler", async () => {
    const today: Date = new Date();
    const tomorrow: Date = new Date(today.setDate(today.getDate() + 1));

    // set up the mock response
    const f = fs.readFileSync("./tests/sampleData/analyticsResolve.json", {
      encoding: "utf-8",
      flag: "r",
    });
    const payload = Uint8ArrayBlobAdapter.fromString(JSON.stringify({ body: f, statusCode: 200 }));

    // set up request event
    const event: APIGatewayProxyEvent = {
      path: "/data-analytics/analyse-selective",
      httpMethod: "POST",
      queryStringParameters: {
        startDate: today.toISOString().split("T")[0],
        endDate: tomorrow.toISOString().split("T")[0],
        suburb: "Kensington",
      },
      body: {
        query: {
          temperature_2m: "min, max",
          cloud_cover: "median",
        },
      },
    } as any;

    // mock the expected response
    snsMock.on(InvokeCommand).resolves({ Payload: payload });

    // send request through the main handler
    const result = await handler(event);

    // check response status code and layout
    expect(result.statusCode).toBe(200);
    const parsedBody = JSON.parse(result.body);
    expect(isReturnObject(parsedBody)).toBe(true);
  });

  test("diversion to route not found", async () => {
    // set up incorrect request event
    const event: APIGatewayProxyEvent = {
      path: "/no-such-route",
      httpMethod: "GET",
    } as any;

    // Check if we get the expected error
    // no need for mocking - no external microservice required
    try {
      await handler(event);
    } catch (error) {
      expect(error).toMatchObject({
        statusCode: 404,
        message: "Route not found",
      });
    }
  });

  test("diversion to route not found", async () => {
    // set up incorrect request event
    const event: APIGatewayProxyEvent = {
      httpMethod: "GET",
    } as any;

    // Check if we get the expected error
    // no need for mocking - no external microservice required
    try {
      await handler(event);
    } catch (error) {
      expect(error).toMatchObject({
        statusCode: 400,
        message: "No path provided",
      });
    }
  });

  test("diversion to http method not provided", async () => {
    // set up incorrect request event
    const event: APIGatewayProxyEvent = {
      path: "/data-analytics/get-data",
    } as any;

    // Check if we get the expected error
    // no need for mocking - no external microservice required
    try {
      await handler(event);
    } catch (error) {
      expect(error).toMatchObject({
        statusCode: 400,
        message: "No httpMethod provided",
      });
    }
  });
});

describe("test getDataHandler", () => {
  test("check missing query string parameters", async () => {
    // set up the mock response
    const payload = Uint8ArrayBlobAdapter.fromString(
      JSON.stringify({
        message: "Required params 'suburb', 'startDate' and 'endDate' are missing",
        statusCode: 400,
      })
    );

    // set up request event
    const event: APIGatewayProxyEvent = {
      path: "/data-analytics/get-data",
      httpMethod: "GET",
    } as any;

    // mock the expected response
    snsMock.on(InvokeCommand).resolves({ Payload: payload });

    // Check if we get the expected error
    try {
      await getDataHandler(event);
    } catch (error: any) {
      expect(error).toMatchObject({
        statusCode: 400,
        message: "Required params 'suburb', 'startDate' and 'endDate' are missing",
      });
    }
  });

  test("check error propogation - should return 400 due to missing suburb", async () => {
    const today: Date = new Date();
    const tomorrow: Date = new Date(today.setDate(today.getDate() + 1));

    // set up the mock response
    const payload = Uint8ArrayBlobAdapter.fromString(
      JSON.stringify({
        message: "Required param 'suburb' is missing",
        statusCode: 400,
      })
    );

    // set up request event
    const event: APIGatewayProxyEvent = {
      path: "/data-analytics/get-data",
      httpMethod: "GET",
      queryStringParameters: {
        startDate: today.toISOString().split("T")[0],
        endDate: tomorrow.toISOString().split("T")[0],
        attributes: "temperature_2m, cloud_cover",
      },
    } as any;

    // mock the expected response
    snsMock.on(InvokeCommand).resolves({ Payload: payload });

    // Check if we get the expected error
    try {
      await getDataHandler(event);
    } catch (error: any) {
      expect(error).toMatchObject({
        statusCode: 400,
        message: "Required param 'suburb' is missing",
      });
    }
  });

  test("check error propogation - should return 400 due to start and end dates", async () => {
    // set up the mock response
    const payload = Uint8ArrayBlobAdapter.fromString(
      JSON.stringify({
        message: "Required params 'startDate' and 'endDate' are missing",
        statusCode: 400,
      })
    );

    // set up request event
    const event: APIGatewayProxyEvent = {
      path: "/data-analytics/get-data",
      httpMethod: "GET",
      queryStringParameters: {
        suburb: "Kensington",
        attributes: "temperature_2m, cloud_cover",
      },
    } as any;

    // mock the expected response
    snsMock.on(InvokeCommand).resolves({ Payload: payload });

    // Check if we get the expected error
    try {
      await getDataHandler(event);
    } catch (error: any) {
      expect(error).toMatchObject({
        statusCode: 400,
        message: "Required params 'startDate' and 'endDate' are missing",
      });
    }
  });
});

describe("test analyseHandler", () => {
  test("check missing query string parameters", async () => {
    // set up the mock response
    const payload = Uint8ArrayBlobAdapter.fromString(
      JSON.stringify({
        message: "Required params 'suburb', 'startDate' and 'endDate' are missing",
        statusCode: 400,
      })
    );

    // set up request event
    const event: APIGatewayProxyEvent = {
      path: "/data-analytics/get-data",
      httpMethod: "GET",
    } as any;

    // mock the expected response
    snsMock.on(InvokeCommand).resolves({ Payload: payload });

    // Check if we get the expected error
    try {
      await analyseHandler(event);
    } catch (error: any) {
      expect(error).toMatchObject({
        statusCode: 400,
        message: "Required params 'suburb', 'startDate' and 'endDate' are missing",
      });
    }
  });

  test("should return 400 due to incorrect attributes", async () => {
    const today: Date = new Date();
    const tomorrow: Date = new Date(today.setDate(today.getDate() + 1));
    // set up the mock response
    const payload = Uint8ArrayBlobAdapter.fromString(
      JSON.stringify({
        message: "Invalid aggregate values provided",
        statusCode: 400,
      })
    );

    // set up request event
    const event: APIGatewayProxyEvent = {
      path: "/data-analytics/analyse",
      httpMethod: "GET",
      queryStringParameters: {
        startDate: today.toISOString().split("T")[0],
        endDate: tomorrow.toISOString().split("T")[0],
        suburb: "Kensington",
        attributes: "temperature_2m,cloud_cover",
        aggregates: "mode,average",
      },
    } as any;

    // mock the expected response
    snsMock.on(InvokeCommand).resolves({ Payload: payload });

    // Check if we get the expected error
    try {
      await analyseHandler(event);
    } catch (error: any) {
      expect(error).toMatchObject({
        statusCode: 400,
        message: "Invalid aggregate values provided",
      });
    }
  });
});

describe("test summariseHandler", () => {
  test("diversion to summariseHandler", async () => {
    // set up request event
    const event: APIGatewayProxyEvent = {
      path: "/data-analytics/summarise",
      httpMethod: "POST",
      body: {
        query: {
          temperature_2m: "min, max",
          cloud_cover: "median",
        },
        weather: datesCheck,
      },
    } as any;

    // send request through the handler
    const result = await summariseHandler(event);

    // check the status code and layout of the return object
    expect(result.statusCode).toBe(200);
    const parsedBody = JSON.parse(result.body);
    expect(isReturnObject(parsedBody)).toBe(true);
  });

  test("should return 400 due to empty events array", async () => {
    // set up request event
    const event: APIGatewayProxyEvent = {
      path: "/data-analytics/summarise",
      httpMethod: "POST",
      body: {
        query: {
          temperature_2m: "min, max",
          cloud_cover: "median",
        },
        weather: emptyEvents,
      },
    } as any;

    // Check if we get the expected error
    try {
      await summariseHandler(event);
    } catch (error) {
      expect(error).toMatchObject({
        statusCode: 400,
        message: "Events array cannot be empty",
      });
    }
  });

  test("should return an empty return object due to no attributes", async () => {
    // set up request event
    const event: APIGatewayProxyEvent = {
      path: "/data-analytics/summarise",
      httpMethod: "POST",
      body: {
        query: {
          temperature_2m: "min, max",
          cloud_cover: "median",
        },
        weather: emptyAttributes,
      },
    } as any;

    // send request through the handler
    const result = await summariseHandler(event);

    // check the status code and layout of the return object
    // this is an error case - we should get an empty object
    const body: ReturnObject = JSON.parse(result.body as string);
    expect(body.analytics).toEqual({});
  });

  test("should return 400 due to missing request body", async () => {
    // set up request event
    const event: APIGatewayProxyEvent = {
      path: "/data-analytics/summarise",
      httpMethod: "POST",
    } as any;

    // Check if we get the expected error
    try {
      await summariseHandler(event);
    } catch (error) {
      expect(error).toMatchObject({
        statusCode: 400,
        message: "Request body is missing",
      });
    }
  });

  test("should return 400 due to missing query object", async () => {
    // set up request event
    const event: APIGatewayProxyEvent = {
      path: "/data-analytics/summarise",
      httpMethod: "POST",
      body: {
        weather: kensington,
      },
    } as any;

    // Check if we get the expected error
    try {
      await summariseHandler(event);
    } catch (error) {
      expect(error).toMatchObject({
        statusCode: 400,
        message: "This route requires weather and query components in the body",
      });
    }
  });
});

describe("test analyseSelectiveHandler", () => {
  test("should return 400 due to missing request body", async () => {
    // set up the mock response
    const payload = Uint8ArrayBlobAdapter.fromString(
      JSON.stringify({
        message: "Request body is missing",
        statusCode: 400,
      })
    );

    // set up request event
    const event: APIGatewayProxyEvent = {
      path: "/data-analytics/summarise-selective",
      httpMethod: "POST",
    } as any;

    // mock the expected response
    snsMock.on(InvokeCommand).resolves({ Payload: payload });

    // Check if we get the expected error
    try {
      await analyseSelectiveHandler(event);
    } catch (error) {
      expect(error).toMatchObject({
        statusCode: 400,
        message: "Request body is missing",
      });
    }
  });

  test("should return 400 due to missing query object", async () => {
    // set up the mock response
    const payload = Uint8ArrayBlobAdapter.fromString(
      JSON.stringify({
        message: "This route requires a query component in the body",
        statusCode: 400,
      })
    );

    // set up request event
    const event: APIGatewayProxyEvent = {
      path: "/data-analytics/summarise-selective",
      httpMethod: "POST",
      body: {
        weather: kensington,
      },
    } as any;

    // mock the expected response
    snsMock.on(InvokeCommand).resolves({ Payload: payload });

    // Check if we get the expected error
    try {
      await analyseSelectiveHandler(event);
    } catch (error) {
      expect(error).toMatchObject({
        statusCode: 400,
        message: "This route requires a query component in the body",
      });
    }
  });
});

describe("testJSON function", () => {
  test("should return true for valid JSON string", () => {
    // eslint-disable-next-line
    const validJSONString = `{"name": "John", "age": 30}`;
    expect(testJSON(validJSONString)).toBe(true);
  });

  test("should return false for invalid JSON string", () => {
    // eslint-disable-next-line
    const invalidJSONString = `{"name": "John", "age": 30`;
    expect(testJSON(invalidJSONString)).toBe(false);
  });

  test("should return false for empty string", () => {
    const emptyString = "";
    expect(testJSON(emptyString)).toBe(false);
  });
});

describe("transformHeatmapData function", () => {
  test("should transform the data correctly", () => {
    const transformedData = [
      {
        suburb: "Kensington",
        placeId: "123",
        data: {
          shortwave_radiation: [0, 1],
        },
      },
    ];

    const rawData = [
      {
        suburb: "Kensington",
        placeId: "123",
        data: [
          {
            timestamp: "2021-01-01T00:00:00Z",
            shortwave_radiation: 0,
          },
          {
            timestamp: "2021-01-01T01:00:00Z",
            shortwave_radiation: 1,
          },
        ],
      },
    ];

    expect(transformHeatmapData(rawData, "shortwave_radiation")).toEqual(transformedData);
  });
});

describe("test heatmapHandler, including error cases through mocking", () => {
  test("should return 500 due to empty response", async () => {
    // set up the mock response
    const payload = Uint8ArrayBlobAdapter.fromString(
      JSON.stringify({
        message: "No return object received from lambda.",
        statusCode: 500,
      })
    );

    // set up request event
    const event: APIGatewayProxyEvent = {
      path: "/data-analytics/analyse-heatmap",
      httpMethod: "GET",
      queryStringParameters: { condition: "shortwave_radiation" },
    } as any;

    // mock the expected response
    snsMock.on(InvokeCommand).resolves({ Payload: payload });

    // Check if we get the expected error
    try {
      await handler(event);
    } catch (error: any) {
      expect(error).toMatchObject({
        statusCode: 500,
        message: "No return object received from lambda.",
      });
    }
  });

  test("should return 500 due to issue with payload data", async () => {
    // set up the mock response
    const payload = Uint8ArrayBlobAdapter.fromString(
      JSON.stringify({
        statusCode: 400,
        body: JSON.stringify({ message: "An unknown error occurred" }),
      })
    );

    // set up request event
    const event: APIGatewayProxyEvent = {
      path: "/data-analytics/analyse-heatmap",
      httpMethod: "GET",
    } as any;

    // mock the expected response
    snsMock.on(InvokeCommand).resolves({ Payload: payload });

    // Check if we get the expected error
    try {
      await handler(event);
    } catch (error: any) {
      expect(error).toMatchObject({
        statusCode: 400,
        message: "An unknown error occurred",
      });
    }
  });
});
