import bcrypt from "bcryptjs";
import { handler } from "../src/index";
import { LambdaFunctionURLEvent, APIGatewayProxyResult } from "aws-lambda";
import { getUser, resetTestDatabase } from "./resources/testUtils";
import { testTableName } from "../src/constants";

/*
 * Exists to create a generic test user
 */
async function createGenUser(): Promise<APIGatewayProxyResult> {
  const event: LambdaFunctionURLEvent = {
    requestContext: {
      http: {
        method: "POST",
        path: "/user-data/register",
      },
    },
  } as any;
  event.body = JSON.stringify({
    username: "myusername",
    password: "very-safe-password",
    email: "joshua@gmail.com",
    test: "A",
  });
  const response: APIGatewayProxyResult = await handler(event);
  return response;
}

async function createGenOAuthUser(): Promise<APIGatewayProxyResult> {
  const event: LambdaFunctionURLEvent = {
    requestContext: {
      http: {
        method: "POST",
        path: "/user-data/handle-oauth",
      },
    },
  } as any;
  event.body = JSON.stringify({
    username: "myusername",
    email: "joshua@gmail.com",
    provider: "Google",
    test: "A",
  });
  const response: APIGatewayProxyResult = await handler(event);
  return response;
}

describe("Test Edge Cases", () => {
  it("Test no path", async () => {
    await resetTestDatabase();
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          method: "POST",
        },
      },
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(400);
    const expectedResponse: string = JSON.stringify({
      message: "No path provided",
    });
    expect(response.body).toStrictEqual(expectedResponse);
    await resetTestDatabase();
  });

  it("Test no method", async () => {
    await resetTestDatabase();
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/register",
        },
      },
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(405);
    const expectedResponse: string = JSON.stringify({
      message: "No httpMethod provided",
    });
    expect(response.body).toStrictEqual(expectedResponse);
    await resetTestDatabase();
  });

  it("Non-existent path", async () => {
    await resetTestDatabase();
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/register",
          method: "GET",
        },
      },
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(404);
    const expectedResponse: string = JSON.stringify({
      message: "Unrecognised path and method combination",
    });
    expect(response.body).toStrictEqual(expectedResponse);
    await resetTestDatabase();
  });
});

describe("Testing User Registration", () => {
  it("Test missing body", async () => {
    await resetTestDatabase();
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/register",
          method: "POST",
        },
      },
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(400);
    const expectedResponse: string = JSON.stringify({
      message: "Body is not provided",
    });
    expect(response.body).toStrictEqual(expectedResponse);
    await resetTestDatabase();
  });

  it("Test missing params", async () => {
    await resetTestDatabase();
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/register",
          method: "POST",
        },
      },
      body: JSON.stringify({
        password: "very-safe-password",
        email: "joshua@gmail.com",
        test: "A",
      }),
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(400);
    const expectedResponse: string = JSON.stringify({
      message: "username, password and email must be passed in body",
    });
    expect(response.body).toStrictEqual(expectedResponse);
    await resetTestDatabase();
  });

  it("Test registered with OAuth", async () => {
    await resetTestDatabase();
    await createGenOAuthUser();
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/register",
          method: "POST",
        },
      },
      body: JSON.stringify({
        password: "very-safe-password",
        username: "myusername",
        email: "joshua@gmail.com",
        test: "A",
      }),
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(409);
    const expectedResponse: string = JSON.stringify({
      message: "Email has been taken. Did you mean to sign in using Google?",
    });
    expect(response.body).toStrictEqual(expectedResponse);
    await resetTestDatabase();
  });

  it("Test operational", async () => {
    await resetTestDatabase();
    const response: APIGatewayProxyResult = await createGenUser();
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain("id");
    const userID: string = JSON.parse(response.body).id;
    const user = (await getUser(testTableName, userID)) as any;
    expect(user.username).toEqual("myusername");
    expect(user.email).toEqual("joshua@gmail.com");
    expect(user.receive_emails).toEqual("true");
    expect(user.daylight_coefficient).toEqual("0");
    expect(user.temp_coefficient).toEqual("0");
    expect(user.upper_limit).toEqual("20");
    expect(user.lower_limit).toEqual("20");
    expect(user.surface_area).toEqual("100");
    expect(user.production_coefficient).toStrictEqual([]);
    expect(user.notifications).toStrictEqual([]);

    // Test unable to register again
    const eventTwo: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/register",
          method: "POST",
        },
      },
      body: JSON.stringify({
        username: "myusername",
        password: "very-safe-password",
        email: "joshua@gmail.com",
        test: "A",
      }),
    } as any;
    const responseTwo: APIGatewayProxyResult = await handler(eventTwo);
    expect(responseTwo.statusCode).toBe(409);
    expect(JSON.parse(responseTwo.body).message).toBe("Email has been taken.");
    await resetTestDatabase();
  });
});

