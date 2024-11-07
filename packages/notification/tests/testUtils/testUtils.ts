import { ScanCommand } from "@aws-sdk/client-dynamodb";
import { DeleteCommand, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, testTableName } from "@src/constants";
import { randomUUID } from "crypto";

/**
 * Resets the test DB by deleting users
 */
export const resetTestDatabase = async () => {
  await deleteAllTestUsers();
};

/**
 * Deletes all users from the test DB
 */
export const deleteAllTestUsers = async () => {
  const command = new ScanCommand({
    TableName: testTableName,
  });

  const response = await docClient.send(command);
  if (response.Items !== undefined) {
    // Deleting all users that exist
    for (const item of response.Items) {
      if (item.user_id && item.user_id.S && getUser(testTableName, item.user_id.S) !== undefined) {
        await deleteUser(testTableName, item.user_id?.S ?? "");
      }
    }
  }
};

/**
 * Gets information about existing user for testing
 * @param table the table to read from
 * @param userID the userID to access
 * @returns DynamoDB object about that user
 */
export const getUser = async (table: string, userId: string): Promise<Object> => {
  const command = new GetCommand({
    TableName: table,
    Key: {
      user_id: userId,
    },
  });

  const response = await docClient.send(command);
  if (response.Item === undefined) {
    return {};
  }
  return response.Item;
};

export const mockSendEmail = async () => {
  return {};
};

export const deleteUser = async (table: string, userId: string) => {
  // Delete command to the AWS SDK
  const command = new DeleteCommand({
    TableName: table,
    Key: {
      user_id: userId,
    },
    ConditionExpression: "attribute_exists(user_id)",
  });

  try {
    await docClient.send(command);
  } catch (e) {
    console.error("Shouldn't happen");
  }
};

export const initialiseUsers = async () => {
  const newIdVal = randomUUID() as string;
  const command = new PutCommand({
    TableName: testTableName,
    Item: {
      user_id: newIdVal,
      username: "username",
      password_hash: "passwordHash",
      email: "joshuamatthewwills@gmail.com",
      suburb: "Panania",
      q1_w: "1000",
      q2_w: "2000",
      q3_w: "2000",
      q4_w: "1500",
      q1_t: "22.06",
      q2_t: "16.69",
      q3_t: "11.73",
      q4_t: "17.75",
      q1_d: "50555.78",
      q2_d: "40677.27",
      q3_d: "37056.407",
      q4_d: "46031.35",
      upper_limit: "20",
      lower_limit: "20",
      receive_emails: "true",
      temp_coefficient: "0",
      daylight_coefficient: "0",
    },
  });
  await docClient.send(command);
};
