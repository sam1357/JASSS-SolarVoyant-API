import bcrypt from "bcryptjs";
import { testTableName } from "../src/constants";
import {
  authenticateUser,
  changePassword,
  deleteUser,
  getUserInfo,
  registerUser,
  setUserInfo,
  sendPasswordResetToken,
  resetPassword,
  clearNotifications,
  GetUserAll,
} from "../src/dynamo";
import { ErrorWithStatus } from "../src/types/errorWithStatus";
import { mockClient } from "aws-sdk-client-mock";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { getUser } from "./resources/testUtils";

const mockDynamoClient = mockClient(DynamoDBDocumentClient);
import "aws-sdk-client-mock-jest";

beforeEach(() => {
  mockDynamoClient.reset();
});

afterEach(() => {
  mockDynamoClient.reset();
});

describe("Register User", () => {
  it("Invalid: Given Invalid Table Name", async () => {
    await expect(
      registerUser("asdf", "stephen", "stephen123", "stephen@gmail.com")
    ).rejects.toThrow(new ErrorWithStatus("Invalid Table Name", 400));
  });

  it("Invalid: Given Invalid Email", async () => {
    await expect(registerUser(testTableName, "stephen", "stephen123", "1234")).rejects.toThrow(
      new ErrorWithStatus("Invalid Email", 400)
    );
  });

  it("Invalid: Email is Taken", async () => {
    mockDynamoClient.on(ScanCommand).resolves({
      Items: [],
    });
    await registerUser(testTableName, "stephen", "stephen123", "stephen@gmail.com");

    mockDynamoClient.on(ScanCommand).resolves({
      Items: [
        {
          username: "stephen",
          email: "stephen@gmail.com",
        } as any,
      ],
    });
    await expect(registerUser(testTableName, "dup", "dup123", "stephen@gmail.com")).rejects.toThrow(
      new ErrorWithStatus("Email has been taken.", 400)
    );
  });

  it("Valid: All Valid Inputs Provided", async () => {
    mockDynamoClient.on(ScanCommand).resolves({
      Items: [],
    });
    const userId = await registerUser(testTableName, "stephen", "stephen123", "stephen@gmail.com");

    mockDynamoClient.on(GetCommand).resolves({
      Item: {
        "user_id": userId,
        "username": "stephen",
        "password_hash": expect.any(String),
        "email": "stephen@gmail.com",
      },
    });

    await expect(getUser(testTableName, userId)).resolves.toEqual({
      "user_id": userId,
      "username": "stephen",
      "password_hash": expect.any(String),
      "email": "stephen@gmail.com",
    });
  });
});

describe("Authenticate User", () => {
  let userId: string;

  it("Invalid: Given Invalid Table Name", async () => {
    mockDynamoClient.on(ScanCommand).resolves({
      Items: [],
    });
    userId = await registerUser(testTableName, "stephen", "stephen123", "stephen@gmail.com");
    await expect(authenticateUser("asdf", "stephen", "stephen123")).rejects.toThrow(
      new ErrorWithStatus("Invalid Table Name", 400)
    );
  });

  it("Invalid: Given Invalid Login Details", async () => {
    const password_hash: string = await bcrypt.hash("stephen123", 10);
    mockDynamoClient.on(ScanCommand).resolves({
      Items: [
        {
          username: "stephen",
          email: "stephen@gmail.com",
          password_hash: password_hash,
        } as any,
      ],
    });

    await expect(authenticateUser(testTableName, "stephen", "wrong")).rejects.toThrow(
      new ErrorWithStatus("Authentication Error (Incorrect email or password)", 400)
    );
    await expect(authenticateUser(testTableName, "wrong", "stephen123")).rejects.toThrow(
      new ErrorWithStatus("Authentication Error (Incorrect email or password)", 400)
    );
  });

  it("Valid: Given Valid Login Details", async () => {
    const password_hash: string = await bcrypt.hash("stephen123", 10);
    mockDynamoClient.on(ScanCommand).resolves({
      Items: [
        {
          username: "stephen",
          email: "stephen@gmail.com",
          user_id: userId,
          password_hash: password_hash,
        } as any,
      ],
    });
    await expect(
      authenticateUser(testTableName, "stephen@gmail.com", "stephen123")
    ).resolves.toEqual(userId);
  });
});

