import * as fs from "fs";
import path from "path";

import {
  JSONData,
  Event,
  SuburbData,
  HeatmapRawData,
  HeatmapTransformedData,
} from "./types/dataInterface";
import { ErrorWithStatus } from "./types/errorWithStatus";
import {
  DATE_REGEX,
  GROUP_NAME,
  HEATMAP_FETCH_CUTOFF,
  HISTORY_CUTOFF_DATE,
  SUBURB_LAMBDA_NAME,
  USER_DATA_LAMBDA_NAME,
  VALID_ATTRIBUTES,
  docClient,
  tableName,
} from "./constants";
import { APIGatewayProxyEvent, LambdaFunctionURLEvent } from "aws-lambda";
import { InvocationType, InvokeCommand, Lambda } from "@aws-sdk/client-lambda";
import { logger } from "./constants";
import { deleteFromBucket, readBucket } from "./s3";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import numeric from "numeric";

/**
 * Takes in an address and uses google's API To convert to a Sydney suburb
 * @param address the address to convert
 * @returns the suburb the addres belongs to
 */
export async function getSuburb(address: string): Promise<string> {
  const constructEvent: APIGatewayProxyEvent = {
    path: "/address-to-suburb/get-suburb",
    httpMethod: "GET",
    queryStringParameters: {
      address: address,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  const params = {
    FunctionName: `${GROUP_NAME}_${process.env.STAGING_ENV}_${SUBURB_LAMBDA_NAME}`,
    InvocationType: InvocationType.RequestResponse,
    Payload: JSON.stringify(constructEvent),
  };

  const lambda = new Lambda({ region: process.env.DEFAULT_REGION });

  let response;
  try {
    response = await lambda.send(new InvokeCommand(params));
  } catch (error) {
    logger.error("Exception thrown when fetching from suburb finder", JSON.stringify(error));
    throw new ErrorWithStatus("Exception occured when fetching from suburb finder", 400);
  }

  if (!response || !response.Payload) {
    logger.error("Response payload from suburb_finder was empty");
    throw new ErrorWithStatus("No return object received from lambda.", 500);
  }

  const data = JSON.parse(response?.Payload?.transformToString() as string);
  if (!data || data.statusCode !== 200) {
    logger.error("An issue occured with the payload data obtained from retrieval");
    throw new ErrorWithStatus(`Unable to find address for ${address}`, data?.statusCode);
  }

  const suburbs = JSON.parse(data.body)["suburbs"];
  return suburbs[0] ?? "";
}
/**
 * Validates the necessary parameters to user provides to retrieve and filter weather data
 * @param suburb name of suburb.
 * @param startDate the start date of date filtering.
 * @param endDate the end date of date filtering.
 * @param attributes the weather conditions the user wants. Can be an empty string.
 * @param timeFrame is either "history" or "forecast".
 * @returns nothing if all parameters are valid, otherwise throws errors.
 */
export function validateInputs(
  suburb: string,
  startDate: string,
  endDate: string,
  attributes: string,
  timeFrame: string
) {
  //// (1) Validate suburb
  const suburbsListPath: string = path.join(__dirname, "resources", "suburbsList.json");
  const validSuburbs: readonly string[] = JSON.parse(fs.readFileSync(suburbsListPath, "utf8"))[
    "output"
  ];

  if (!validSuburbs.includes(suburb.toLowerCase())) {
    throw new ErrorWithStatus(`Unrecognised suburb '${suburb}'`, 400);
  }

  // (2) Validate startDate and endDate
  //// Check for valid date format and whether the date actually exists
  const resStart = validateDate(startDate, timeFrame);
  if (resStart !== "") {
    throw new ErrorWithStatus("Start Date " + `${resStart}`, 400);
  }

  const resEnd = validateDate(endDate, timeFrame);
  if (resEnd !== "") {
    throw new ErrorWithStatus("End Date " + `${resEnd}`, 400);
  }

  //// Check that the start date is before the end date
  if (new Date(endDate) < new Date(startDate)) {
    throw new ErrorWithStatus("End Date is before Start Date", 400);
  }

  // (3) Validate attributes
  const attributeList = attributes.split(",");

  if (attributeList.length === 1 && attributeList[0] === "") return;

  for (const attribute of attributeList) {
    const processedAttribute = attribute.trim().toLowerCase();
    if (!VALID_ATTRIBUTES.includes(processedAttribute)) {
      throw new ErrorWithStatus(`'${processedAttribute}' is not a valid weather condition`, 400);
    }
  }
}

/**
 * Gets user data based on id from user-data microservice
 * @param userID id of user to search for.
 * @returns user data.
 */
export async function getUser(userID: string): Promise<any> {
  const lambda = new Lambda({ region: process.env.DEFAULT_REGION });
  const constructEvent: LambdaFunctionURLEvent = {
    path: "/user-data/get-all",
    httpMethod: "GET",
    body: JSON.stringify({
      userID: userID,
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  const params = {
    FunctionName: `${GROUP_NAME}_${process.env.STAGING_ENV}_${USER_DATA_LAMBDA_NAME}`,
    InvocationType: InvocationType.RequestResponse,
    Payload: JSON.stringify(constructEvent),
  };
  let response;
  try {
    response = await lambda.send(new InvokeCommand(params));
  } catch (error) {
    logger.error("Exception thrown when fetching from suburb finder", JSON.stringify(error));
    throw new ErrorWithStatus(
      "Exception occured when fetching from user data, ensure userID is valid",
      400
    );
  }

  if (!response || !response.Payload) {
    logger.error("Response payload from suburb_finder was empty");
    throw new ErrorWithStatus("No return object received from lambda.", 500);
  }

  const data = JSON.parse(response?.Payload?.transformToString() as string);
  if (!data || data.statusCode !== 200) {
    logger.error("An issue occured with the payload data obtained from user-data");
    throw new ErrorWithStatus("Unable to find user data", data?.statusCode);
  }

  return JSON.parse(data.body).data;
}

/**
 * Takes in weather event data of a particular suburb, and filters it by date and weather conditions
 * @param data weather data obtained from S3 bucket
 * @param startDate the start date of date filtering
 * @param endDate the end date of date filtering
 * @param attributes the weather conditions the user wants. Empty array indicates user wants all
 * weather conditions
 * @returns the filtered weather event data
 */
export function filterData(
  data: JSONData,
  startDate: string,
  endDate: string,
  attributes: string[]
): JSONData {
  // NOTE: the provided dates are assumed to be in AEST
  // (a) Get Start Date (in AEST)
  const startDateObj = new Date(startDate);
  // (b) Get End Date (in UTC)
  const endDateObj = new Date(endDate);

  const dateFilteredEvents: Event[] = data.events.filter((event) => {
    const currentEventDate = new Date(processTimeStr(event.time_object.timestamp));

    // Read time-component of time stamp as UTC
    currentEventDate.setUTCHours(currentEventDate.getUTCHours() + 10);
    currentEventDate.setUTCHours(0, 0, 0, 0);

    return currentEventDate >= startDateObj && currentEventDate <= endDateObj;
  });

  data.events = dateFilteredEvents;
  // (2) Attribute Filtering
  if (attributes.length === 0) {
    return data;
  }

  for (let i = 0; i < data.events.length; i++) {
    const currentEvent: Event = data.events[i];
    // (a) Filter Attributes
    for (const currentAttributeKey in currentEvent.attributes) {
      if (
        !attributes.includes(currentAttributeKey.toLowerCase()) &&
        currentAttributeKey !== "location" &&
        currentAttributeKey !== "units"
      ) {
        delete currentEvent.attributes[currentAttributeKey];
      }
    }

    // (b) Filter Units
    for (const currentUnitKey in currentEvent.attributes.units) {
      if (!attributes.includes(currentUnitKey.toLowerCase()) && currentUnitKey !== "time") {
        delete currentEvent.attributes.units[currentUnitKey];
      }
    }
  }

  return data;
}

/**
 * Checks and validates a date against a timeframe
 * @param dateStr the date to check
 * @param timeFrame the timeframe to check the date string across. Either 'history' or 'forecast'
 * @returns an error message if the date is out of the timeframe, otherwise an empty string
 */
export function validateDate(dateStr: string, timeFrame: string): string {
  // (1) Check if given date is formatted as YYYY-MM-DD
  if (!dateStr.match(DATE_REGEX)) {
    return "has an invalid format";
  }

  // (2) Check if given date actually exists
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return "is not a date that exists";
  }

  // (3) Check if date is in the present or within 7 days of the future
  //// (a) Get Today's Date (Date Object will be in UTC)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  //// (b) Discard time data from given date (Date Object will be in UTC)
  date.setUTCHours(0, 0, 0, 0);

  //// (c) Calculate difference of given date and today (in days)
  const dayDiff = (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  //// (d) Return Error Message
  if (timeFrame === "forecast") {
    if (dayDiff > 0) {
      return "cannot be in the past";
    } else if (dayDiff < -7) {
      return "is not within 7 days of the future";
    }
  } else if (timeFrame === "history") {
    if (date < new Date(HISTORY_CUTOFF_DATE)) {
      return `is not after the historical cut off date of ${HISTORY_CUTOFF_DATE}`;
    } else if (dayDiff <= 0) {
      return "cannot be in the future";
    }
  }

  return "";
}

/**
 * Takes in a timestamp in ISO8601 and formats it into a more human readable format
 * @param timeInput the time string to process
 * @returns the formatted time string in YYYY-MM-DD HH:MM:SS format
 */
function processTimeStr(timeInput: string): string {
  const [date, time] = timeInput.split("T");
  const formattedTime = time.slice(0, -6);
  return `${date} ${formattedTime}`;
}

/**
 * Generate a date that is x days before or after the given date.
 * @param {Date} date - The date to start from.
 * @param {number} days - The number of days to add or subtract.
 * @returns {Date} The new date.
 */
export const addDays = (date: Date, days: number): Date => {
  const newDate = new Date(date);
  newDate.setDate(date.getDate() + days);
  return newDate;
};

/**
 * Fetches the heatmap data from the cache. If the cache is expired, it will be deleted and new data
 * will be fetched.
 * @returns the heatmap data from the cache. If the cache is expired, an empty string is returned.
 */
export const getHeatmapDataFromCache = async (): Promise<string> => {
  try {
    const { fileContents, Expires }: { fileContents: string; Expires: string } = JSON.parse(
      await readBucket(`${GROUP_NAME}/cache/heatmapResults.json`, true)
    );
    // if expired, delete the cache and fetch new data, otherwise use cache
    if (new Date(Expires) <= new Date()) {
      logger.info("HeatmapHandler: Cache expired, fetching new data...");
      deleteFromBucket(`${GROUP_NAME}/cache/heatmapResults.json`);
      return "";
    } else {
      logger.info("HeatmapHandler: Using cached data...");
      return fileContents;
    }
  } catch (err: any) {
    return "";
  }
};

/**
 * Fetches all suburbs and their respective weather data for the heatmap
 * @returns a list of all suburbs and their respective weather data that can be used for heatmap
 */
export const getAllSuburbsForHeatmap = async (): Promise<HeatmapTransformedData[]> => {
  const startDate = new Date(HEATMAP_FETCH_CUTOFF);
  const suburbData: SuburbData[] = JSON.parse(
    await readBucket(`${GROUP_NAME}/suburbsData/sydney_suburbs.json`)
  );

  const heatmapResults: HeatmapRawData[] = await Promise.all(
    suburbData.map(async (suburb) => {
      return {
        suburb: suburb.suburb,
        placeId: suburb.placeId,
        data: JSON.parse(
          await readBucket(`${GROUP_NAME}/weatherData/history/${suburb.suburb}.json`)
        ),
      };
    })
  );

  heatmapResults.forEach((suburb) => {
    suburb.data = suburb.data.events
      .filter((e: Event) => {
        const timestamp = new Date(e.time_object.timestamp);
        return timestamp >= startDate && timestamp <= addDays(new Date(), -2);
      })
      .map((e: Event) => {
        return {
          timestamp: e.time_object.timestamp,
          shortwave_radiation: e.attributes.shortwave_radiation,
          temperature_2m: e.attributes.temperature_2m,
          sunshine_duration: e.attributes.sunshine_duration,
          cloud_cover: e.attributes.cloud_cover,
        };
      }) as any;
  });

  return heatmapResults as any;
};

/**
 * Handles coefficient calculations for a user who hasn't had it calculated
 * Side effect: writes those fields to the user so they need not be recalculated
 *  @param user: a user to calculate the coefficients for
 *  @returns string[]: stores the temp and daylight coefficients
 * */
export async function handleCoefficientCalculation(user: any): Promise<string[]> {
  if (!containsData(user)) {
    return ["1", "1"];
  }
  // Now assume all those fields exist
  const coefficientMatrix = [
    [parseFloat(user.q1_t), parseFloat(user.q1_d)],
    [parseFloat(user.q2_t), parseFloat(user.q2_d)],
    [parseFloat(user.q3_t), parseFloat(user.q3_d)],
    [parseFloat(user.q4_t), parseFloat(user.q4_d)],
  ];
  const solutionEquation = [
    parseFloat(user.q1_w),
    parseFloat(user.q2_w),
    parseFloat(user.q3_w),
    parseFloat(user.q4_w),
  ];

  const svd = numeric.svd(coefficientMatrix);
  // Calculating the pseudoinverse
  const S = numeric.diag(
    numeric.rep([svd.S.length], 0).map((_x: any, i: any) => (svd.S[i] > 0 ? 1 / svd.S[i] : 0))
  );
  const A_inv = numeric.dot(numeric.transpose(svd.V), numeric.dot(S, numeric.transpose(svd.U)));

  const solution: any = numeric.dot(A_inv, solutionEquation);

  const tempCoefficient = solution[0];
  const daylightCoefficient = solution[1];
  if (user.user_id) {
    await updateEntry(user.user_id, "temp_coefficient", String(tempCoefficient));
    await updateEntry(user.user_id, "daylight_coefficient", String(daylightCoefficient));
  }

  return [tempCoefficient, daylightCoefficient];
}

/**
 * Returns whether or not the user contains appropriate fields to perform a coefficient calculation
 * @param user the user we're testing
 * @returns boolean: true if user contains all required fields
 */
export function containsData(user: any): boolean {
  return (
    user.q1_w !== undefined &&
    user.q1_t !== undefined &&
    user.q1_d !== undefined &&
    user.q2_w !== undefined &&
    user.q2_t !== undefined &&
    user.q2_d !== undefined &&
    user.q3_w !== undefined &&
    user.q3_t !== undefined &&
    user.q3_d !== undefined &&
    user.q4_w !== undefined &&
    user.q4_t !== undefined &&
    user.q4_d !== undefined
  );
}

/**
 * Updates an entry of a user with a particular field
 * @param userID: the id of the user to update
 * @param field: the field on the user row to updatre
 * @param val: the value to set the field to
 * */
export async function updateEntry(userID: string, field: string, val: any) {
  const command = new UpdateCommand({
    TableName: tableName,
    Key: {
      user_id: userID,
    },
    UpdateExpression: `set ${field} = :val`,
    ConditionExpression: "attribute_exists(user_id)",
    ExpressionAttributeValues: {
      ":val": val,
    },
  });

  try {
    await docClient.send(command);
  } catch (e) {
    throw new ErrorWithStatus("Error setting coefficient values", 400);
  }
}

export function getCoefficient(user: any): number {
  if (
    user.production_coefficient === undefined ||
    (user.production_coefficient && user.production_coefficient.length === 0)
  ) {
    return 1;
  }
  return parseFloat(user.production_coefficient[getSeason()]);
}

/** Gets the current season
 * @returns the number of the current season 0 is Summer, 1 is Autumn, etc.
 */
function getSeason(): number {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) {
    return 1;
  } else if (month >= 6 && month <= 8) {
    return 2;
  } else if (month >= 9 && month <= 11) {
    return 3;
  } else {
    return 0;
  }
}