describe("Testing User Authentication", () => {
  it("Test missing body", async () => {
    await resetTestDatabase();
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/authenticate",
          method: "POST",
        },
      },
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(400);
    const expectedResponse: string = JSON.stringify({
      message: "Body is not provided",
    });
    expect(response.body).toStrictEqual(expectedResponse);
    await resetTestDatabase();
  });

  it("Test missing params", async () => {
    await resetTestDatabase();
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/authenticate",
          method: "POST",
        },
      },
      body: JSON.stringify({
        username: "very-safe-password",
        test: "A",
      }),
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(400);
    const expectedResponse: string = JSON.stringify({
      message: "email and password must be passed in body",
    });
    expect(response.body).toStrictEqual(expectedResponse);
    await resetTestDatabase();
  });

  it("Test authenticate with OAuth registered user", async () => {
    await resetTestDatabase();
    await createGenOAuthUser();
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/authenticate",
          method: "POST",
        },
      },
      body: JSON.stringify({
        password: "very-safe-password",
        email: "joshua@gmail.com",
        test: "A",
      }),
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(403);
    const expectedResponse: string = JSON.stringify({
      message: "You previously signed up using Google. Please use that to sign in instead.",
    });
    expect(response.body).toStrictEqual(expectedResponse);
    await resetTestDatabase();
  });

  it("Test operational", async () => {
    await resetTestDatabase();

    // Registering the initial user
    const initialResponse: APIGatewayProxyResult = await createGenUser();
    const userID: string = JSON.parse(initialResponse.body).id;

    // Authenticate them
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/authenticate",
          method: "POST",
        },
      },
      body: JSON.stringify({
        email: "joshua@gmail.com",
        password: "very-safe-password",
        test: "A",
      }),
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain("id");
    expect(JSON.parse(response.body).id).toEqual(userID);

    // Fail as the incorrect password is proved
    const eventTwo: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/authenticate",
          method: "POST",
        },
      },
      body: JSON.stringify({
        email: "joshua@gmail.com",
        password: "very-safe-passwordA",
        test: "A",
      }),
    } as any;
    const responseTwo: APIGatewayProxyResult = await handler(eventTwo);
    expect(responseTwo.statusCode).toBe(401);
    expect(JSON.parse(responseTwo.body).message).toBe(
      "Authentication Error (Incorrect email or password)"
    );
    await resetTestDatabase();
  });
});

describe("Testing handling OAuth users", () => {
  it("Test missing body", async () => {
    await resetTestDatabase();
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/handle-oauth",
          method: "POST",
        },
      },
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(400);
    const expectedResponse: string = JSON.stringify({
      message: "Body is not provided",
    });
    expect(response.body).toStrictEqual(expectedResponse);
    await resetTestDatabase();
  });

  it("Test missing params", async () => {
    await resetTestDatabase();
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/handle-oauth",
          method: "POST",
        },
      },
      body: JSON.stringify({
        username: "very-safe-password",
        test: "A",
      }),
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(400);
    const expectedResponse: string = JSON.stringify({
      message: "username, email and provider must be passed in body",
    });
    expect(response.body).toStrictEqual(expectedResponse);
    await resetTestDatabase();
  });

  it("Test oauth with different oauth registered user", async () => {
    await resetTestDatabase();
    await createGenOAuthUser();
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/handle-oauth",
          method: "POST",
        },
      },
      body: JSON.stringify({
        provider: "GitHub",
        username: "josh",
        email: "joshua@gmail.com",
        test: "A",
      }),
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(403);
    const expectedResponse: string = JSON.stringify({
      message: "You first signed up via Google. Please use that provider instead.",
    });
    expect(response.body).toStrictEqual(expectedResponse);
    await resetTestDatabase();
  });

  it("Test oauth with password registered user", async () => {
    await resetTestDatabase();
    await createGenUser();
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/handle-oauth",
          method: "POST",
        },
      },
      body: JSON.stringify({
        provider: "Google",
        username: "josh",
        email: "joshua@gmail.com",
        test: "A",
      }),
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(403);
    const expectedResponse: string = JSON.stringify({
      message: "You signed up with a password. Please sign in with your password instead.",
    });
    expect(response.body).toStrictEqual(expectedResponse);
    await resetTestDatabase();
  });

  it("Test operational", async () => {
    await resetTestDatabase();

    // Registering the initial user
    const initialResponse: APIGatewayProxyResult = await createGenOAuthUser();
    const userID: string = JSON.parse(initialResponse.body).id;

    // Authenticate them
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/handle-oauth",
          method: "POST",
        },
      },
      body: JSON.stringify({
        email: "joshua@gmail.com",
        username: "myusername",
        provider: "Google",
        test: "A",
      }),
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain("id");
    expect(JSON.parse(response.body).id).toEqual(userID);

    await resetTestDatabase();
  });
});