describe("Clear Notifications", () => {
  let userId: string;

  it("Invalid: Given Invalid Table Name", async () => {
    mockDynamoClient.on(ScanCommand).resolves({
      Items: [],
    });
    userId = await registerUser(testTableName, "stephen", "stephen123", "stephen@gmail.com");
    await expect(clearNotifications("asfd", userId)).rejects.toThrow(
      new ErrorWithStatus("Invalid Table Name", 400)
    );
  });

  it("Invalid: Given Invalid UserID", async () => {
    mockDynamoClient.on(ScanCommand).resolves({
      Items: [],
    });
    userId = await registerUser(testTableName, "stephen", "stephen123", "stephen@gmail.com");
    mockDynamoClient.on(UpdateCommand).rejects("Error");
    await expect(clearNotifications(testTableName, "what")).rejects.toThrow(
      new ErrorWithStatus("User Id does not exist", 400)
    );
  });

  it("Valid working case for clearNotifications", async () => {
    mockDynamoClient.on(ScanCommand).resolves({
      Items: [],
    });
    userId = await registerUser(testTableName, "stephen", "stephen123", "stephen@gmail.com");
    mockDynamoClient.on(ScanCommand).resolves({
      Items: [
        {
          "user_id": userId,
          "notifications": ["A", "B", "C"],
        },
      ],
    });
    await expect(clearNotifications(testTableName, userId)).resolves.not.toThrow();
  });
});

describe("Get User All", () => {
  let userId: string;

  it("Invalid: Given Invalid Table Name", async () => {
    mockDynamoClient.on(ScanCommand).resolves({
      Items: [],
    });
    userId = await registerUser(testTableName, "stephen", "stephen123", "stephen@gmail.com");
    await expect(GetUserAll("asfd", userId)).rejects.toThrow(
      new ErrorWithStatus("Invalid Table Name", 400)
    );
  });

  it("Invalid: Given Invalid UserID", async () => {
    mockDynamoClient.on(ScanCommand).resolves({
      Items: [],
    });
    userId = await registerUser(testTableName, "stephen", "stephen123", "stephen@gmail.com");
    mockDynamoClient.on(GetCommand).rejects;
    await expect(GetUserAll(testTableName, "what")).rejects.toThrow(
      new ErrorWithStatus("Unable to read user", 400)
    );
  });
});

