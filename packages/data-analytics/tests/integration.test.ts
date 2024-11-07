import { APIGatewayProxyEvent } from "aws-lambda";
import { handler } from "../src";
import * as kensington from "../tests/sampleData/Kensington.json";
import { isInputObject, isReturnObject } from "../src/utils";

describe("full integration test", () => {
  test("getDataHandler", async () => {
    const today: Date = new Date();
    const dayAfterTomorrow: Date = new Date(today.setDate(today.getDate() + 2));
    const expectedUnits = { time: "iso8601", temperature_2m: "°C", cloud_cover: "%" };

    // set up request event
    const event: APIGatewayProxyEvent = {
      path: "/data-analytics/get-data",
      httpMethod: "GET",
      queryStringParameters: {
        startDate: today.toISOString().split("T")[0],
        endDate: dayAfterTomorrow.toISOString().split("T")[0],
        suburb: "Kensington",
        attributes: "temperature_2m, cloud_cover",
      },
    } as any;

    // send request through the main handler
    const response = await handler(event);

    // check if the received response matches the expected format and values
    expect(response.statusCode).toBe(200);
    const parsedBody = JSON.parse(response.body);
    expect(isInputObject(parsedBody)).toBe(true);
    expect(parsedBody.events[0].attributes.units).toEqual(expectedUnits);
  }, 10000);

  test("getDataHandler", async () => {
    const today: Date = new Date();
    const dayAfterTomorrow: Date = new Date(today.setDate(today.getDate() + 2));
    const expectedUnits = { time: "iso8601", temperature_2m: "°C", cloud_cover: "%" };

    // set up request event
    const event: APIGatewayProxyEvent = {
      path: "/data-analytics/get-data",
      httpMethod: "GET",
      queryStringParameters: {
        startDate: today.toISOString().split("T")[0],
        endDate: dayAfterTomorrow.toISOString().split("T")[0],
        address: "12 Balfour Rd",
        attributes: "temperature_2m, cloud_cover",
      },
    } as any;

    // send request through the main handler
    const response = await handler(event);

    // check if the received response matches the expected format and values
    expect(response.statusCode).toBe(200);
    const parsedBody = JSON.parse(response.body);
    expect(isInputObject(parsedBody)).toBe(true);
    expect(parsedBody.events[0].attributes.units).toEqual(expectedUnits);
  }, 10000);

  test("analyseHandler", async () => {
    const today: Date = new Date();
    const dayAfterTomorrow: Date = new Date(today.setDate(today.getDate() + 2));

    // set up request event
    const event: APIGatewayProxyEvent = {
      path: "/data-analytics/analyse",
      httpMethod: "GET",
      queryStringParameters: {
        startDate: today.toISOString().split("T")[0],
        endDate: dayAfterTomorrow.toISOString().split("T")[0],
        suburb: "Kensington",
        attributes: "temperature_2m, cloud_cover",
      },
    } as any;

    // send request through the main handler
    const response = await handler(event);

    // check if the received response matches the expected format and values
    expect(response.statusCode).toBe(200);
    const parsedBody = JSON.parse(response.body);
    expect(isReturnObject(parsedBody)).toBe(true);
  }, 10000);

  test("summariseHandler", async () => {
    // set up request event
    const event: APIGatewayProxyEvent = {
      path: "/data-analytics/summarise",
      httpMethod: "POST",
      body: {
        query: {
          temperature_2m: "min, max, mean, median",
          cloud_cover: "standard_deviation, variance, mode",
        },
        weather: kensington,
      },
    } as any;

    // send request through the main handler
    const response = await handler(event);

    // check if the received response matches the expected format and values
    expect(response.statusCode).toBe(200);
    const parsedBody = JSON.parse(response.body);
    expect(isReturnObject(parsedBody)).toBe(true);

    // check if the attributes have been filtered correctly
    expect(parsedBody.analytics).toMatchObject({
      cloud_cover: {
        mode: expect.arrayContaining([expect.any(Number)]),
        standard_deviation: expect.any(Number),
        variance: expect.any(Number),
      },
      temperature_2m: {
        max: expect.any(Number),
        mean: expect.any(Number),
        median: expect.any(Number),
        min: expect.any(Number),
      },
    });
  }, 10000);

  test("analyseSelectiveHandler", async () => {
    const today: Date = new Date();
    const dayAfterTomorrow: Date = new Date(today.setDate(today.getDate() + 2));

    // set up request event
    const event: APIGatewayProxyEvent = {
      path: "/data-analytics/analyse-selective",
      httpMethod: "POST",
      queryStringParameters: {
        startDate: today.toISOString().split("T")[0],
        endDate: dayAfterTomorrow.toISOString().split("T")[0],
        suburb: "Kensington",
      },
      body: {
        query: {
          temperature_2m: "min, max, mean, median",
          cloud_cover: "standard_deviation, variance, mode",
        },
      },
    } as any;

    // send request through the main handler
    const response = await handler(event);

    // check if the received response matches the expected format and values
    expect(response.statusCode).toBe(200);
    const parsedBody = JSON.parse(response.body);
    expect(isReturnObject(parsedBody)).toBe(true);

    // check if the attributes have been filtered correctly
    expect(parsedBody.analytics).toMatchObject({
      cloud_cover: {
        mode: expect.arrayContaining([expect.any(Number)]),
        standard_deviation: expect.any(Number),
        variance: expect.any(Number),
      },
      temperature_2m: {
        max: expect.any(Number),
        mean: expect.any(Number),
        median: expect.any(Number),
        min: expect.any(Number),
      },
    });
  }, 10000);

  test("analyseHandler Historical", async () => {
    const today: Date = new Date();
    const dayBeforeYesterday = new Date(today);
    const yesterday = new Date(today);

    dayBeforeYesterday.setDate(today.getDate() - 2);
    yesterday.setDate(today.getDate() - 1);

    // set up request event
    const event: APIGatewayProxyEvent = {
      path: "/data-analytics/analyse-history",
      httpMethod: "GET",
      queryStringParameters: {
        startDate: dayBeforeYesterday.toISOString().split("T")[0],
        endDate: yesterday.toISOString().split("T")[0],
        suburb: "Kensington",
        attributes: "temperature_2m, cloud_cover",
      },
    } as any;

    // send request through the main handler
    const response = await handler(event);

    // check if the received response matches the expected format and values
    expect(response.statusCode).toBe(200);
    const parsedBody = JSON.parse(response.body);
    expect(isReturnObject(parsedBody)).toBe(true);
  }, 10000);

  test("analyseSelectiveHandler History", async () => {
    const today: Date = new Date();
    const dayBeforeYesterday = new Date(today);
    const yesterday = new Date(today);

    dayBeforeYesterday.setDate(today.getDate() - 2);
    yesterday.setDate(today.getDate() - 1);

    // set up request event
    const event: APIGatewayProxyEvent = {
      path: "/data-analytics/analyse-selective-history",
      httpMethod: "POST",
      queryStringParameters: {
        startDate: dayBeforeYesterday.toISOString().split("T")[0],
        endDate: yesterday.toISOString().split("T")[0],
        suburb: "Kensington",
      },
      body: {
        query: {
          temperature_2m: "min, max, mean, median",
          cloud_cover: "standard_deviation, variance, mode",
        },
      },
    } as any;

    // send request through the main handler
    const response = await handler(event);

    // check if the received response matches the expected format and values
    expect(response.statusCode).toBe(200);
    const parsedBody = JSON.parse(response.body);
    expect(isReturnObject(parsedBody)).toBe(true);

    // check if the attributes have been filtered correctly
    expect(parsedBody.analytics).toMatchObject({
      cloud_cover: {
        mode: expect.arrayContaining([expect.any(Number)]),
        standard_deviation: expect.any(Number),
        variance: expect.any(Number),
      },
      temperature_2m: {
        max: expect.any(Number),
        mean: expect.any(Number),
        median: expect.any(Number),
        min: expect.any(Number),
      },
    });
  }, 10000);

  test("analyseSelectiveHandler History given invalid aggregates", async () => {
    const today: Date = new Date();
    const dayBeforeYesterday = new Date(today);
    const yesterday = new Date(today);

    dayBeforeYesterday.setDate(today.getDate() - 2);
    yesterday.setDate(today.getDate() - 1);

    // set up request event
    const event: APIGatewayProxyEvent = {
      path: "/data-analytics/analyse-selective-history",
      httpMethod: "POST",
      queryStringParameters: {
        startDate: dayBeforeYesterday.toISOString().split("T")[0],
        endDate: yesterday.toISOString().split("T")[0],
        suburb: "Kensington",
      },
      body: {
        query: {
          temperature_2m: "minecraft, max, mean, median",
          cloud_cover: "standard_deviation, variance, mode",
        },
      },
    } as any;

    // send request through the main handler
    const response = await handler(event);

    // check if the received response matches the expected format and values
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toEqual("Invalid aggregate values provided");
  }, 10000);

  test("analyseSelectiveHandler History given future date", async () => {
    const today: Date = new Date();
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(today.getDate() + 2);
    const dayBeforeYesterday = new Date(today);
    dayBeforeYesterday.setDate(today.getDate() - 2);

    // set up request event
    const event: APIGatewayProxyEvent = {
      path: "/data-analytics/analyse-selective-history",
      httpMethod: "POST",
      queryStringParameters: {
        startDate: dayBeforeYesterday.toISOString().split("T")[0],
        endDate: dayAfterTomorrow.toISOString().split("T")[0],
        suburb: "Kensington",
      },
      body: {
        query: {
          temperature_2m: "min, max, mean, median",
          cloud_cover: "standard_deviation, variance, mode",
        },
      },
    } as any;

    // send request through the main handler
    const response = await handler(event);

    // check if the received response matches the expected format and values
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toEqual("End Date cannot be in the future");
  }, 10000);

  test("analyseSelectiveHandler given past date", async () => {
    const today: Date = new Date();
    const dayBeforeYesterday = new Date(today);
    dayBeforeYesterday.setDate(today.getDate() - 2);

    // set up request event
    const event: APIGatewayProxyEvent = {
      path: "/data-analytics/analyse-selective",
      httpMethod: "POST",
      queryStringParameters: {
        startDate: dayBeforeYesterday.toISOString().split("T")[0],
        endDate: today.toISOString().split("T")[0],
        suburb: "Kensington",
      },
      body: {
        query: {
          temperature_2m: "min, max, mean, median",
          cloud_cover: "standard_deviation, variance, mode",
        },
      },
    } as any;

    // send request through the main handler
    const response = await handler(event);

    // check if the received response matches the expected format and values
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toEqual("Start Date cannot be in the past");
  }, 10000);

  test("analyseHandler History given future date", async () => {
    const today: Date = new Date();
    const dayAfterTomorrow = new Date(today);
    const dayBeforeYesterday = new Date(today);
    dayBeforeYesterday.setDate(today.getDate() - 2);
    dayAfterTomorrow.setDate(today.getDate() + 2);

    // set up request event
    const event: APIGatewayProxyEvent = {
      path: "/data-analytics/analyse-history",
      httpMethod: "GET",
      queryStringParameters: {
        startDate: dayBeforeYesterday.toISOString().split("T")[0],
        endDate: dayAfterTomorrow.toISOString().split("T")[0],
        suburb: "Kensington",
      },
      body: {
        query: {
          temperature_2m: "min, max, mean, median",
          cloud_cover: "standard_deviation, variance, mode",
        },
      },
    } as any;

    // send request through the main handler
    const response = await handler(event);

    // check if the received response matches the expected format and values
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toEqual("End Date cannot be in the future");
  }, 10000);

  test("analyseHandler given past date", async () => {
    const today: Date = new Date();
    const dayBeforeYesterday = new Date(today);
    dayBeforeYesterday.setDate(today.getDate() - 2);

    // set up request event
    const event: APIGatewayProxyEvent = {
      path: "/data-analytics/analyse",
      httpMethod: "GET",
      queryStringParameters: {
        startDate: dayBeforeYesterday.toISOString().split("T")[0],
        endDate: today.toISOString().split("T")[0],
        suburb: "Kensington",
      },
      body: {
        query: {
          temperature_2m: "min, max, mean, median",
          cloud_cover: "standard_deviation, variance, mode",
        },
      },
    } as any;

    // send request through the main handler
    const response = await handler(event);

    // check if the received response matches the expected format and values
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toEqual("Start Date cannot be in the past");
  }, 10000);

  test("heatmap handler without queryStringParams", async () => {
    // set up request event
    const event: APIGatewayProxyEvent = {
      path: "/data-analytics/analyse-heatmap",
      httpMethod: "GET",
    } as any;

    // send request through the main handler
    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toEqual("This route requires a condition parameter");
  });

  test("heatmap handler given invalid condition", async () => {
    // set up request event
    const event: APIGatewayProxyEvent = {
      path: "/data-analytics/analyse-heatmap",
      httpMethod: "GET",
      queryStringParameters: { condition: "temperature_2m, cloud_cover" },
    } as any;

    // send request through the main handler
    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toEqual("Invalid condition provided.");
  });

  test("heatmap handler full integration test", async () => {
    // set up request event
    const event: APIGatewayProxyEvent = {
      path: "/data-analytics/analyse-heatmap",
      httpMethod: "GET",
      queryStringParameters: { condition: "temperature_2m" },
    } as any;

    // send request through the main handler
    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();
  });
});
