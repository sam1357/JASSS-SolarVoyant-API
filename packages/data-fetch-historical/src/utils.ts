import { GetObjectCommandOutput, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
  HOURLY_CONDITIONS,
  DAILY_CONDITIONS,
  TIMEZONE,
  BATCH_SIZE,
  DEFAULT_TEST_JSON,
  DEFAULT_JSON,
  BUCKET,
  logger,
} from "./constants";
import {
  SuburbData,
  CleanedHistoricalSuburbWeatherData,
  CleanedHistoricalFullWeatherData,
  HistoricalDailyConditions,
  HistoricalHourlyConditions,
  HistoricalRawWeatherData,
  HistoricalMetadata,
  Params,
  ShortDailyConditions,
} from "./customTypes/types";
import { ErrorWithStatus } from "./customTypes/errorWithStatus";
import { fromEnv } from "@aws-sdk/credential-providers";
import { InvokeCommand, Lambda } from "@aws-sdk/client-lambda";
import { APIGatewayProxyResult } from "aws-lambda";

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  credentials: fromEnv(),
  region: process.env.DEFAULT_REGION,
});

/**
 * Fetches historical raw weather data for a batch of locations specified by their latitudes and
 * longitudes.
 * @param {string} latitudes - Comma-separated latitudes of locations.
 * @param {string} longitudes - Comma-separated longitudes of locations.
 * @param {string} startDate - Start date for historical data.
 * @param {string} endDate - End date for historical data.
 * @returns {Promise<HistoricalRawWeatherData[]>} A promise that resolves to an array of historical
 * raw weather data.
 */