describe("Testing User Info Setting", () => {
  it("Test missing body", async () => {
    await resetTestDatabase();
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/set",
          method: "PATCH",
        },
      },
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(400);
    const expectedResponse: string = JSON.stringify({
      message: "Body is not provided",
    });
    expect(response.body).toStrictEqual(expectedResponse);
    await resetTestDatabase();
  });

  it("Test missing params", async () => {
    await resetTestDatabase();
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/set",
          method: "PATCH",
        },
      },
      body: JSON.stringify({
        test: "A",
      }),
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(400);
    const expectedResponse: string = JSON.stringify({
      message: "userID and info must be passed in body",
    });
    expect(response.body).toStrictEqual(expectedResponse);
    await resetTestDatabase();
  });

  it("Test operational", async () => {
    await resetTestDatabase();

    const initialResponse: APIGatewayProxyResult = await createGenUser();
    const userID: string = JSON.parse(initialResponse.body).id;

    // Set address
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/set",
          method: "PATCH",
        },
      },
      body: JSON.stringify({
        userID: userID,
        info: {
          "address": "21 Hinemoa Street",
        },
        test: "A",
      }),
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(200);
    const user = (await getUser(testTableName, userID)) as any;
    expect(user.address).toBe("21 Hinemoa Street");

    // Set invalid field
    const eventTwo: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/set",
          method: "PATCH",
        },
      },
      body: JSON.stringify({
        userID: userID,
        info: {
          "bob": "WHAT!",
        },
        test: "A",
      }),
    } as any;

    const responseTwo: APIGatewayProxyResult = await handler(eventTwo);
    const expectedResponse: string = JSON.stringify({
      message: "User field 'bob' is invalid",
    });
    expect(responseTwo.statusCode).toBe(400);
    expect(responseTwo.body).toBe(expectedResponse);

    // User doesn't exist
    const eventThree: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/set",
          method: "PATCH",
        },
      },
      body: JSON.stringify({
        userID: "nonexisteduserid",
        info: {
          "SURFACE_AREA": "100",
        },
        test: "A",
      }),
    } as any;
    const responseThree: APIGatewayProxyResult = await handler(eventThree);
    const expectedResponseTwo: string = JSON.stringify({
      message: "User Id does not exist",
    });
    expect(responseThree.statusCode).toBe(400);
    expect(responseThree.body).toBe(expectedResponseTwo);

    // Set address
    const eventFour: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/set",
          method: "PATCH",
        },
      },
      body: JSON.stringify({
        userID: userID,
        info: {
          "surface_area": "100",
          "quarterly_energy_consumption": "1, 1, 1, 1",
        },
        test: "A",
      }),
    } as any;
    const responseFour: APIGatewayProxyResult = await handler(eventFour);
    expect(responseFour.statusCode).toBe(200);
    const userTwo = (await getUser(testTableName, userID)) as any;
    expect(userTwo.surface_area).toBe("100");
    expect(userTwo.quarterly_energy_consumption).toBe("1, 1, 1, 1");

    await resetTestDatabase();
  });
});