describe("Set User Info", () => {
  let userId: string;

  it("Invalid: Given Invalid Table Name", async () => {
    mockDynamoClient.on(ScanCommand).resolves({
      Items: [],
    });
    userId = await registerUser(testTableName, "stephen", "stephen123", "stephen@gmail.com");
    await expect(setUserInfo("asfd", userId, { "surface_area": "100" })).rejects.toThrow(
      new ErrorWithStatus("Invalid Table Name", 400)
    );
  });

  it("Invalid: Given Invalid Field", async () => {
    await expect(setUserInfo(testTableName, userId, { "lol": "100" })).rejects.toThrow(
      new ErrorWithStatus("User field 'lol' is invalid", 400)
    );
  });

  it("Invalid: Given Invalid Surface Area Value", async () => {
    await expect(setUserInfo(testTableName, userId, { "surface_area": "asdf" })).rejects.toThrow(
      new ErrorWithStatus("surface_area must be a positive number (up to 5 decimal places)", 400)
    );
    await expect(setUserInfo(testTableName, userId, { "surface_area": "-100" })).rejects.toThrow(
      new ErrorWithStatus("surface_area must be a positive number (up to 5 decimal places)", 400)
    );
    await expect(
      setUserInfo(testTableName, userId, { "surface_area": "100.111111" })
    ).rejects.toThrow(
      new ErrorWithStatus("surface_area must be a positive number (up to 5 decimal places)", 400)
    );
  });

  it("Invalid: Given Invalid Quarterly Energy Consumption Value", async () => {
    await expect(
      setUserInfo(testTableName, userId, { "quarterly_energy_consumption": "1234, 1234, 1234" })
    ).rejects.toThrow(
      new ErrorWithStatus(
        "quarterly_energy_consumption must consist of four comma separated numbers",
        400
      )
    );
    await expect(
      setUserInfo(testTableName, userId, {
        "quarterly_energy_consumption": "1234, 1234, asdf, 1234",
      })
    ).rejects.toThrow(
      new ErrorWithStatus("asdf is not a positive number (up to 5 decimal places)", 400)
    );
  });

  it("Invalid: Given Invalid Quarterly Energy Production Value", async () => {
    await expect(
      setUserInfo(testTableName, userId, {
        "quarterly_energy_production": "1234, 1234, 1234, 1234, 1234",
      })
    ).rejects.toThrow(
      new ErrorWithStatus(
        "quarterly_energy_production must consist of four comma separated numbers",
        400
      )
    );
    await expect(
      setUserInfo(testTableName, userId, {
        "quarterly_energy_production": "1234, -100.101010, 1234, 1234",
      })
    ).rejects.toThrow(
      new ErrorWithStatus("-100.101010 is not a positive number (up to 5 decimal places)", 400)
    );
  });

  it("Handle different receive_emails values", async () => {
    await expect(
      setUserInfo(testTableName, userId, {
        "receive_emails": "what",
      })
    ).rejects.toThrow(
      new ErrorWithStatus("receive_emails field must be set to 'true' or 'false'", 400)
    );

    await expect(
      setUserInfo(testTableName, userId, {
        "receive_emails": "true",
      })
    ).resolves.not.toThrow();

    await expect(
      setUserInfo(testTableName, userId, {
        "receive_emails": "false",
      })
    ).resolves.not.toThrow();
  });

  it("Handle different lower and upper limit values", async () => {
    await expect(
      setUserInfo(testTableName, userId, {
        "upper_limit": "20.1",
      })
    ).rejects.toThrow(
      new ErrorWithStatus(
        "lower_limit and upper_limit fields must be set to a positive integer",
        400
      )
    );

    await expect(
      setUserInfo(testTableName, userId, {
        "lower_limit": "what",
      })
    ).rejects.toThrow(
      new ErrorWithStatus(
        "lower_limit and upper_limit fields must be set to a positive integer",
        400
      )
    );

    await expect(
      setUserInfo(testTableName, userId, {
        "upper_limit": "21",
      })
    ).resolves.not.toThrow();

    await expect(
      setUserInfo(testTableName, userId, {
        "lower_limit": "1",
      })
    ).resolves.not.toThrow();
  });

  it("Handle different temp/daylight coefficient values", async () => {
    await expect(
      setUserInfo(testTableName, userId, {
        "temp_coefficient": "what",
      })
    ).rejects.toThrow(
      new ErrorWithStatus(
        "temp_coefficient and daylight_coefficient fields must be set to a number",
        400
      )
    );

    await expect(
      setUserInfo(testTableName, userId, {
        "daylight_coefficient": "what",
      })
    ).rejects.toThrow(
      new ErrorWithStatus(
        "temp_coefficient and daylight_coefficient fields must be set to a number",
        400
      )
    );

    await expect(
      setUserInfo(testTableName, userId, {
        "temp_coefficient": "21",
      })
    ).resolves.not.toThrow();

    await expect(
      setUserInfo(testTableName, userId, {
        "temp_coefficient": ".21",
      })
    ).resolves.not.toThrow();

    await expect(
      setUserInfo(testTableName, userId, {
        "daylight_coefficient": "-18.21",
      })
    ).resolves.not.toThrow();

    await expect(
      setUserInfo(testTableName, userId, {
        "daylight_coefficient": "-.21",
      })
    ).resolves.not.toThrow();

    await expect(
      setUserInfo(testTableName, userId, {
        "daylight_coefficient": "-3",
      })
    ).resolves.not.toThrow();
  });

  it("Handle different lower and upper limit values", async () => {
    await expect(
      setUserInfo(testTableName, userId, {
        "production_coefficient": "20.1",
      })
    ).rejects.toThrow(new ErrorWithStatus("production_coefficient must be an array", 400));

    await expect(
      setUserInfo(testTableName, userId, {
        "production_coefficient": [],
      })
    ).rejects.toThrow(new ErrorWithStatus("production_coefficient must have four entries", 400));

    await expect(
      setUserInfo(testTableName, userId, {
        "production_coefficient": ["21.1", "-19.8", "what", "76"],
      })
    ).rejects.toThrow(new ErrorWithStatus("production_coefficient must have number entries", 400));

    await expect(
      setUserInfo(testTableName, userId, {
        "production_coefficient": ["21.1", "-19.8", "12", "76"],
      })
    ).resolves.not.toThrow();
  });

  it("Handle different Q values", async () => {
    await expect(
      setUserInfo(testTableName, userId, {
        "q1_t": "haha",
      })
    ).rejects.toThrow(new ErrorWithStatus("Q fields must be numbers", 400));

    await expect(
      setUserInfo(testTableName, userId, {
        "Q4_D": "19",
      })
    ).resolves.not.toThrow();
  });

  it("Invalid: Given invalid User Id", async () => {
    mockDynamoClient.on(UpdateCommand).rejects("Error");
    await expect(setUserInfo(testTableName, "asfd", { "surface_area": "100" })).rejects.toThrow(
      new ErrorWithStatus("User Id does not exist", 400)
    );
  });

  it("Valid: Given Valid Inputs of single field at once", async () => {
    mockDynamoClient.on(UpdateCommand).resolves({});
    await expect(
      setUserInfo(testTableName, userId, { "surface_area": "100" })
    ).resolves.not.toThrow();
    await expect(
      setUserInfo(testTableName, userId, { "address": "53 Jonas Street" })
    ).resolves.not.toThrow();
    await expect(
      setUserInfo(testTableName, userId, { "quarterly_energy_consumption": "1, 1, 1, 1" })
    ).resolves.not.toThrow();
    await expect(
      setUserInfo(testTableName, userId, { "quarterly_energy_production": "2.2, 2.2, 2.2, 2.2" })
    ).resolves.not.toThrow();

    mockDynamoClient.on(GetCommand).resolves({
      Item: {
        user_id: userId,
        password_hash: "ABC",
        address: "53 Jonas Street",
        surface_area: "100",
        username: "stephen",
        email: "stephen@gmail.com",
        quarterly_energy_consumption: "1,1,1,1",
        quarterly_energy_production: "2.2,2.2,2.2,2.2",
      } as any,
    });

    await expect(getUser(testTableName, userId)).resolves.toEqual({
      user_id: userId,
      password_hash: "ABC",
      username: "stephen",
      address: "53 Jonas Street",
      surface_area: "100",
      email: "stephen@gmail.com",
      quarterly_energy_consumption: "1,1,1,1",
      quarterly_energy_production: "2.2,2.2,2.2,2.2",
    });
  });

  it("Valid: Given Valid Inputs of multiple fields at once", async () => {
    mockDynamoClient.on(UpdateCommand).resolves({});
    await expect(
      setUserInfo(testTableName, userId, {
        "surface_area": "100",
        "address": "53 Jonas Street",
        "quarterly_energy_consumption": "1, 1, 1, 1",
        "quarterly_energy_production": "2.2, 2.2, 2.2, 2.2",
      })
    ).resolves.not.toThrow();

    mockDynamoClient.on(GetCommand).resolves({
      Item: {
        user_id: userId,
        password_hash: "ABC",
        address: "53 Jonas Street",
        surface_area: "100",
        username: "stephen",
        email: "stephen@gmail.com",
        quarterly_energy_consumption: "1,1,1,1",
        quarterly_energy_production: "2.2,2.2,2.2,2.2",
      } as any,
    });

    await expect(getUser(testTableName, userId)).resolves.toEqual({
      user_id: userId,
      password_hash: "ABC",
      username: "stephen",
      address: "53 Jonas Street",
      surface_area: "100",
      email: "stephen@gmail.com",
      quarterly_energy_consumption: "1,1,1,1",
      quarterly_energy_production: "2.2,2.2,2.2,2.2",
    });
  });
});

