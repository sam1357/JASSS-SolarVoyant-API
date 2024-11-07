import { Logger } from "@aws-lambda-powertools/logger";

export const DAILY_CONDITIONS = [
  "daylight_duration",
  "sunshine_duration",
  "uv_index_max",
  "precipitation_sum",
  "precipitation_probability_max",
  "wind_speed_10m_max",
  "wind_direction_10m_dominant",
  "shortwave_radiation_sum",
  "weather_code",
  "wind_gusts_10m_max",
];

export const GROUP_NAME = "SE3011-24-F14A-03";
export const PREPROCESSING_LAMBDA_NAME = "jasss_preprocessing_lambda";

export const TIMEZONE = "Australia/Sydney";
export const BATCH_SIZE = 50;
export const PAST_DAYS = "31";
export const IS_LAMBDA = !!process.env.LAMBDA_TASK_ROOT;
export const BUCKET = process.env.BUCKET;
export const DEFAULT_TEST_JSON = `${GROUP_NAME}/suburbsData/sydney_suburbs_test.json`;
export const DEFAULT_JSON = `${GROUP_NAME}/suburbsData/sydney_suburbs.json`;

export const HOURLY_CONDITIONS = [
  "temperature_2m",
  "relative_humidity_2m",
  "cloud_cover",
  "surface_pressure",
  "apparent_temperature",
  "visibility",
];

export const logger = new Logger();
