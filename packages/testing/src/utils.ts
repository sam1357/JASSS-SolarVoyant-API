import { format, utcToZonedTime } from "date-fns-tz";
import { addDays, subDays } from "date-fns";
import { CUR_TIMEZONE, DEFAULT_DATE_FORMAT, DEFAULT_THRESHOLD, GROUP_NAME } from "./constants";
import { exec } from "child_process";
import * as fs from "fs";
import S3Service from "./s3Service";
import logger from "./logger";

/**
 * Get the current date in yyyy-MM-dd format adjusted for the Australia/Sydney timezone.
 * @param {number} offsetDays The number of days to add or subtract from the current date.
 * @returns {string} The current date in yyyy-MM-dd format after applying the offset.
 */
export const getDate = (offsetDays: number = 0): string => {
  const currentDate = new Date();
  let adjustedDate: Date;

  if (offsetDays >= 0) {
    adjustedDate = addDays(currentDate, offsetDays);
  } else {
    adjustedDate = subDays(currentDate, Math.abs(offsetDays));
  }

  return formatDate(adjustedDate);
};

/**
 * Given a date string, format it in a given format (default yyyy-MM-dd) in the current timezone
 * @param {Date} date The date to format
 * @param {string=} formatString Optional The format to format date in. Defaults to yyyy-MM-dd
 * @returns {string} The formatted date
 */
export const formatDate = (date: Date, formatString = DEFAULT_DATE_FORMAT): string => {
  const dateInSydneyTimezone = utcToZonedTime(date, CUR_TIMEZONE);
  return format(dateInSydneyTimezone, formatString);
};

/**
 * Runs E2E tests using Jest and returns the JUnit XML report. Also uploads the full report to S3.
 * @returns {Promise<{ statusCode: number; body: Object }>}
 * A promise resolving to an object containing the status code and body.
 */
export const runTests = () => {
  logger.info("E2E Tests: Running E2E tests...");
  const jestCommand = "pnpm jest --ci";

  return new Promise<{ statusCode: number; body: Object }>((resolve) => {
    exec(jestCommand, (_, stdout) => {
      logger.info(`E2E test output:\n${stdout}`);

      const jsonReport = fs.readFileSync("./report/jest-results.json", "utf8");

      resolve({
        statusCode: 200,
        body: JSON.parse(jsonReport),
      });
    });
  });
};

/**
 * Writes the generated full HTML report to S3. Also cleanups old reports if the threshold of
 * number of reports has been reached
 * @returns the name of the new report generated
 */
export const writeReportToS3 = async (): Promise<string> => {
  const fullHtmlReport = fs.readFileSync("./report/report.html", "utf8");
  const timestamp = formatDate(new Date(), "yyyyMMdd_HHmmss");

  const reportName = `report_${timestamp}`;

  const s3 = new S3Service();

  await s3.fetchAndDeleteOldestKey(`${GROUP_NAME}/testReports`, DEFAULT_THRESHOLD);
  await s3.writeBucket(
    `${GROUP_NAME}/testReports/${process.env.STAGING_ENV}/${reportName}`,
    fullHtmlReport
  );
  return reportName;
};

/**
 * Extracts the timestamp portion from a report key formatted as 'report_yyyyMMdd_hhmmss'.
 * @param key The report key.
 * @returns The timestamp portion of the key.
 */
export const extractTimestamp = (key: string): string => {
  const parts = key.split("_");
  if (parts.length >= 3) {
    return parts.slice(1, 3).join("_"); // Extract 'yyyyMMdd_hhmmss'
  }
  return "";
};