describe("Get User Info", () => {
  let userId: string;

  it("Invalid: Given Invalid Table Name", async () => {
    mockDynamoClient.on(ScanCommand).resolves({
      Items: [],
    });
    userId = await registerUser(testTableName, "stephen", "stephen123", "stephen@gmail.com");
    await expect(getUserInfo("asdf", userId, "username")).rejects.toThrow(
      new ErrorWithStatus("Invalid Table Name", 400)
    );
  });

  it("Invalid: Given Invalid Field", async () => {
    await expect(getUserInfo(testTableName, userId, "lol")).rejects.toThrow(
      new ErrorWithStatus("User field 'lol' is invalid", 400)
    );
  });

  it("Invalid: Given Invalid User Id", async () => {
    mockDynamoClient.on(GetCommand).resolves({});
    await expect(getUserInfo(testTableName, "asdf", "username")).rejects.toThrow(
      new ErrorWithStatus("Invalid User Id", 400)
    );
  });

  it("Invalid: Given Uninitialised Field", async () => {
    mockDynamoClient.on(GetCommand).resolves({
      Item: {},
    });

    await expect(getUserInfo(testTableName, userId, "surface_area")).rejects.toThrow(
      new ErrorWithStatus("Uninitialised value/s: 'surface_area'", 400)
    );
  });

  it("Valid: Given Valid Inputs of single field at once", async () => {
    mockDynamoClient.on(GetCommand).resolves({
      Item: {
        "username": "stephen",
      },
    });
    await expect(getUserInfo(testTableName, userId, "username")).resolves.toStrictEqual({
      "username": "stephen",
    });
  });

  it("Valid: Given Valid Inputs of multiple fields at once", async () => {
    mockDynamoClient.on(GetCommand).resolves({
      Item: {
        "username": "stephen",
        "email": "stephen@stephen.com",
      },
    });
    await expect(getUserInfo(testTableName, userId, "username, email")).resolves.toStrictEqual({
      "email": "stephen@stephen.com",
      "username": "stephen",
    });
  });
});

