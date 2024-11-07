import {
  ADAGEDataModel,
  AnalyticsAttribute,
  AnalyticsResult,
  Event,
  EventTimeObject,
  WeatherConditions,
} from "./interfaces";
import { format, utcToZonedTime } from "date-fns-tz";
import {
  ANALYTICS_DEFAULT_QUERY,
  CUR_TIMEZONE,
  DEFAULT_DATE_FORMAT,
  DEFAULT_TIMESTAMP_METADATA,
  SECONDS_IN_DAY,
  TO_MEGA,
} from "./constants";
import LambdaInvoker from "./lambdaInvoker";

/**
 * Filters an array of events and only returns those events that happened today
 * @param events array of events to filter
 * @returns the filtered array
 */
export const filterTodayEvents = (events: Event[]): Event[] => {
  return events.filter((e) => {
    return (
      format(new Date(e.time_object.timestamp), DEFAULT_DATE_FORMAT, {
        timeZone: e.time_object.timezone,
      }) === getDateInTimezone()
    );
  });
};

/**
 * Takes in the filtered data, and runs it through the analytics microservice to summarise
 * @param data the data to summarise
 * @param lambdaInvoker the lambda invoker class for concurrency management
 * @returns the summarised data
 */
export const summariseEvents = async (
  data: ADAGEDataModel,
  lambdaInvoker: LambdaInvoker
): Promise<AnalyticsResult> => {
  const payload = {
    "httpMethod": "POST",
    "path": "/dev/data-analytics/summarise",
    "body": { "query": ANALYTICS_DEFAULT_QUERY, "weather": JSON.stringify(data) },
  };

  return lambdaInvoker.invokeLambda(payload, LambdaInvoker._DEFAULT_FUNCTION);
};

/**
 * Create a new event from the provided analytics data
 * @param data the data to create the event from
 * @returns the event
 */
export const createNewEvent = (data: AnalyticsResult): Event => {
  const timeObject: EventTimeObject = {
    timestamp: data.time_object.start_timestamp,
    ...DEFAULT_TIMESTAMP_METADATA,
  };

  return {
    time_object: timeObject,
    event_type: "historical",
    attributes: {
      location: data.location,
      units: { ...data.units, shortwave_radiation: "MJ/m²" },
      ...mapValuesToKeys(data.analytics),
      shortwave_radiation: (data.analytics.shortwave_radiation.mean * SECONDS_IN_DAY) / TO_MEGA,
    },
  };
};

/**
 * Takes the value from the nested object and maps to original weather condition keys
 * @param analytics the analytics object returned from the microservice
 * @returns the properly mapped analytics object
 */
export const mapValuesToKeys = (analytics: AnalyticsAttribute): WeatherConditions => {
  const mappedData: WeatherConditions = {};
  for (const key in analytics) {
    (mappedData as any)[key] = Object.values(analytics[key])[0];
  }

  return mappedData;
};

/**
 * Checks if a string is a parse-able JSON object
 * @param s the string to check
 * @returns if the string is JSON parse-able
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
 * Returns a date in Australia/Sydney timezone, in format yyyy-MM-dd.
 * @returns the date in format yyyy-MM-dd
 */
export const getDateInTimezone = (): string => {
  return format(utcToZonedTime(new Date(), CUR_TIMEZONE), DEFAULT_DATE_FORMAT);
};
