import { Logger } from "@aws-lambda-powertools/logger";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { fromEnv } from "@aws-sdk/credential-providers";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export const BUCKET = "seng3011-student";
export const ROOT_FOLDER = "SE3011-24-F14A-03/";
export const VALID_ATTRIBUTES = [
  "cloud_cover",
  "temperature_2m",
  "relative_humidity_2m",
  "shortwave_radiation",
  "precipitation_probability",
  "precipitation",
  "wind_speed_10m",
  "wind_direction_10m",
  "uv_index",
  "daylight_duration",
  "sunshine_duration",
  "wind_gusts_10m",
  "weather_code",
  "visibility",
  "apparent_temperature",
  "surface_pressure",
];
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const GROUP_NAME = "SE3011-24-F14A-03";
export const SUBURB_LAMBDA_NAME = "jasss_suburb_finder_lambda";
export const USER_DATA_LAMBDA_NAME = "jasss_user_data_lambda";
export const logger = new Logger();
export const HISTORY_CUTOFF_DATE = "2024-03-05";
export const HEATMAP_FETCH_CUTOFF = "2024-04-05";
export const DEFAULT_TTL = 86400;
export const CUR_TIMEZONE = "Australia/Sydney";
export const DEFAULT_DATE_FORMAT = "yyyy-mm-dd";
export const tableName = "SE3011-24-F14A-03_UserData";
export const CALCULATION_OFFSET = 600;
export const SHORTWAVE_RATIO = 0.02;

const client = new DynamoDBClient({
  region: "ap-southeast-2",
  credentials: fromEnv(),
});
export const docClient = DynamoDBDocumentClient.from(client);
