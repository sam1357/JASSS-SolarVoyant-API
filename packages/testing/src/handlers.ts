import { runTests, writeReportToS3 } from "./utils";
import { API_ENDPOINT, GROUP_NAME } from "./constants";
import S3Service from "./s3Service";
import logger from "./logger";

/**
 * Runs smoke tests and writes the report to S3.
 * @returns A promise resolving to a string representing the result body.
 */
export async function RunTestsHandler(): Promise<Object> {
  const result = await runTests();
  const reportName = await writeReportToS3();
  logger.info("End to end tests completed successfully.");
  return {
    detailedReport: `/fetch-report?reportKey=${reportName}`,
    endpointTested: API_ENDPOINT,
    stagingEnv: process.env.STAGING_ENV,
    ...result.body,
  };
}

/**
 * Lists all reports stored in S3 under the specified directory.
 * @returns A promise resolving to a string representing the list of report keys.
 */
export async function ListReportsHandler(): Promise<string> {
  const data = await new S3Service().fetchKeys(
    `${GROUP_NAME}/testReports/${process.env.STAGING_ENV}`
  );
  return JSON.stringify({ reportKeys: data.map((k) => k.Key?.slice(1).split("/").pop()) });
}

/**
 * Fetches a report from S3 based on the provided report key.
 * @param reportKey The key of the report to fetch.
 * @returns A promise resolving to a string representing the fetched report.
 */
export async function FetchReportHandler(reportKey: string): Promise<string> {
  return await new S3Service().readBucket(
    `${GROUP_NAME}/testReports/${process.env.STAGING_ENV}/${reportKey}`
  );
}
