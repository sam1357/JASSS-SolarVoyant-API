import { LambdaFunctionURLEvent, APIGatewayProxyResult } from "aws-lambda";
import { ErrorWithStatus } from "./types/errorWithStatus";
import { headers, logger } from ".";
import { tableName, testTableName } from "./constants";
import {
  GetUserAll,
  authenticateOauthUser,
  authenticateUser,
  changePassword,
  clearNotifications,
  deleteUser,
  getUserInfo,
  registerUser,
  resetPassword,
  sendPasswordResetToken,
  setUserInfo,
} from "./dynamo";

/**
 * Handler for the /register endpoint
 * @param event all of the info provided by Lambda about the event
 * @returns the HTTP response
 */
export async function handleRegister(
  event: LambdaFunctionURLEvent
): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      throw new ErrorWithStatus("Body is not provided", 400);
    }

    const { username, password, email } = JSON.parse(event.body);

    if (username === undefined || password === undefined || email === undefined) {
      throw new ErrorWithStatus("username, password and email must be passed in body", 400);
    }

    // userID of the newly generated user
    const id: string = await registerUser(
      JSON.parse(event.body).test ? testTableName : tableName,
      username,
      password,
      email
    );

    return {
      headers,
      statusCode: 200,
      body: JSON.stringify({ id, username, email }),
    };
  } catch (error: any) {
    logger.info("Error with User Registration", error);
    return {
      headers,
      statusCode: error.statusCode || 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
}

/**
 * Handler for the /authenticate endpoint
 * @param event all of the info provided by Lambda about the event
 * @returns the HTTP response
 */
export async function handleAuthenticate(
  event: LambdaFunctionURLEvent
): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      throw new ErrorWithStatus("Body is not provided", 400);
    }
    const { email, password } = JSON.parse(event.body);

    if (email === undefined || password === undefined) {
      throw new ErrorWithStatus("email and password must be passed in body", 400);
    }

    const id: string = await authenticateUser(
      JSON.parse(event.body).test ? testTableName : tableName,
      email,
      password
    );

    const { username } = await getUserInfo(
      JSON.parse(event.body).test ? testTableName : tableName,
      id,
      "username"
    );

    return {
      headers,
      statusCode: 200,
      body: JSON.stringify({ id, username, email }),
    };
  } catch (error: any) {
    logger.info("Error with User Authentication", error);
    return {
      headers,
      statusCode: error.statusCode || 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
}

/**
 * Handler for the /handle-oauth endpoint
 * @param event all of the info provided by Lambda about the event
 * @returns the HTTP response
 */
export async function handleOauth(event: LambdaFunctionURLEvent): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      throw new ErrorWithStatus("Body is not provided", 400);
    }
    const { username, email, provider } = JSON.parse(event.body);

    if (username === undefined || provider === undefined || email === undefined) {
      throw new ErrorWithStatus("username, email and provider must be passed in body", 400);
    }

    const id: string = await authenticateOauthUser(
      JSON.parse(event.body).test ? testTableName : tableName,
      username,
      provider,
      email
    );

    return {
      headers,
      statusCode: 200,
      body: JSON.stringify({ id, username, email, provider }),
    };
  } catch (error: any) {
    logger.info("Error with User OAuth authentication", error);
    return {
      headers,
      statusCode: error.statusCode || 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
}

export async function handleGetAll(event: LambdaFunctionURLEvent): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      throw new ErrorWithStatus("Body is not provided", 400);
    }

    const { userID } = JSON.parse(event.body);

    if (userID === undefined) {
      throw new ErrorWithStatus("userID must be passed in body", 400);
    }

    const info = await GetUserAll(JSON.parse(event.body).test ? testTableName : tableName, userID);

    return {
      headers,
      statusCode: 200,
      body: JSON.stringify({ data: info }),
    };
  } catch (error: any) {
    logger.info("Error with User Get All Info", error);
    return {
      headers,
      statusCode: error.statusCode || 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
}

/**
 * Handler for the /clear-notifications endpoint
 * @param event all of the info provided by Lambda about the event
 * @returns the HTTP response
 */
export async function handleClearNotifications(
  event: LambdaFunctionURLEvent
): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      throw new ErrorWithStatus("Body is not provided", 400);
    }

    const { userID } = JSON.parse(event.body);

    if (userID === undefined) {
      throw new ErrorWithStatus("userID must be passed in body", 400);
    }

    await clearNotifications(JSON.parse(event.body).test ? testTableName : tableName, userID);

    return {
      headers,
      statusCode: 200,
      body: JSON.stringify({
        message: `Notifications have been successfully cleared for user ${userID}`,
      }),
    };
  } catch (error: any) {
    logger.info("Error with User Set Info", error);
    return {
      headers,
      statusCode: error.statusCode || 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
}

/**
 * Handler for the /set endpoint
 * @param event all of the info provided by Lambda about the event
 * @returns the HTTP response
 */
export async function handleSetInfo(event: LambdaFunctionURLEvent): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      throw new ErrorWithStatus("Body is not provided", 400);
    }

    const { userID, info } = JSON.parse(event.body);

    if (userID === undefined || info === undefined) {
      throw new ErrorWithStatus("userID and info must be passed in body", 400);
    }

    await setUserInfo(JSON.parse(event.body).test ? testTableName : tableName, userID, info);

    return {
      headers,
      statusCode: 200,
      body: JSON.stringify({
        message: `Provided information has been successfully set for user ${userID}`,
      }),
    };
  } catch (error: any) {
    logger.info("Error with User Set Info", error);
    return {
      headers,
      statusCode: error.statusCode || 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
}

/**
 * Handler for the /get endpoint
 * @param event all of the info provided by Lambda about the event
 * @returns the HTTP response
 */
export async function handleGetInfo(event: LambdaFunctionURLEvent): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      throw new ErrorWithStatus("Body is not provided", 400);
    }

    const { userID, fields } = JSON.parse(event.body);

    if (userID === undefined || fields === undefined) {
      throw new ErrorWithStatus("userID and field must be passed in body", 400);
    }

    const value: { [field: string]: string } = await getUserInfo(
      JSON.parse(event.body).test ? testTableName : tableName,
      userID,
      fields
    );

    return {
      headers,
      statusCode: 200,
      body: JSON.stringify({ fields: value }),
    };
  } catch (error: any) {
    logger.info("Error with User Get Info", error.message);
    return {
      headers,
      statusCode: error.statusCode || 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
}

/**
 * Handler for the /change-pw endpoint
 * @param event all of the info provided by Lambda about the event
 * @returns the HTTP response
 */
export async function handleChangePW(
  event: LambdaFunctionURLEvent
): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      throw new ErrorWithStatus("Body is not provided", 400);
    }

    const { email, oldPassword, newPassword } = JSON.parse(event.body);

    if (email === undefined || oldPassword === undefined || newPassword === undefined) {
      throw new ErrorWithStatus("email, oldPassword and newPassword must be passed in body", 400);
    }

    await changePassword(
      JSON.parse(event.body).test ? testTableName : tableName,
      email,
      oldPassword,
      newPassword
    );

    return {
      headers,
      statusCode: 200,
      body: JSON.stringify({
        message: `User with email ${email} has successfully changed their password.`,
      }),
    };
  } catch (error: any) {
    logger.info("Error with User Password Change", error);
    return {
      headers,
      statusCode: error.statusCode || 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
}

/**
 * Handler for the /delete endpoint
 * @param event all of the info provided by Lambda about the event
 * @returns the HTTP response
 */
export async function handleDeleteUser(
  event: LambdaFunctionURLEvent
): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      throw new ErrorWithStatus("Body is not provided", 400);
    }

    const { userID } = JSON.parse(event.body);

    if (userID === undefined) {
      throw new ErrorWithStatus("userID must be passed in body", 400);
    }

    await deleteUser(JSON.parse(event.body).test ? testTableName : tableName, userID);

    return {
      headers,
      statusCode: 200,
      body: JSON.stringify({ message: `userID ${userID} successfully deleted.` }),
    };
  } catch (error: any) {
    logger.info("Error with Delete User", error);
    return {
      headers,
      statusCode: error.statusCode || 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
}

/**
 * Handler for the /pw-reset-token endpoint
 * @param event all of the info provided by Lambda about the event
 * @returns the HTTP response
 */
export async function handleSendPasswordResetToken(
  event: LambdaFunctionURLEvent
): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      throw new ErrorWithStatus("Body is not provided", 400);
    }

    const { email } = JSON.parse(event.body);

    if (email === undefined) {
      throw new ErrorWithStatus("email must be passed in body", 400);
    }

    const token = await sendPasswordResetToken(
      JSON.parse(event.body).test ? testTableName : tableName,
      email
    );

    if (JSON.parse(event.body).test) {
      // Return token if in testing
      return {
        headers,
        statusCode: 200,
        body: JSON.stringify({
          token: token,
          message: `User with email ${email} has successfully been emailed a password reset token.`,
        }),
      };
    }

    return {
      headers,
      statusCode: 200,
      body: JSON.stringify({
        message: `User with email ${email} has successfully been emailed a password reset token.`,
      }),
    };
  } catch (error: any) {
    logger.info("Error with Sending Password Reset Token", error);
    return {
      headers,
      statusCode: error.statusCode || 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
}

export async function handleResetPassword(
  event: LambdaFunctionURLEvent
): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      throw new ErrorWithStatus("Body is not provided", 400);
    }

    const { email, token, newPassword } = JSON.parse(event.body);

    if (email === undefined || token === undefined || newPassword === undefined) {
      throw new ErrorWithStatus("email, token, and newPassword must be passed in body", 400);
    }

    await resetPassword(
      JSON.parse(event.body).test ? testTableName : tableName,
      email,
      token,
      newPassword
    );

    return {
      headers,
      statusCode: 200,
      body: JSON.stringify({
        message: `User with email ${email} has successfully reset their password`,
      }),
    };
  } catch (error: any) {
    logger.info("Error with Resetting User Password", error);
    return {
      headers,
      statusCode: error.statusCode || 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
}
