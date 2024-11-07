import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { GROUP_NAME } from "@src/constants";
import { handler } from "@src/index";
import S3Service from "@src/s3Service";
import * as fs from "fs";
import { forecastTest } from "./resources/forecastTest";
import { mockClient } from "aws-sdk-client-mock";

function readFile(path: string): string {
  return fs.readFileSync(path, { encoding: "utf-8", flag: "r" });
}

const historyTest = readFile("./tests/resources/historyTest.json");
const malformedHistory = readFile("./tests/resources/malformedHistory.json");

const keyRootPath = `${GROUP_NAME}/weatherData/test`;

const mockS3Client = mockClient(S3Client);

// timeouts are used throughout the test to isolate each test case from each other
describe("handler", () => {
  afterEach(async () => {
    mockS3Client.reset();
    mockS3Client.restore();
  });

  it("fails due to missing key", async () => {
    mockS3Client.on(GetObjectCommand).rejects(new Error("The specified key does not exist."));

    const result = await handler({
      queryStringParameters: { testKeys: JSON.stringify([`${keyRootPath}/forecast/Test.json`]) },
    } as any);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).message).toBe(
      "Failed to process for suburb Test. Error: The specified key does not exist."
    );
  });

  it("fails due to malformed history", async () => {
    const s3 = new S3Service();

    s3.writeBucket(`${keyRootPath}/forecast/Test.json`, JSON.stringify(forecastTest));
    s3.writeBucket(`${keyRootPath}/history/Test.json`, malformedHistory);
    await new Promise((f) => setTimeout(f, 500));

    const result = await handler({
      queryStringParameters: { testKeys: JSON.stringify([`${keyRootPath}/forecast/Test.json`]) },
    } as any);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).message).toBe(
      "Failed to process for suburb Test. Error: Malformed history for Test. \
Please run the fetch history microservice."
    );
  });

  it("succeeds", async () => {
    const s3 = new S3Service();

    s3.writeBucket(`${keyRootPath}/forecast/Test1.json`, JSON.stringify(forecastTest));
    s3.writeBucket(`${keyRootPath}/history/Test1.json`, historyTest);
    await new Promise((f) => setTimeout(f, 500));

    const result = await handler({
      queryStringParameters: { testKeys: JSON.stringify([`${keyRootPath}/forecast/Test1.json`]) },
    } as any);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).message).toBe("Operation completed successfully.");

    const newData = await s3.readBucket(`${keyRootPath}/history/Test1.json`);
    const oldData = JSON.parse(historyTest);

    expect(newData).not.toEqual(oldData);
    expect(newData.events.length).toBeGreaterThan(oldData.events.length);
    // check data was relatively recently refreshed (10 seconds)
    expect(new Date(newData.time_object.timestamp).getTime() - new Date().getTime()).toBeLessThan(
      10000
    );

    // trying again should not result in error as it would just skip over
    const result2 = await handler({
      queryStringParameters: { testKeys: JSON.stringify([`${keyRootPath}/forecast/Test1.json`]) },
    } as any);

    expect(result2.statusCode).toBe(200);
    expect(JSON.parse(result2.body).message).toBe("Operation completed successfully.");
  });
});
