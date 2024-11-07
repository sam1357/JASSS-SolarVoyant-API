import { Logger } from "@aws-lambda-powertools/logger";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { fromEnv } from "@aws-sdk/credential-providers";
import nodemailer from "nodemailer";

export const logger = new Logger();

export const tableName = "SE3011-24-F14A-03_UserData";
export const testTableName = "SE3011-24-F14A-03_Test";

export const GROUP_NAME = "SE3011-24-F14A-03";
export const CALCULATION_OFFSET = 600;
export const SUBURB_LAMBDA_NAME = "jasss_calculator_lambda";

const client = new DynamoDBClient({
  region: "ap-southeast-2",
  credentials: fromEnv(),
});
export const docClient = DynamoDBDocumentClient.from(client);

export const emailTransport = nodemailer.createTransport({
  host: "smtp.gmail.com",
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});