describe("Testing User Info Getting", () => {
  it("Test missing body", async () => {
    await resetTestDatabase();
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/get",
          method: "GET",
        },
      },
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(400);
    const expectedResponse: string = JSON.stringify({
      message: "Body is not provided",
    });
    expect(response.body).toStrictEqual(expectedResponse);
    await resetTestDatabase();
  });

  it("Test missing params", async () => {
    await resetTestDatabase();
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/get",
          method: "GET",
        },
      },
      body: JSON.stringify({
        test: "A",
      }),
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(400);
    const expectedResponse: string = JSON.stringify({
      message: "userID and field must be passed in body",
    });
    expect(response.body).toStrictEqual(expectedResponse);
    await resetTestDatabase();
  });

  it("Test operational", async () => {
    await resetTestDatabase();

    const initialResponse: APIGatewayProxyResult = await createGenUser();
    const userID: string = JSON.parse(initialResponse.body).id;

    // Invalid user field
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/get",
          method: "GET",
        },
      },
      body: JSON.stringify({
        userID: userID,
        fields: "invalid",
        test: "A",
      }),
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    const expectedResponse: string = JSON.stringify({
      message: "User field 'invalid' is invalid",
    });
    expect(response.body).toBe(expectedResponse);
    expect(response.statusCode).toBe(400);

    // Uninitialised field
    const eventTwo: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/get",
          method: "GET",
        },
      },
      body: JSON.stringify({
        userID: userID,
        fields: "address",
        test: "A",
      }),
    } as any;
    const responseTwo: APIGatewayProxyResult = await handler(eventTwo);
    const expectedResponseTwo: string = JSON.stringify({
      message: "Uninitialised value/s: 'address'",
    });
    expect(responseTwo.body).toBe(expectedResponseTwo);
    expect(responseTwo.statusCode).toBe(400);

    // // Working cases
    const eventThree: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/get",
          method: "GET",
        },
      },
      body: JSON.stringify({
        userID: userID,
        fields: "username",
        test: "A",
      }),
    } as any;
    const responseThree: APIGatewayProxyResult = await handler(eventThree);
    expect(responseThree.statusCode).toBe(200);
    const expectedResponseThree: string = JSON.stringify({
      fields: { "username": "myusername" },
    });
    expect(responseThree.body).toBe(expectedResponseThree);

    const eventFour: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/get",
          method: "GET",
        },
      },
      body: JSON.stringify({
        userID: userID,
        fields: "username, email",
        test: "A",
      }),
    } as any;
    const responseFour: APIGatewayProxyResult = await handler(eventFour);
    expect(responseFour.statusCode).toBe(200);
    const expectedResponseFour: string = JSON.stringify({
      fields: { "email": "joshua@gmail.com", "username": "myusername" },
    });
    expect(responseFour.body).toBe(expectedResponseFour);

    await resetTestDatabase();
  });
});

describe("Testing User Change Password", () => {
  it("Test missing body", async () => {
    await resetTestDatabase();
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/change-pw",
          method: "PATCH",
        },
      },
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(400);
    const expectedResponse: string = JSON.stringify({
      message: "Body is not provided",
    });
    expect(response.body).toStrictEqual(expectedResponse);
    await resetTestDatabase();
  });

  it("Test missing params", async () => {
    await resetTestDatabase();
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/change-pw",
          method: "PATCH",
        },
      },
      body: JSON.stringify({
        test: "A",
      }),
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(400);
    const expectedResponse: string = JSON.stringify({
      message: "email, oldPassword and newPassword must be passed in body",
    });
    expect(response.body).toStrictEqual(expectedResponse);
    await resetTestDatabase();
  });

  it("Test resetting pw for oauth user", async () => {
    await resetTestDatabase();
    await createGenOAuthUser();
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/change-pw",
          method: "PATCH",
        },
      },
      body: JSON.stringify({
        test: "A",
        email: "joshua@gmail.com",
        oldPassword: "a",
        newPassword: "b",
      }),
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(403);
    const expectedResponse: string = JSON.stringify({
      message: "You cannot change your password as you signed in with a third-party provider.",
    });
    expect(response.body).toStrictEqual(expectedResponse);
    await resetTestDatabase();
  });

  it("Test operational", async () => {
    await resetTestDatabase();

    const initialResponse: APIGatewayProxyResult = await createGenUser();
    const userID: string = JSON.parse(initialResponse.body).id;

    // Incorrect old password
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/change-pw",
          method: "PATCH",
        },
      },
      body: JSON.stringify({
        email: "joshua@gmail.com",
        oldPassword: "very-safe-passwordA",
        newPassword: "testA",
        test: "A",
      }),
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body).message).toBe(
      "Authentication Error (Incorrect email or password)"
    );

    // Successful
    const eventTwo: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/change-pw",
          method: "PATCH",
        },
      },
      body: JSON.stringify({
        email: "joshua@gmail.com",
        oldPassword: "very-safe-password",
        newPassword: "testA",
        test: "A",
      }),
    } as any;
    const responseTwo: APIGatewayProxyResult = await handler(eventTwo);
    expect(responseTwo.statusCode).toBe(200);
    const user = (await getUser(testTableName, userID)) as any;
    expect(await bcrypt.compare("testA", user.password_hash)).toBe(true);
    await resetTestDatabase();
  });
});