describe("Change Password", () => {
  it("Invalid: Given Invalid Table Name", async () => {
    mockDynamoClient.on(ScanCommand).resolves({
      Items: [],
    });
    await registerUser(testTableName, "stephen", "stephen123", "stephen@gmail.com");
    await expect(changePassword("asdf", "stephen", "stephen123", "stephen1234")).rejects.toThrow(
      new ErrorWithStatus("Invalid Table Name", 400)
    );
  });

  it("Invalid: New Password same as Old Password", async () => {
    mockDynamoClient.on(ScanCommand).resolves({
      Items: [],
    });
    await registerUser(testTableName, "stephen", "stephen123", "stephen@gmail.com");
    await expect(
      changePassword(testTableName, "stephen", "stephen123", "stephen123")
    ).rejects.toThrow(
      new ErrorWithStatus("New password cannot be the same as your old password", 400)
    );
  });

  it("Invalid: Given Invalid Login Details", async () => {
    const password_hash: string = await bcrypt.hash("stephen123", 10);
    mockDynamoClient.on(ScanCommand).resolves({
      Items: [
        {
          "username": "stephen",
          "password_hash": password_hash,
        },
      ],
    });
    await expect(changePassword(testTableName, "stephen", "wrong", "stephen1234")).rejects.toThrow(
      new ErrorWithStatus("Authentication Error (Incorrect email or password)", 400)
    );
    await expect(
      changePassword(testTableName, "wrong", "stephen123", "stephen1234")
    ).rejects.toThrow(
      new ErrorWithStatus("Authentication Error (Incorrect email or password)", 400)
    );
  });

  it("Valid: Given Valid Inputs", async () => {
    const password_hash: string = await bcrypt.hash("stephen123", 10);
    mockDynamoClient.on(ScanCommand).resolves({
      Items: [
        {
          "email": "stephen@stephen.com",
          "password_hash": password_hash,
        },
      ],
    });
    await changePassword(testTableName, "stephen@stephen.com", "stephen123", "stephen1234");

    // Old Username/Password Combination should fail authentication
    const new_hash: string = await bcrypt.hash("stephen1234", 10);
    mockDynamoClient.on(ScanCommand).resolves({
      Items: [
        {
          "email": "stephen@stephen.com",
          "password_hash": new_hash,
        },
      ],
    });
    await expect(
      authenticateUser(testTableName, "stephen@stephen.com", "stephen123")
    ).rejects.toThrow(
      new ErrorWithStatus("Authentication Error (Incorrect email or password)", 400)
    );

    // New Username/Password Combination should throw no Error
    await expect(
      authenticateUser(testTableName, "stephen@stephen.com", "stephen1234")
    ).resolves.not.toThrow();
  });
});

describe("Delete User", () => {
  let userId: string;
  it("Invalid: Given Invalid Table Name", async () => {
    mockDynamoClient.on(ScanCommand).resolves({
      Items: [],
    });
    userId = await registerUser(testTableName, "stephen", "stephen123", "stephen@gmail.com");
    await expect(deleteUser("asdf", userId)).rejects.toThrow(
      new ErrorWithStatus("Invalid Table Name", 400)
    );
  });

  it("Invalid: Given User Id", async () => {
    mockDynamoClient.on(DeleteCommand).rejects("A");
    await expect(deleteUser(testTableName, "asdf")).rejects.toThrow(
      new ErrorWithStatus("User Id does not exist", 400)
    );
  });

  it("Valid: Given Valid Inputs", async () => {
    mockDynamoClient.on(DeleteCommand).resolves({});
    await expect(deleteUser(testTableName, userId)).resolves.not.toThrow();
    mockDynamoClient.on(GetCommand).resolves({});
    await expect(getUser(testTableName, userId)).resolves.toEqual({});
  });
});

