import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { fromEnv } from "@aws-sdk/credential-providers";
import nodemailer from "nodemailer";

const client = new DynamoDBClient({
  region: "ap-southeast-2",
  credentials: fromEnv(),
});
export const docClient = DynamoDBDocumentClient.from(client);
export const tableName = "SE3011-24-F14A-03_UserData";
export const testTableName = "SE3011-24-F14A-03_Test";
export const ADDITIONAL_USER_FIELDS = [
  "username",
  "address",
  "surface_area",
  "quarterly_energy_consumption",
  "quarterly_energy_production",
  "receive_emails",
  "upper_limit",
  "lower_limit",
  "temp_coefficient",
  "daylight_coefficient",
  "production_coefficient",
  "q1_w",
  "q2_w",
  "q3_w",
  "q4_w",
  "q1_t",
  "q2_t",
  "q3_t",
  "q4_t",
  "q1_d",
  "q2_d",
  "q3_d",
  "q4_d",
  "q1_r",
  "q2_r",
  "q3_r",
  "q4_r",
  "suburb",
  "notifications",
];
export const RETRIEVABLE_USER_FIELDS = ["username", "provider", "email", ...ADDITIONAL_USER_FIELDS];

export const emailTransport = nodemailer.createTransport({
  service: "Gmail",
  host: "smtp.gmail.com",
  port: 465,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});
