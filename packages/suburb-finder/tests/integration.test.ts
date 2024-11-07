import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { handler } from "../src";
import { mockFetch } from "./helpers/mockFetch";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import { Uint8ArrayBlobAdapter } from "@smithy/util-stream";

describe("Address not provided", () => {
  it("Test no param provided", async () => {
    const event: APIGatewayEvent = {} as any;
    event.httpMethod = "GET";
    const response: APIGatewayProxyResult = await handler(event);
    const returnObj: string = JSON.stringify({ message: "No 'address' param provided" });
    expect(response.body).toStrictEqual(returnObj);
    expect(response.statusCode).toBe(400);
  });

  it("Test not a get request", async () => {
    const event: APIGatewayEvent = {} as any;
    event.httpMethod = "POST";
    event.queryStringParameters = {
      address: "A",
    };
    const response: APIGatewayProxyResult = await handler(event);
    const returnObj: string = JSON.stringify({ message: "httpMethod must be 'GET'" });
    expect(response.body).toStrictEqual(returnObj);
    expect(response.statusCode).toBe(405);
  });

  it("Test no httpMethod provided", async () => {
    const event: APIGatewayEvent = {} as any;
    event.queryStringParameters = {
      address: "A",
    };
    const response: APIGatewayProxyResult = await handler(event);
    const returnObj: string = JSON.stringify({ message: "httpMethod must be 'GET'" });
    expect(response.body).toStrictEqual(returnObj);
    expect(response.statusCode).toBe(405);
  });
});

describe("Address provided", () => {
  const mockS3 = mockClient(S3Client);

  afterEach(() => {
    mockS3.reset();
  });

  jest.spyOn(global, "fetch").mockImplementation(mockFetch);

  it("Address not in Australia", async () => {
    const event: APIGatewayEvent = {} as any;

    mockS3.on(GetObjectCommand).resolves({
      Body: Uint8ArrayBlobAdapter.fromString(
        JSON.stringify([{ suburb: "The Rocks", longitude: 20, latitude: 20 }])
      ) as any,
    });

    event.httpMethod = "GET";
    event.queryStringParameters = {
      "address": "3 Chome-38-1 Shinjuku, Shinjuku City",
    };
    const response: APIGatewayProxyResult = await handler(event);
    const returnObj: string = JSON.stringify({
      message: "Address not recognised by 'Google Maps' as one in Sydney",
    });
    expect(response.body).toStrictEqual(returnObj);
    expect(response.statusCode).toBe(400);
  });

  it("Address in Sydney", async () => {
    const event: APIGatewayEvent = {} as any;
    event.httpMethod = "GET";

    mockS3.on(GetObjectCommand).resolves({
      Body: Uint8ArrayBlobAdapter.fromString(
        JSON.stringify([{ suburb: "The Rocks", longitude: 20, latitude: 20 }])
      ) as any,
    });

    event.queryStringParameters = {
      address: "21 Hinemoa Street",
    };
    const response: APIGatewayProxyResult = await handler(event);

    expect(JSON.parse(response.body).suburbs).toBeDefined();
    expect(response.statusCode).toBe(200);
  });
});