describe("Testing User Delete", () => {
  it("Test missing body", async () => {
    await resetTestDatabase();
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/delete",
          method: "DELETE",
        },
      },
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(400);
    const expectedResponse: string = JSON.stringify({
      message: "Body is not provided",
    });
    expect(response.body).toStrictEqual(expectedResponse);
    await resetTestDatabase();
  });

  it("Test missing params", async () => {
    await resetTestDatabase();
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/delete",
          method: "DELETE",
        },
      },
      body: JSON.stringify({
        test: "A",
      }),
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(400);
    const expectedResponse: string = JSON.stringify({
      message: "userID must be passed in body",
    });
    expect(response.body).toStrictEqual(expectedResponse);
    await resetTestDatabase();
  });

  it("Test operational", async () => {
    await resetTestDatabase();

    // Fail, delete non-existent
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/delete",
          method: "DELETE",
        },
      },
      body: JSON.stringify({
        userID: "non-existent",
        test: "A",
      }),
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(400);
    const expectedResponse: string = JSON.stringify({
      message: "User Id does not exist",
    });
    expect(response.body).toStrictEqual(expectedResponse);

    // Sucess delete existent
    // Registering the initial user
    const initialResponse: APIGatewayProxyResult = await createGenUser();
    const userID: string = JSON.parse(initialResponse.body).id;

    const eventTwo: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/delete",
          method: "DELETE",
        },
      },
      body: JSON.stringify({
        userID: userID,
        test: "A",
      }),
    } as any;
    const responseTwo: APIGatewayProxyResult = await handler(eventTwo);
    expect(responseTwo.statusCode).toBe(200);
    expect(await getUser(testTableName, userID)).toStrictEqual({});
    await resetTestDatabase();
  });
});

describe("Testing Sending Password Reset Token", () => {
  it("Test missing body", async () => {
    await resetTestDatabase();
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/pw-reset-token",
          method: "POST",
        },
      },
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(400);
    const expectedResponse: string = JSON.stringify({
      message: "Body is not provided",
    });
    expect(response.body).toStrictEqual(expectedResponse);
    await resetTestDatabase();
  });

  it("Test missing params", async () => {
    await resetTestDatabase();
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/pw-reset-token",
          method: "POST",
        },
      },
      body: JSON.stringify({
        test: "A",
      }),
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(400);
    const expectedResponse: string = JSON.stringify({
      message: "email must be passed in body",
    });
    expect(response.body).toStrictEqual(expectedResponse);
    await resetTestDatabase();
  });

  it("Test resetting pw for oauth user", async () => {
    await resetTestDatabase();
    await createGenOAuthUser();
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/pw-reset-token",
          method: "POST",
        },
      },
      body: JSON.stringify({
        test: "A",
        email: "joshua@gmail.com",
      }),
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(403);
    const expectedResponse: string = JSON.stringify({
      message:
        // eslint-disable-next-line
        "You previously signed up using Google. So you do not have a SolarVoyant password to reset.",
    });
    expect(response.body).toStrictEqual(expectedResponse);
    await resetTestDatabase();
  });

  it("Test operational", async () => {
    await resetTestDatabase();

    // Create a user with a real email
    const event0: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          method: "POST",
          path: "/user-data/register",
        },
      },
    } as any;
    event0.body = JSON.stringify({
      username: "myusername",
      password: "very-safe-password",
      email: "stephendl0820@gmail.com",
      test: "A",
    });
    const response0: APIGatewayProxyResult = await handler(event0);
    const userID: string = JSON.parse(response0.body).id;

    // Successfully Issue a Token
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/pw-reset-token",
          method: "POST",
        },
      },
      body: JSON.stringify({
        email: "stephendl0820@gmail.com",
        test: "A",
      }),
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).message).toBe(
      // eslint-disable-next-line
      "User with email stephendl0820@gmail.com has successfully been emailed a password reset token."
    );

    // Check that token and token expiry has been added to user data
    const user = (await getUser(testTableName, userID)) as any;
    const resetToken = user.resetToken;
    const tokenExpiry = user.tokenExpiry;

    expect(resetToken).toEqual(expect.any(String));
    expect(tokenExpiry).toEqual(expect.any(String));
    await resetTestDatabase();
  }, 10000);
});

