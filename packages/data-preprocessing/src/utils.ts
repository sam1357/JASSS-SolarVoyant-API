import {
  COLLECTION_LAMBDA_NAME,
  COMMON_METADATA,
  CUR_TIMEZONE,
  GROUP_NAME,
  NOTIFICATION_LAMBDA_NAME,
  logger,
  s3,
} from "./constants";
import {
  CleanedSuburbWeatherData,
  EventTimeObject,
  LocationAttribute,
  Metadata,
  Event,
  CleanedFullWeatherData,
  UnitsAttribute,
  Conditions,
} from "./interfaces";
import { format, utcToZonedTime } from "date-fns-tz";
import { ErrorWithStatus } from "./interfaces/errorWithStatus";
import { InvocationType, InvokeCommand, Lambda } from "@aws-sdk/client-lambda";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import S3Service from "./s3Service";

const lambda = new Lambda({ region: process.env.DEFAULT_REGION });

/**
 * Collects weather data by invoking a Lambda function.
 * @param {string} testPath - The test path for collecting weather data.
 * @returns {Promise<CleanedFullWeatherData>} A promise that resolves to cleaned weather data.
 */
export const collectWeatherData = async (testPath: string): Promise<CleanedFullWeatherData> => {
  const s3Key = `${GROUP_NAME}/rawData/fullData.json`;

  try {
    const payload = {
      "httpMethod": "GET",
      "path": `/${process.env.STAGING_ENV}/data-collection/weather`,
      "queryStringParameters": {
        "testPath": testPath,
        "s3Key": s3Key,
      },
    };

    const params = {
      FunctionName: `${GROUP_NAME}_${process.env.STAGING_ENV}_${COLLECTION_LAMBDA_NAME}`,
      InvocationType: InvocationType.RequestResponse,
      Payload: JSON.stringify(payload),
    };

    const res = await lambda.send(new InvokeCommand(params));
    if (!res || Object.keys(res).length === 0) {
      throw new ErrorWithStatus("No return object received from lambda.", 500);
    }

    const data = JSON.parse(res?.Payload?.transformToString() as string);

    // don't continue if the lambda did not return successfully
    if (!data || data.statusCode !== 200) {
      throw new ErrorWithStatus(
        testJSON(data.body) ? JSON.parse(data.body).message : "An unknown error occurred",
        data?.statusCode
      );
    }

    // get freshly written data from s3
    return JSON.parse(await new S3Service().readBucket(s3Key));
  } catch (err: any) {
    throw new ErrorWithStatus(
      `An error occurred trying to collect weather data. Error: ${err.message}`,
      err.statusCode
    );
  }
};

/**
 * Handles the processing and storage of suburb weather data.
 * @param {CleanedSuburbWeatherData} data - Cleaned suburb weather data.
 * @param {Metadata} metadata - Metadata for the weather data.
 * @param {boolean} isHistory - Indicates whether the data is historical or forecast.
 */
export const handleSuburb = async (
  data: CleanedSuburbWeatherData,
  metadata: Metadata,
  isHistory: boolean
) => {
  try {
    const putObjectCommand = new PutObjectCommand({
      Bucket: process.env.BUCKET,
      Key: `${GROUP_NAME}/weatherData/${isHistory ? "history" : "forecast"}/${data.suburb}.json`,
      Body: JSON.stringify({
        ...COMMON_METADATA,
        time_object: {
          timestamp: formatTimeWithOffset(new Date(), CUR_TIMEZONE),
          timezone: metadata.timezone,
        },
        events: mapToEvents(data, metadata, isHistory),
      }),
    });

    await s3.send(putObjectCommand);
    logger.info(`Wrote file ${data.suburb}.json successfully to S3.`);
  } catch (err: any) {
    throw new ErrorWithStatus(err.message, err.$response?.statusCode);
  }
};

export const invokeNotificationMicroservice = async () => {
  const params = {
    FunctionName: `${GROUP_NAME}_${process.env.STAGING_ENV}_${NOTIFICATION_LAMBDA_NAME}`,
    InvocationType: InvocationType.RequestResponse,
  };
  try {
    await lambda.send(new InvokeCommand(params));
  } catch (err: any) {
    throw new ErrorWithStatus(err.message, err.$response?.statusCode);
  }
};

/**
 * Creates an event time object with specified timestamp, duration, unit, and timezone.
 * @param {string} timestamp - The timestamp of the event.
 * @param {number} duration - The duration of the event.
 * @param {string} unit - The unit of duration.
 * @param {string} timeZone - The timezone of the event.
 * @returns {EventTimeObject} The event time object.
 */
