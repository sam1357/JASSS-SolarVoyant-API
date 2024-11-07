import { Logger } from "@aws-lambda-powertools/logger";

export const DAILY_CONDITIONS = ["daylight_duration", "sunshine_duration"];
export const TIMEZONE = "Australia/Sydney";
export const BATCH_SIZE = 50;
export const TEST_FORECAST_DAYS = 1;
export const FORECAST_DAYS = 7;

export const IS_LAMBDA = !!process.env.LAMBDA_TASK_ROOT;
export const BUCKET = process.env.BUCKET;
export const DEFAULT_FOLDER = "SE3011-24-F14A-03";
export const DEFAULT_TEST_JSON = `${DEFAULT_FOLDER}/suburbsData/sydney_suburbs_test.json`;
export const DEFAULT_JSON = `${DEFAULT_FOLDER}/suburbsData/sydney_suburbs.json`;

export const HOURLY_CONDITIONS = [
  "temperature_2m",
  "relative_humidity_2m",
  "precipitation_probability",
  "precipitation",
  "cloud_cover",
  "weather_code",
  "apparent_temperature",
  "surface_pressure",
  "wind_gusts_10m",
  "visibility",
  "wind_speed_10m",
  "wind_direction_10m",
  "uv_index",
  "shortwave_radiation",
];

export const LOGGER = new Logger();
export const HEADERS = { "Content-Type": "application/json" };
export const DEFAULT_RETRIES = 3;