describe("Testing Reset Password", () => {
  it("Test missing body", async () => {
    await resetTestDatabase();
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/pw-reset",
          method: "PATCH",
        },
      },
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(400);
    const expectedResponse: string = JSON.stringify({
      message: "Body is not provided",
    });
    expect(response.body).toStrictEqual(expectedResponse);
    await resetTestDatabase();
  });

  it("Test missing params", async () => {
    await resetTestDatabase();
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/pw-reset",
          method: "PATCH",
        },
      },
      body: JSON.stringify({
        test: "A",
      }),
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(400);
    const expectedResponse: string = JSON.stringify({
      message: "email, token, and newPassword must be passed in body",
    });
    expect(response.body).toStrictEqual(expectedResponse);
    await resetTestDatabase();
  });

  it("Test resetting pw for oauth user", async () => {
    await resetTestDatabase();
    await createGenOAuthUser();
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/pw-reset",
          method: "PATCH",
        },
      },
      body: JSON.stringify({
        test: "A",
        email: "joshua@gmail.com",
        token: "123",
        newPassword: "password2",
      }),
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(403);
    const expectedResponse: string = JSON.stringify({
      message:
        // eslint-disable-next-line
        "You previously signed up using Google. So you do not have a SolarVoyant password to reset.",
    });
    expect(response.body).toStrictEqual(expectedResponse);
    await resetTestDatabase();
  });

  it("Test operational", async () => {
    await resetTestDatabase();

    // (1) Create a user with a real email
    const event0: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          method: "POST",
          path: "/user-data/register",
        },
      },
    } as any;
    event0.body = JSON.stringify({
      username: "myusername",
      password: "very-safe-password",
      email: "stephendl0820@gmail.com",
      test: "A",
    });
    const response0: APIGatewayProxyResult = await handler(event0);
    const userID: string = JSON.parse(response0.body).id;

    // (2) Request a token
    const event1: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/pw-reset-token",
          method: "POST",
        },
      },
      body: JSON.stringify({
        email: "stephendl0820@gmail.com",
        test: "A",
      }),
    } as any;
    const response1: APIGatewayProxyResult = await handler(event1);
    const token = JSON.parse(response1.body).token;

    // (3) Successfully Reset the Password
    const event2: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/pw-reset",
          method: "PATCH",
        },
      },
      body: JSON.stringify({
        test: "A",
        email: "stephendl0820@gmail.com",
        token: token,
        newPassword: "password2",
      }),
    } as any;
    const response2: APIGatewayProxyResult = await handler(event2);
    expect(JSON.parse(response2.body).message).toBe(
      "User with email stephendl0820@gmail.com has successfully reset their password"
    );
    expect(response2.statusCode).toBe(200);

    // (4) Check that token and token expiry has been cleared from database after use
    const user = (await getUser(testTableName, userID)) as any;
    const resetToken = user.resetToken;
    const tokenExpiry = user.tokenExpiry;

    expect(resetToken).toEqual("");
    expect(tokenExpiry).toEqual("");

    // (5) Check that the user can login with their new password
    const event3: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/authenticate",
          method: "POST",
        },
      },
      body: JSON.stringify({
        email: "stephendl0820@gmail.com",
        password: "password2",
        test: "A",
      }),
    } as any;
    const response3: APIGatewayProxyResult = await handler(event3);
    expect(response3.statusCode).toBe(200);
    expect(response3.body).toContain("id");
    expect(JSON.parse(response3.body).id).toEqual(userID);

    // (6) Check that the user can no longer with their old password
    const event4: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/authenticate",
          method: "POST",
        },
      },
      body: JSON.stringify({
        email: "stephendl0820@gmail.com",
        password: "very-safe-password",
        test: "A",
      }),
    } as any;
    const response4: APIGatewayProxyResult = await handler(event4);
    expect(response4.statusCode).toBe(401);
    const expectedResponse: string = JSON.stringify({
      message: "Authentication Error (Incorrect email or password)",
    });
    expect(response4.body).toStrictEqual(expectedResponse);

    await resetTestDatabase();
  }, 20000);
});

