import {
  HOURLY_CONDITIONS,
  DAILY_CONDITIONS,
  TIMEZONE,
  TEST_FORECAST_DAYS,
  FORECAST_DAYS,
  BATCH_SIZE,
} from "./constants";
import {
  RawWeatherData,
  SuburbData,
  CleanedFullWeatherData,
  Metadata,
  CleanedSuburbWeatherData,
} from "./customTypes/types";
import { ErrorWithStatus } from "./customTypes/errorWithStatus";

/**
 * Fetches raw weather data for a batch of locations specified by their latitudes and longitudes.
 * @param {string} latitudes - Comma-separated latitudes of locations.
 * @param {string} longitudes - Comma-separated longitudes of locations.
 * @returns {Promise<RawWeatherData[]>} A promise that resolves to an array of raw weather data.
 */
export const fetchDataForBatch = async (
  latitudes: string,
  longitudes: string
): Promise<RawWeatherData[]> => {
  const params = {
    latitude: latitudes,
    longitude: longitudes,
    hourly: HOURLY_CONDITIONS.join(","),
    daily: DAILY_CONDITIONS.join(","),
    timezone: TIMEZONE,
    apikey: process.env.API_KEY ?? "",
    // minimise api calls during test
    forecast_days: `${process.env.NODE_ENV === "test" ? TEST_FORECAST_DAYS : FORECAST_DAYS}`,
  };

  const res = await fetch(
    `${process.env.API_BASE_URL}?${new URLSearchParams({ ...params }).toString()}`
  );

  if (res.status !== 200) {
    throw new ErrorWithStatus((await res.json()).reason, res.status);
  }

  return await res.json();
};

/**
 * Fetches raw weather data for multiple suburbs in batches
 * @param {SuburbData[]} suburbsData - Array of suburb data containing latitude and longitude.
 * @returns {Promise<RawWeatherData[]>} A promise that resolves to an array of raw weather data.
 */
export const fetchDataForSuburbs = async (suburbsData: SuburbData[]): Promise<RawWeatherData[]> => {
  let batches: Promise<RawWeatherData[]>[] = [];

  // divide queries for all suburbs due to limit on url query length
  for (let i = 0; i < suburbsData.length; i += BATCH_SIZE) {
    const batch = suburbsData.slice(i, i + BATCH_SIZE);
    const latitudes = batch.map((v) => v.latitude).join(",");
    const longitudes = batch.map((v) => v.longitude).join(",");

    batches = batches.concat(fetchDataForBatch(latitudes, longitudes));
  }

  const results = await Promise.all(batches);

  // flatten array of raw weather data into a single 1D array
  return ([] as RawWeatherData[]).concat(...results);
};

/**
 * Cleans raw weather data and suburb data and returns cleaned weather data.
 * @param {RawWeatherData[]} data - Array of raw weather data.
 * @param {SuburbData[]} suburbData - Array of suburb data.
 * @returns {CleanedFullWeatherData} Cleaned weather data.
 */
export const cleanData = (
  data: RawWeatherData[],
  suburbData: SuburbData[]
): CleanedFullWeatherData => {
  const metadata: Metadata = {
    units: { ...data[0].hourly_units, ...data[0].daily_units },
    timezone: data[0].timezone,
    timezone_abbreviation: data[0].timezone_abbreviation,
  };

  const transformedData: CleanedSuburbWeatherData[] = [];

  data.forEach((v, i) => {
    transformedData.push({
      suburb: suburbData[i].suburb,
      latitude: v.latitude,
      longitude: v.longitude,
      elevation: v.elevation,
      // the shortening is necessary to not exceed the maximum response size for lambdas
      hourly: v.hourly,
      daily: v.daily,
    });
  });

  return {
    metadata: metadata,
    suburbs_data: transformedData,
  };
};
