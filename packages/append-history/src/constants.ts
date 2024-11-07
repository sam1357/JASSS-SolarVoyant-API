import { Logger } from "@aws-lambda-powertools/logger";

export const GROUP_NAME = "SE3011-24-F14A-03";
export const ANALYTICS_LAMBDA_NAME = "jasss_analytics_lambda";
export const CUR_TIMEZONE = "Australia/Sydney";
export const DEFAULT_DATE_FORMAT = "yyyy-MM-dd";

export const ANALYTICS_DEFAULT_QUERY = {
  "temperature_2m": "mean",
  "relative_humidity_2m": "mean",
  "precipitation_probability": "mean",
  "precipitation": "sum",
  "cloud_cover": "mean",
  "wind_speed_10m": "max",
  "wind_direction_10m": "mean",
  "uv_index": "max",
  "shortwave_radiation": "mean",
  "daylight_duration": "mean",
  "sunshine_duration": "mean",
  "visibility": "mean",
  "weather_code": "max",
  "wind_gusts_10m": "max",
  "surface_pressure": "mean",
  "apparent_temperature": "mean",
};

export const LAMBDA_CONCURRENCY = 9; // max is normally 10, leave 1 for external requests
export const DEFAULT_RETRIES = 3;

export const SECONDS_IN_DAY = 86400;
export const TO_MEGA = 1000000;

export const DEFAULT_TIMESTAMP_METADATA = {
  duration: 24,
  duration_unit: "hr",
  timezone: "Australia/Sydney",
};

export const logger = new Logger();
