import { APIGatewayEvent, APIGatewayProxyResult, LambdaFunctionURLEvent } from "aws-lambda";
import { handler } from "../src";

describe("Paths/Methods not provided", () => {
  it("test no path", async () => {
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          method: "GET",
        },
      },
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    const returnObj: string = JSON.stringify({ message: "No path provided" });
    expect(response.body).toStrictEqual(returnObj);
    expect(response.statusCode).toBe(400);
  });

  it("test no method", async () => {
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/calculator/calculateSuburb"
        },
      },
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    const returnObj: string = JSON.stringify({ message: "No httpMethod provided" });
    expect(response.body).toStrictEqual(returnObj);
    expect(response.statusCode).toBe(400);
  });

  it("unrecognised path/method combination #1", async () => {
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/calculator/calculateSuburb",
          method: "POST"
        },
      },
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    const returnObj: string = JSON.stringify({
      message: "Unrecognised path and method combination",
    });
    expect(response.body).toStrictEqual(returnObj);
    expect(response.statusCode).toBe(400);
  });

  it("unrecognised path/method combination #2", async () => {
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/calculator/non-existent",
          method: "GET"
        },
      },
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    const returnObj: string = JSON.stringify({
      message: "Unrecognised path and method combination",
    });
    expect(response.body).toStrictEqual(returnObj);
    expect(response.statusCode).toBe(400);
  });
});

describe("Full integration test for CALCULATE SUBURB", () => {

  it("suburb param missing", async () => {
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/calculator/calculateSuburb",
          method: "GET"
        },
      },
    } as any;
    event.queryStringParameters = {
      "A": "B",
    };
    const response: APIGatewayProxyResult = await handler(event);
    const returnObj: string = JSON.stringify({
      message: "Required param surfaceArea is missing.",
    });
    expect(response.body).toStrictEqual(returnObj);
    expect(response.statusCode).toBe(400);
  });

  it("invalid suburb name", async () => {
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/calculator/calculateSuburb",
          method: "GET"
        },
      },
    } as any;
    event.queryStringParameters = {
      "suburb": "B",
      "surfaceArea": "10"
    };
    const response: APIGatewayProxyResult = await handler(event);
    const returnObj: string = JSON.stringify({
      message: "Invalid suburb name 'B'",
    });
    expect(response.body).toStrictEqual(returnObj);
    expect(response.statusCode).toBe(400);
  });

  
  it("valid suburb name", async () => {
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/calculator/calculateSuburb",
          method: "GET"
        },
      },
    } as any;
    event.queryStringParameters = {
      "suburb": "Panania",
      "surfaceArea": "100"
    };
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain("energyGeneration");
  });

});