export const createTimeObject = (
  timestamp: string,
  duration: number,
  unit: string,
  timeZone: string
): EventTimeObject => {
  return {
    // pass arg to set time to 0 on daily events, as they do not have a time.
    timestamp: formatTimeWithOffset(new Date(timestamp), timeZone, duration !== 24),
    duration,
    duration_unit: unit,
    timezone: timeZone,
  };
};

/**
 * Formats a date with timezone offset.
 * @param {Date} time - The date to format.
 * @param {string} timeZone - The timezone to apply.
 * @param {boolean} [hasTime=true] - Indicates whether to include time in the format.
 * @returns {string} The formatted date with timezone offset.
 */
export const formatTimeWithOffset = (time: Date, timeZone: string, hasTime = true): string => {
  const date = utcToZonedTime(time, timeZone);
  if (!hasTime) {
    date.setHours(0, 0, 0, 0);
  }
  return format(date, "yyyy-MM-dd'T'HH:mm:ssXXX");
};

/**
 * Tests if a string is valid JSON.
 * @param {string} s - The string to test.
 * @returns {boolean} True if the string is valid JSON, false otherwise.
 */
export const testJSON = (s: string): boolean => {
  if (typeof s !== "string") {
    return false;
  }
  try {
    JSON.parse(s);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Maps cleaned suburb weather data to events.
 * @param {CleanedSuburbWeatherData} data - Cleaned suburb weather data.
 * @param {Metadata} metadata - Metadata for the weather data.
 * @param {boolean} isHistory - Indicates whether the data is historical or forecast.
 * @returns {Event[]} An array of events mapped from the suburb weather data.
 */
export const mapToEvents = (
  data: CleanedSuburbWeatherData,
  metadata: Metadata,
  isHistory: boolean
): Event[] => {
  const hourlyUnits: UnitsAttribute = {
    time: metadata.units.time,
    temperature_2m: metadata.units.temperature_2m,
    relative_humidity_2m: metadata.units.relative_humidity_2m,
    precipitation_probability: metadata.units.precipitation_probability,
    precipitation: metadata.units.precipitation,
    cloud_cover: metadata.units.cloud_cover,
    weather_code: metadata.units.weather_code,
    apparent_temperature: metadata.units.apparent_temperature,
    surface_pressure: metadata.units.surface_pressure,
    wind_gusts_10m: metadata.units.wind_gusts_10m,
    visibility: metadata.units.visibility,
    wind_speed_10m: metadata.units.wind_speed_10m,
    wind_direction_10m: metadata.units.wind_direction_10m,
    uv_index: metadata.units.uv_index,
    shortwave_radiation: metadata.units.shortwave_radiation,
  };

  const dailyUnits: UnitsAttribute = {
    time: metadata.units.time,
    daylight_duration: metadata.units.daylight_duration,
    sunshine_duration: metadata.units.sunshine_duration,
  };

  const locationAttribute: LocationAttribute = {
    suburb: data.suburb,
    latitude: data.latitude,
    longitude: data.longitude,
  };

  const hourlyConditions = data.hourly;
  const dailyConditions = data.daily;
  const timezone = metadata.timezone;

  const events: Event[] = [];

  // if history, we only have daily conditions to process, and key names are same
  if (!isHistory && hourlyConditions) {
    events.push(
      ...hourlyConditions.time.map((v, i) => {
        return {
          time_object: createTimeObject(v, 1, "hr", timezone),
          event_type: "hourly",
          attributes: {
            location: locationAttribute,
            units: hourlyUnits,
            ...processConditions(hourlyConditions, i),
          },
        };
      })
    );
  }

  events.push(
    ...dailyConditions.time.map((v, i) => {
      return {
        time_object: createTimeObject(v, 24, "hr", timezone),
        event_type: isHistory ? "historical" : "daily",
        attributes: {
          location: locationAttribute,
          units: isHistory ? metadata.units : dailyUnits,
          ...processConditions(dailyConditions, i),
        },
      };
    })
  );

  return events;
};

/**
 * Processes the conditions for a specific time index.
 * @param {Conditions} inputs - The conditions data object.
 * @param {number} i - The index of the time entry to process.
 * @returns {Record<string, number>} The processed conditions.
 */
const processConditions = (inputs: Conditions, i: number): Record<string, number> => {
  const conditions: Record<string, number> = {};

  for (const key in inputs) {
    if (key !== "time") {
      conditions[key] = inputs[key][i] as number;
    }
  }

  return conditions;
};
