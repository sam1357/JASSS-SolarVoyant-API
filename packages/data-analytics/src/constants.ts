import { Logger } from "@aws-lambda-powertools/logger";

export const GROUP_NAME = "SE3011-24-F14A-03";
export const RETRIEVAL_LAMBDA_NAME = "jasss_retrieval_lambda";
export const CUR_TIMEZONE = "Australia/Sydney";

export const COMMON_METADATA = {
  data_source: "Weather API",
  dataset_type: "Weather/Climate Data",
  dataset_id: `https://s3.console.aws.amazon.com/s3/buckets/seng3011-student?region=ap-southeast-2&\
bucketType=general&prefix=${GROUP_NAME}/&showversions=false`,
};

export const logger = new Logger();

export const headers = { "Content-Type": "application/json" };

export const DEFAULT_AGGREGATES = [
  "sum",
  "mean",
  "median",
  "min",
  "max",
  "mode",
  "variance",
  "standard_deviation",
];

export const HEATMAP_AVAILABLE_CONDITIONS = [
  "temperature_2m",
  "shortwave_radiation",
  "cloud_cover",
  "sunshine_duration",
];