describe("Send Password Reset Token", () => {
  it("Invalid: Given Invalid Table Name", async () => {
    await expect(sendPasswordResetToken("asdf", "stephendl0820@gmail.com")).rejects.toThrow(
      new ErrorWithStatus("Invalid Table Name", 400)
    );
  });

  it("Invalid: Given Invalid Email Format", async () => {
    await expect(sendPasswordResetToken(testTableName, "asdf")).rejects.toThrow(
      new ErrorWithStatus("Email does not exist", 400)
    );
  });

  it("Invalid: Given Invalid Non-Existent Email", async () => {
    mockDynamoClient.on(ScanCommand).resolves({
      Items: [
        {
          "username": "stephen",
          "email": "lol@gmail.com",
          "user_id": "19fj3ma",
        },
      ],
    });
    await expect(sendPasswordResetToken(testTableName, "stephendl0820@gmail.com")).rejects.toThrow(
      new ErrorWithStatus("Email does not exist", 400)
    );
    expect(mockDynamoClient).toReceiveCommandTimes(ScanCommand, 1);
  });

  it("Invalid: Given Valid Email, but User uses OAuth", async () => {
    mockDynamoClient.on(ScanCommand).resolves({
      Items: [
        {
          "username": "stephen",
          "email": "stephendl0820@gmail.com",
          "user_id": "19fj3ma",
          "provider": "Goog",
        },
      ],
    });
    await expect(sendPasswordResetToken(testTableName, "stephendl0820@gmail.com")).rejects.toThrow(
      new ErrorWithStatus(
        "You previously signed up using Goog. So you do not have a SolarVoyant password to reset.",
        403
      )
    );
    expect(mockDynamoClient).toReceiveCommandTimes(ScanCommand, 1);
  });

  it("Valid: Given Valid Inputs", async () => {
    // Mock Dynamodb Commands
    mockDynamoClient.on(ScanCommand).resolves({
      Items: [
        {
          "username": "stephen",
          "email": "stephendl0820@gmail.com",
          "user_id": "19fj3ma",
        },
      ],
    });
    mockDynamoClient.on(UpdateCommand).resolves({});
    await expect(sendPasswordResetToken(testTableName, "stephendl0820@gmail.com")).resolves.toEqual(
      expect.any(String)
    );
    expect(mockDynamoClient).toReceiveCommandTimes(ScanCommand, 1);
    expect(mockDynamoClient).toReceiveCommandTimes(UpdateCommand, 1);
  });
});

