import { handler } from "@src/index";
import { S3Client, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { GROUP_NAME } from "@src/constants";
import { fromEnv } from "@aws-sdk/credential-providers";
import { ADAGEDataModel } from "@src/interfaces";
import { APIGatewayProxyEvent } from "aws-lambda";
import * as fs from "fs";

describe("full integration test normal preprocessing", () => {
  test("normal preprocess", async () => {
    const s3 = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      credentials: fromEnv(),
      region: process.env.DEFAULT_REGION,
    });

    const event: APIGatewayProxyEvent = {
      queryStringParameters: { testPath: "SE3011-24-F14A-03/suburbsData/sydney_suburbs_test.json" },
    } as any;

    const res = await handler(event);

    expect(res.statusCode).toEqual(200);

    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.BUCKET,
      Key: `${GROUP_NAME}/weatherData/forecast/Abbotsbury.json`,
    });

    // wait for changes to propagate
    await new Promise((r) => setTimeout(r, 3000));

    const s3File = await s3.send(getObjectCommand);
    expect(s3File).toBeDefined();
    const formattedRes: ADAGEDataModel = JSON.parse(
      (await s3File.Body?.transformToString()) as string
    );

    // check that timestamp of this file is around the current time (difference < 10 seconds)
    expect(
      Math.abs(new Date(formattedRes.time_object.timestamp).getTime() - new Date().getTime())
    ).toBeLessThanOrEqual(12000);
    expect(formattedRes.data_source).toEqual("Weather API");
    expect(formattedRes.dataset_type).toEqual("Weather/Climate Data");
    expect(formattedRes.dataset_id).toEqual(
      "https://s3.console.aws.amazon.com/s3/buckets/seng3011-student?region=ap-southeast-2&bucketTy\
pe=general&prefix=SE3011-24-F14A-03/&showversions=false"
    );
    expect(formattedRes.time_object.timestamp).toBeDefined();
    expect(formattedRes.time_object.timezone).toEqual("Australia/Sydney");
    // 24 * 7 hourly events, + 7 daily events
    expect(formattedRes.events.length).toEqual(175);
  }, 20000);
});

describe("full integration test - history", () => {
  test("history preprocess", async () => {
    const s3 = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      credentials: fromEnv(),
      region: process.env.DEFAULT_REGION,
    });

    const event: APIGatewayProxyEvent = {
      "httpMethod": "POST",
      "path": "/dev/data-preprocessing/history-process",
      "body": JSON.parse(
        fs.readFileSync("./tests/resources/historyTest.json", {
          encoding: "utf-8",
          flag: "r",
        })
      ),
    } as any;

    const res = await handler(event);

    expect(res.statusCode).toEqual(200);

    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.BUCKET,
      Key: `${GROUP_NAME}/weatherData/history/Test.json`,
    });

    const deleteObjectCommand = new DeleteObjectCommand({
      Bucket: process.env.BUCKET,
      Key: `${GROUP_NAME}/weatherData/history/Test.json`,
    });

    // wait for changes to propagate
    await new Promise((r) => setTimeout(r, 3000));

    const s3File = await s3.send(getObjectCommand);
    expect(s3File).toBeDefined();
    const formattedRes: ADAGEDataModel = JSON.parse(
      (await s3File.Body?.transformToString()) as string
    );

    // delete file after completion
    await s3.send(deleteObjectCommand);

    // check that timestamp of this file is around the current time (difference < 10 seconds)
    expect(
      Math.abs(new Date(formattedRes.time_object.timestamp).getTime() - new Date().getTime())
    ).toBeLessThanOrEqual(14000);
    expect(formattedRes.data_source).toEqual("Weather API");
    expect(formattedRes.dataset_type).toEqual("Weather/Climate Data");
    expect(formattedRes.dataset_id).toEqual(
      "https://s3.console.aws.amazon.com/s3/buckets/seng3011-student?region=ap-southeast-2&bucketTy\
pe=general&prefix=SE3011-24-F14A-03/&showversions=false"
    );
    expect(formattedRes.time_object.timestamp).toBeDefined();
    expect(formattedRes.time_object.timezone).toEqual("Australia/Sydney");
    // 3 events
    expect(formattedRes.events.length).toEqual(3);
    formattedRes.events.forEach((e) => expect(e.event_type).toEqual("historical"));
  }, 10000);
});