export const fetchDataForBatch = async (
  latitudes: string,
  longitudes: string,
  startDate: string,
  endDate: string
): Promise<HistoricalRawWeatherData[]> => {
  const params = {
    latitude: latitudes,
    longitude: longitudes,
    hourly: HOURLY_CONDITIONS.join(","),
    daily: DAILY_CONDITIONS.join(","),
    timezone: TIMEZONE,
    apikey: process.env.API_KEY ?? "",
    start_date: startDate,
    end_date: endDate,
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
 * Fetches historical raw weather data for multiple suburbs.
 * @param {SuburbData[]} suburbsData - Array of suburb data containing latitude and longitude.
 * @param {string} startDate - Start date for historical data.
 * @param {string} endDate - End date for historical data.
 * @returns {Promise<HistoricalRawWeatherData[]>} A promise that resolves to an array of historical
 * raw weather data.
 */
export const fetchDataForSuburbs = async (
  suburbsData: SuburbData[],
  startDate: string,
  endDate: string
): Promise<HistoricalRawWeatherData[]> => {
  let batches: Promise<HistoricalRawWeatherData[]>[] = [];

  // divide queries for all suburbs due to limit on url query length
  for (let i = 0; i < suburbsData.length; i += BATCH_SIZE) {
    const batch = suburbsData.slice(i, i + BATCH_SIZE);
    const latitudes = batch.map((v) => v.latitude).join(",");
    const longitudes = batch.map((v) => v.longitude).join(",");

    batches = batches.concat(fetchDataForBatch(latitudes, longitudes, startDate, endDate));
  }

  const results = await Promise.all(batches);
  // flatten array of raw weather data into a single 1D array
  return ([] as HistoricalRawWeatherData[]).concat(...results);
};

/**
 * Cleans historical raw weather data and suburb data and returns cleaned historical weather data.
 * @param {HistoricalRawWeatherData[]} data - Array of historical raw weather data.
 * @param {SuburbData[]} suburbData - Array of suburb data.
 * @returns {CleanedHistoricalFullWeatherData} Cleaned historical weather data.
 */
export const cleanData = (
  data: HistoricalRawWeatherData[],
  suburbData: SuburbData[]
): CleanedHistoricalFullWeatherData => {
  const dailyUnits = data[0].daily_units;
  console.warn(dailyUnits);
  const metadata: HistoricalMetadata = {
    units: {
      time: dailyUnits.time,
      daylight_duration: dailyUnits.daylight_duration,
      sunshine_duration: dailyUnits.sunshine_duration,
      uv_index: dailyUnits.uv_index_max,
      precipitation: dailyUnits.precipitation_sum,
      precipitation_probability: dailyUnits.precipitation_probability_max,
      wind_speed_10m: dailyUnits.wind_speed_10m_max,
      wind_direction_10m: dailyUnits.wind_direction_10m_dominant,
      shortwave_radiation: dailyUnits.shortwave_radiation_sum,
      temperature_2m: dailyUnits.temperature_2m,
      relative_humidity_2m: dailyUnits.relative_humidity_2m,
      cloud_cover: dailyUnits.cloud_cover,
      weather_code: dailyUnits.weather_code,
      visibility: dailyUnits.visibility,
      surface_pressure: dailyUnits.surface_pressure,
      wind_gusts_10m: dailyUnits.wind_gusts_10m_max,
      apparent_temperature: dailyUnits.apparent_temperature,
    },
    timezone: data[0].timezone,
    timezone_abbreviation: data[0].timezone_abbreviation,
  };

  const transformedData: CleanedHistoricalSuburbWeatherData[] = [];

  data.forEach((v, i) => {
    transformedData.push({
      suburb: suburbData[i].suburb,
      latitude: v.latitude,
      longitude: v.longitude,
      elevation: v.elevation,
      daily: mapNames(v.daily),
    });
  });

  return {
    metadata: metadata,
    suburbs_data: transformedData,
  };
};

/**
 * Fetches and parses JSON data from an S3 bucket.
 * @param {string} [inFile] - Optional. Name of the file to fetch from S3.
 * @returns {Promise<SuburbData[]>} A promise that resolves to an array of suburb data.
 */
export const fetchAndParseJSON = async (inFile?: string): Promise<SuburbData[]> => {
  const testFile = process.env.NODE_ENV === "test" ? DEFAULT_TEST_JSON : DEFAULT_JSON;
  const file = inFile ? inFile : testFile;

  let res: GetObjectCommandOutput;

  try {
    const getObjectCommand = new GetObjectCommand({
      Bucket: BUCKET,
      Key: file,
    });

    res = await s3.send(getObjectCommand);
  } catch (err: any) {
    throw new ErrorWithStatus(err.message, err.$response?.statusCode);
  }

  if (res.Body) {
    return JSON.parse(await res.Body.transformToString());
  } else {
    throw new ErrorWithStatus("Failed to fetch data from S3.", 500);
  }
};

/**
 * Maps historical daily weather conditions to a shorter format.
 * @param {HistoricalDailyConditions} daily - Historical daily weather conditions.
 * @returns {ShortDailyConditions} Shortened historical daily weather conditions.
 */
const mapNames = (daily: HistoricalDailyConditions): ShortDailyConditions => {
  return {
    time: daily.time,
    daylight_duration: daily.daylight_duration,
    sunshine_duration: daily.sunshine_duration,
    uv_index: daily.uv_index_max,
    precipitation: daily.precipitation_sum,
    precipitation_probability: daily.precipitation_probability_max,
    wind_speed_10m: daily.wind_speed_10m_max,
    wind_direction_10m: daily.wind_direction_10m_dominant,
    shortwave_radiation: daily.shortwave_radiation_sum,
    temperature_2m: daily.temperature_2m,
    relative_humidity_2m: daily.relative_humidity_2m,
    cloud_cover: daily.cloud_cover,
    weather_code: daily.weather_code,
    wind_gusts_10m: daily.wind_gusts_10m_max,
    apparent_temperature: daily.apparent_temperature,
    surface_pressure: daily.surface_pressure,
    visibility: daily.visibility,
  };
};

/**
 * Transforms hourly historical weather data into daily averages.
 * @param {HistoricalRawWeatherData[]} weatherData - Array of historical raw weather data.
 * @returns {Promise<HistoricalRawWeatherData[]>} A promise that resolves to an array of historical
 * raw weather data with daily averages.
 */
export const transformHourlyToDaily = async (
  weatherData: HistoricalRawWeatherData[]
): Promise<HistoricalRawWeatherData[]> => {
  weatherData.forEach((v) => {
    for (const condition of HOURLY_CONDITIONS) {
      const hourlyWeatherData = v.hourly[condition as keyof HistoricalHourlyConditions];
      const dailyAverages = calculateDailyAverages(hourlyWeatherData);
      v.daily[condition as keyof HistoricalHourlyConditions] = dailyAverages;
      v.daily_units[condition as keyof HistoricalHourlyConditions] =
        v.hourly_units[condition as keyof HistoricalHourlyConditions];
    }
  });

  return weatherData;
};

/**
 * Calculates daily averages from hourly weather data.
 * @param {number[]} hourlyData - Array of hourly weather data.
 * @returns {number[]} Array of daily averages.
 */
const calculateDailyAverages = (hourlyData: number[]): number[] => {
  return hourlyData.reduce((acc, _, index, array) => {
    if (index % 24 === 0) {
      const dailySlice = array.slice(index, index + 24);
      const average =
        dailySlice.reduce((sum: number, value: number) => sum + value, 0) / dailySlice.length;
      acc.push(+average.toFixed(2));
    }
    return acc;
  }, [] as number[]);
};

/**
 * Processes historical weather data.
 * @param {Params} params - Parameters for processing historical data.
 * @returns {Promise<APIGatewayProxyResult>} A promise that resolves to an APIGatewayProxyResult.
 */
export const processHistoricalData = async (params: Params): Promise<APIGatewayProxyResult> => {
  const lambda = new Lambda({ region: process.env.DEFAULT_REGION });

  try {
    const res = await lambda.send(new InvokeCommand(params));

    const data = JSON.parse(new TextDecoder().decode(res.Payload));

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (err: any) {
    logger.error(
      "An exception occurred when trying to transform the data, or upload it to S3.",
      err
    );
    return {
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ message: "Lambda invocation failed" }),
    };
  }
};