describe("Reset Password", () => {
  it("Invalid: Given Invalid Table Name", async () => {
    await expect(
      resetPassword("asdf", "stephendl0820@gmail.com", "1z1a", "password")
    ).rejects.toThrow(new ErrorWithStatus("Invalid Table Name", 400));
  });

  it("Invalid: Given Invalid Email Format", async () => {
    await expect(resetPassword(testTableName, "asdf", "1z1a", "password")).rejects.toThrow(
      new ErrorWithStatus("Email does not exist", 400)
    );
  });

  it("Invalid: Given Invalid Non-Existent Email", async () => {
    mockDynamoClient.on(ScanCommand).resolves({
      Items: [
        {
          "username": "stephen",
          "email": "lol@gmail.com",
          "user_id": "19fj3ma",
        },
      ],
    });
    await expect(
      resetPassword(testTableName, "stephendl0820@gmail.com", "1z1a", "password")
    ).rejects.toThrow(new ErrorWithStatus("Email does not exist", 400));
    expect(mockDynamoClient).toReceiveCommandTimes(ScanCommand, 1);
  });

  it("Invalid: New password same as old password", async () => {
    const password_hash: string = await bcrypt.hash("old", 10);
    mockDynamoClient.on(ScanCommand).resolves({
      Items: [
        {
          "username": "stephen",
          "email": "lol@gmail.com",
          "user_id": "19fj3ma",
          "password_hash": password_hash,
        },
      ],
    });
    await expect(resetPassword(testTableName, "lol@gmail.com", "1z1a", "old")).rejects.toThrow(
      new ErrorWithStatus("New password cannot be the same as your old password", 400)
    );
    expect(mockDynamoClient).toReceiveCommandTimes(ScanCommand, 1);
  });

  it("Invalid: Given Valid Email, but User uses OAuth", async () => {
    mockDynamoClient.on(ScanCommand).resolves({
      Items: [
        {
          "username": "stephen",
          "email": "stephendl0820@gmail.com",
          "user_id": "19fj3ma",
          "provider": "Goog",
        },
      ],
    });
    await expect(
      resetPassword(testTableName, "stephendl0820@gmail.com", "1z1a", "password")
    ).rejects.toThrow(
      new ErrorWithStatus(
        "You previously signed up using Goog. So you do not have a SolarVoyant password to reset.",
        403
      )
    );
    expect(mockDynamoClient).toReceiveCommandTimes(ScanCommand, 1);
  });

  it("Invalid: No Token Expected by the User", async () => {
    mockDynamoClient.on(ScanCommand).resolves({
      Items: [
        {
          "username": "stephen",
          "email": "stephendl0820@gmail.com",
          "user_id": "19fj3ma",
          "password_hash": "1dn138n49n",
        },
      ],
    });
    await expect(
      resetPassword(testTableName, "stephendl0820@gmail.com", "1z1a", "password")
    ).rejects.toThrow(new ErrorWithStatus("Invalid Token", 400));
    expect(mockDynamoClient).toReceiveCommandTimes(ScanCommand, 1);
  });

  it("Invalid: Expected Token is Expired", async () => {
    // Create an expiry date in the past
    const now = new Date();
    now.setHours(now.getHours() - 1);
    const expiryStr = now.toISOString();

    mockDynamoClient.on(ScanCommand).resolves({
      Items: [
        {
          "username": "stephen",
          "email": "stephendl0820@gmail.com",
          "user_id": "19fj3ma",
          "resetToken": "1z1a",
          "tokenExpiry": expiryStr,
          "password_hash": "1dn138n49n",
        },
      ],
    });
    mockDynamoClient.on(UpdateCommand).resolves({});
    await expect(
      resetPassword(testTableName, "stephendl0820@gmail.com", "1z1a", "password")
    ).rejects.toThrow(new ErrorWithStatus("Invalid Token", 400));
    expect(mockDynamoClient).toReceiveCommandTimes(ScanCommand, 1);
    expect(mockDynamoClient).toReceiveCommandTimes(UpdateCommand, 1);
  });

  it("Invalid: Token does not match", async () => {
    // Create an expiry date in the past
    const now = new Date();
    now.setHours(now.getHours() + 1);
    const expiryStr = now.toISOString();

    mockDynamoClient.on(ScanCommand).resolves({
      Items: [
        {
          "username": "stephen",
          "email": "stephendl0820@gmail.com",
          "user_id": "19fj3ma",
          "resetToken": "lol",
          "tokenExpiry": expiryStr,
          "password_hash": "1dn138n49n",
        },
      ],
    });
    await expect(
      resetPassword(testTableName, "stephendl0820@gmail.com", "1z1a", "password")
    ).rejects.toThrow(new ErrorWithStatus("Invalid Token", 400));
    expect(mockDynamoClient).toReceiveCommandTimes(ScanCommand, 1);
  });

  it("Valid: Given Valid Inputs", async () => {
    // Create an expiry date in the past
    const now = new Date();
    now.setHours(now.getHours() + 1);
    const expiryStr = now.toISOString();

    // Get hashed token
    const token = "myToken";
    const hashedToken = await bcrypt.hash(token, 10);

    // Mock
    mockDynamoClient.on(ScanCommand).resolves({
      Items: [
        {
          "username": "stephen",
          "email": "stephendl0820@gmail.com",
          "user_id": "19fj3ma",
          "resetToken": hashedToken,
          "tokenExpiry": expiryStr,
          "password_hash": "d1234d1",
        },
      ],
    });
    mockDynamoClient.on(UpdateCommand).resolves({});

    // Check Results
    await expect(await resetPassword(testTableName, "stephendl0820@gmail.com", token, "password"))
      .resolves;
    expect(mockDynamoClient).toReceiveCommandTimes(ScanCommand, 1);
    expect(mockDynamoClient).toReceiveCommandTimes(UpdateCommand, 1);
  });
});
