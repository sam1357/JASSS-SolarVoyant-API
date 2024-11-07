import { ScanCommand } from "@aws-sdk/client-dynamodb";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, testTableName } from "../../src/constants";
import { deleteUser, validateTableName } from "../../src/dynamo";

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
  validateTableName(table);
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
