import { Logger } from "@aws-lambda-powertools/logger";
import { S3Client } from "@aws-sdk/client-s3";
import { fromEnv } from "@aws-sdk/credential-providers";

export const GROUP_NAME = "SE3011-24-F14A-03";
export const COLLECTION_LAMBDA_NAME = "jasss_collection_lambda";
export const NOTIFICATION_LAMBDA_NAME = "jasss_notification_lambda";
export const DEFAULT_SUBURB_FILE = "sydney_suburbs.json";
export const CUR_TIMEZONE = "Australia/Sydney";
export const DEFAULT_RETRIES = 3;

export const COMMON_METADATA = {
  data_source: "Weather API",
  dataset_type: "Weather/Climate Data",
  dataset_id: `https://s3.console.aws.amazon.com/s3/buckets/seng3011-student?region=ap-southeast-2&\
bucketType=general&prefix=${GROUP_NAME}/&showversions=false`,
};

export const s3: S3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.DEFAULT_REGION,
  credentials: fromEnv(),
});

export const logger = new Logger();