describe("Testing User Clear Notification", () => {
  it("Test missing body", async () => {
    await resetTestDatabase();
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/clear-notifications",
          method: "POST",
        },
      },
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(400);
    const expectedResponse: string = JSON.stringify({
      message: "Body is not provided",
    });
    expect(response.body).toStrictEqual(expectedResponse);
    await resetTestDatabase();
  });

  it("Test missing params", async () => {
    await resetTestDatabase();
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/clear-notifications",
          method: "POST",
        },
      },
      body: JSON.stringify({
        test: "A",
      }),
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(400);
    const expectedResponse: string = JSON.stringify({
      message: "userID must be passed in body",
    });
    expect(response.body).toStrictEqual(expectedResponse);
    await resetTestDatabase();
  });

  it("Test operational", async () => {
    await resetTestDatabase();

    const initialResponse: APIGatewayProxyResult = await createGenUser();
    const userID: string = JSON.parse(initialResponse.body).id;

    // Set address
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/set",
          method: "PATCH",
        },
      },
      body: JSON.stringify({
        userID: userID,
        info: {
          "notifications": ["A", "B", "C"],
        },
        test: "A",
      }),
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(200);
    const user = (await getUser(testTableName, userID)) as any;
    expect(user.notifications).toStrictEqual(["A", "B", "C"]);

    // Set address
    const eventFour: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/clear-notifications",
          method: "POST",
        },
      },
      body: JSON.stringify({
        userID: userID,
        test: "A",
      }),
    } as any;
    const responseFour: APIGatewayProxyResult = await handler(eventFour);
    expect(responseFour.statusCode).toBe(200);
    const userTwo = (await getUser(testTableName, userID)) as any;
    expect(userTwo.notifications).toStrictEqual([]);
    await resetTestDatabase();
  });
});

describe("Testing User Get All", () => {
  it("Test missing body", async () => {
    await resetTestDatabase();
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/get-all",
          method: "GET",
        },
      },
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(400);
    const expectedResponse: string = JSON.stringify({
      message: "Body is not provided",
    });
    expect(response.body).toStrictEqual(expectedResponse);
    await resetTestDatabase();
  });

  it("Test missing params", async () => {
    await resetTestDatabase();
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/get-all",
          method: "GET",
        },
      },
      body: JSON.stringify({
        test: "A",
      }),
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(400);
    const expectedResponse: string = JSON.stringify({
      message: "userID must be passed in body",
    });
    expect(response.body).toStrictEqual(expectedResponse);
    await resetTestDatabase();
  });

  it("Test operational", async () => {
    await resetTestDatabase();

    const initialResponse: APIGatewayProxyResult = await createGenUser();
    const userID: string = JSON.parse(initialResponse.body).id;

    // Set address
    const event: LambdaFunctionURLEvent = {
      requestContext: {
        http: {
          path: "/user-data/get-all",
          method: "GET",
        },
      },
      body: JSON.stringify({
        userID: userID,
        test: "A",
      }),
    } as any;
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(200);
    const output = JSON.parse(response.body).data;
    expect(output.production_coefficient).toStrictEqual([]);
    expect(output.user_id).toBe(userID);
    expect(output.receive_emails).toBe("true");
    expect(output.notifications).toStrictEqual([]);
    expect(output.daylight_coefficient).toBe("0");
    expect(output.temp_coefficient).toBe("0");
    expect(output.lower_limit).toBe("20");
    expect(output.upper_limit).toBe("20");
    await resetTestDatabase();
  });
});
