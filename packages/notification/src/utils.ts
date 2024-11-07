import { ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import {
  CALCULATION_OFFSET,
  GROUP_NAME,
  SUBURB_LAMBDA_NAME,
  docClient,
  emailTransport,
  logger,
  tableName,
} from "./constants";
import { ErrorWithStatus } from "./interfaces/errorWithStatus";
import { InvocationType, InvokeCommand, Lambda } from "@aws-sdk/client-lambda";
import numeric from "numeric";
import { LambdaFunctionURLEvent } from "aws-lambda";

/**
 * The logic handler for the notification microservice
 * Iterates over all users and sends emails when required
 */
export async function handleNotifications() {
  const readCommand = new ScanCommand({
    TableName: tableName,
  });

  const response = await docClient.send(readCommand);

  if (!response || !response.Items) {
    // Means there is no users to process
    return;
  }
  for (const user of response.Items) {
    await handleUser(user);
  }
}

/**
 * Handles a user, calculating coefficients and potentially sends email
 * @param user: the user data from DynamoDB about the current user
 */
export async function handleUser(user: any) {
  logger.info(`Processing user: ${user.user_id}`);
  let tempCoefficient;
  let daylightCoefficient;

  let surface_area = 100;
  if (user.surface_area) {
    surface_area = parseFloat(user.surface_area);
  }

  // Calculate quarterly coefficients
  if (calculateProdCoefficients(user)) {
    await calculateProdCoefficientVals(user, surface_area);
  }

  // Don't send them an email if they don't want one
  if (user.receive_emails === undefined) {
    return;
  }
  if (user.receive_emails === "false") {
    return;
  }

  if (
    user.temp_coefficient === undefined ||
    user.daylight_coefficient === undefined ||
    (user.temp_coefficient && user.temp_coefficient === "0") ||
    (user.daylight_coefficient && user.daylight_coefficient === "0")
  ) {
    const results: any[] = await handleCoefficientCalculation(user);

    if (results.length === 0) {
      return;
    }
    tempCoefficient = parseFloat(results[0]);
    daylightCoefficient = parseFloat(results[1]);
  } else {
    tempCoefficient = user.temp_coefficient;
    daylightCoefficient = user.daylight_coefficient;
  }

  if (!user.suburb) {
    return;
  }

  const data = await getCalculatorData(user.suburb, surface_area);
  let energyGeneration = parseFloat(JSON.parse(data.body).energyGeneration);

  if (user.production_coefficient && user.production_coefficient.length !== 0) {
    energyGeneration = energyGeneration * parseFloat(user.production_coefficient[getSeason()]);
  }
  const tempAverage = JSON.parse(data.body).tempAverage;
  const daylightAverage = JSON.parse(data.body).dayLightAverage;

  let offset = 0;
  if (user.quarterly_energy_consumption === undefined) {
    offset = CALCULATION_OFFSET;
  } else {
    const consumptionArray = user.quarterly_energy_consumption.split(",");
    for (const entry of consumptionArray) {
      offset += parseFloat(entry.trim());
    }
    offset /= 4;
  }

  let energyConsumed =
    Math.abs(parseFloat(tempCoefficient)) * Math.abs(parseFloat(tempAverage) - 23.6) +
    parseFloat(daylightCoefficient) * daylightAverage;
  energyConsumed += offset;
  if (!user.upper_limit || !user.lower_limit) {
    return;
  }

  const notificationArray: string[] = [];

  const upperLimVal = parseFloat(user.upper_limit) / 100 + 1;
  const lowerLimVal = 1 - parseFloat(user.lower_limit) / 100;
  let contents;
  const percent: string = Math.abs(
    (100 * (energyConsumed - energyGeneration)) / energyConsumed
  ).toFixed(2);

  if (energyGeneration / energyConsumed >= upperLimVal) {
    // Send upper limit email
    notificationArray.push(`Energy generated has exceeded predicted consumption by ${percent}%.`);
    contents = `You have exceeded your upper limit for consumption. You have a predicted
      generation of ${energyGeneration.toFixed(2)}W compared to a predicted consumption of
      ${energyConsumed.toFixed(2)}W. Please visit the website for more details!`;
    await sendEmail(user.email, contents);
  } else if (energyGeneration / energyConsumed <= lowerLimVal) {
    // Send limit email
    notificationArray.push(
      `Energy generated has fallen short of predicted consumption by ${percent}%.`
    );
    contents = `You have exceeded your lower limit for consumption. You have a predicted
      generation of ${energyGeneration.toFixed(2)}W compared to a predicted consumption of
      ${energyConsumed.toFixed(2)}W. Please visit the website for more details!`;
    await sendEmail(user.email, contents);
  }

  if (notificationArray.length > 0) {
    await updateEntry(user.user_id, "notifications", notificationArray);
  }
}

/**
 * Invokes the calculator microservice to get required data
 *  @param suburbName: the suburb the current user lives in
 *  @returns any: the response from the notification microservice
 * */
export async function getCalculatorData(suburbName: string, surfaceArea: number): Promise<any> {
  const lambda = new Lambda({ region: process.env.DEFAULT_REGION });
  const constructEvent: LambdaFunctionURLEvent = {
    requestContext: {
      http: {
        path: "/calculator/calculateSuburb",
        method: "GET",
      },
    },
  } as any;
  constructEvent.queryStringParameters = {
    suburb: suburbName,
    surfaceArea: surfaceArea.toString(),
  };

  const params = {
    FunctionName: `${GROUP_NAME}_${process.env.STAGING_ENV}_${SUBURB_LAMBDA_NAME}`,
    InvocationType: InvocationType.RequestResponse,
    Payload: JSON.stringify(constructEvent),
  };
  let response;
  try {
    response = await lambda.send(new InvokeCommand(params));
  } catch (error) {
    logger.error("Exception thrown when fetching from suburb finder", JSON.stringify(error));
    throw new ErrorWithStatus("Exception occured when fetching from calculator microservice", 400);
  }
  if (!response || !response.Payload) {
    logger.error("Response payload from calculator was empty");
    throw new ErrorWithStatus("No return object received from lambda.", 500);
  }
  return JSON.parse(response?.Payload?.transformToString() as string);
}

/**
 * Handles coefficient calculations for a user who hasn't had it calculated
 * Side effect: writes those fields to the user so they need not be recalculated
 *  @param user: a user to calculate the coefficients for
 *  @returns string[]: stores the temp and daylight coefficients
 * */
export async function handleCoefficientCalculation(user: any): Promise<string[]> {
  if (!containsData(user)) {
    return [];
  }
  // Now assume all those fields exist
  const coefficientMatrix = [
    [parseFloat(user.q1_t), parseFloat(user.q1_d)],
    [parseFloat(user.q2_t), parseFloat(user.q2_d)],
    [parseFloat(user.q3_t), parseFloat(user.q3_d)],
    [parseFloat(user.q4_t), parseFloat(user.q4_d)],
  ];
  const solutionEquation = [
    parseFloat(user.q1_w),
    parseFloat(user.q2_w),
    parseFloat(user.q3_w),
    parseFloat(user.q4_w),
  ];

  const svd = numeric.svd(coefficientMatrix);
  // Calculating the pseudoinverse
  const S = numeric.diag(
    numeric.rep([svd.S.length], 0).map((_x: any, i: any) => (svd.S[i] > 0 ? 1 / svd.S[i] : 0))
  );
  const A_inv = numeric.dot(numeric.transpose(svd.V), numeric.dot(S, numeric.transpose(svd.U)));

  const solution: any = numeric.dot(A_inv, solutionEquation);

  const tempCoefficient = Math.abs(solution[0]);
  const daylightCoefficient = -Math.abs(solution[1]);
  if (user.user_id) {
    await updateEntry(user.user_id, "temp_coefficient", String(tempCoefficient));
    await updateEntry(user.user_id, "daylight_coefficient", String(daylightCoefficient));
  }

  return [String(tempCoefficient), String(daylightCoefficient)];
}

/**
 * Handles coefficient calculations for a user who hasn't had it calculated (production ratio)
 * Side effect: writes those fields to the user so they need not be recalculated
 *  @param user: a user to calculate the coefficients for
 * */
export async function calculateProdCoefficientVals(
  user: any,
  surface_area: number
): Promise<number[]> {
  const prod_coefficients: number[] = [];

  let predictedGenerationQ1;
  if (parseFloat(user.q1_t) > 25) {
    predictedGenerationQ1 =
      surface_area * parseFloat(user.q1_r) * (1 - 0.004 * (parseFloat(user.q1_t) - 25));
  } else {
    predictedGenerationQ1 = surface_area * parseFloat(user.q1_r);
  }

  let predictedGenerationQ2;
  if (parseFloat(user.q2_t) > 25) {
    predictedGenerationQ2 =
      surface_area * parseFloat(user.q2_r) * (1 - 0.004 * (parseFloat(user.q2_t) - 25));
  } else {
    predictedGenerationQ2 = surface_area * parseFloat(user.q2_r);
  }

  let predictedGenerationQ3;
  if (parseFloat(user.q3_t) > 25) {
    predictedGenerationQ3 =
      surface_area * parseFloat(user.q3_r) * (1 - 0.004 * (parseFloat(user.q3_t) - 25));
  } else {
    predictedGenerationQ3 = surface_area * parseFloat(user.q3_r);
  }

  let predictedGenerationQ4;
  if (parseFloat(user.q4_t) > 25) {
    predictedGenerationQ4 = parseFloat(user.q4_r) * (1 - 0.004 * (parseFloat(user.q4_t) - 25));
  } else {
    predictedGenerationQ4 = parseFloat(user.q4_r);
  }

  prod_coefficients.push(predictedGenerationQ1 / parseFloat(user.q1_w));
  prod_coefficients.push(predictedGenerationQ2 / parseFloat(user.q2_w));
  prod_coefficients.push(predictedGenerationQ3 / parseFloat(user.q3_w));
  prod_coefficients.push(predictedGenerationQ4 / parseFloat(user.q4_w));

  if (user.user_id) {
    await updateEntry(user.user_id, "production_coefficient", prod_coefficients);
  }

  return prod_coefficients;
}

/**
 * Updates an entry of a user with a particular field
 * @param userID: the id of the user to update
 * @param field: the field on the user row to updatre
 * @param val: the value to set the field to
 * */
export async function updateEntry(userID: string, field: string, val: any) {
  const command = new UpdateCommand({
    TableName: tableName,
    Key: {
      user_id: userID,
    },
    UpdateExpression: `set ${field} = :val`,
    ConditionExpression: "attribute_exists(user_id)",
    ExpressionAttributeValues: {
      ":val": val,
    },
  });

  try {
    await docClient.send(command);
  } catch (e) {
    throw new ErrorWithStatus("Error setting coefficient values", 400);
  }
}

/**
 * Returns whether or not the user contains appropriate fields to perform a coefficient calculation
 * @param user the user we're testing
 * @returns boolean: true if user contains all required fields
 */
export function containsData(user: any): boolean {
  return (
    user.q1_w !== undefined &&
    user.q1_t !== undefined &&
    user.q1_d !== undefined &&
    user.q2_w !== undefined &&
    user.q2_t !== undefined &&
    user.q2_d !== undefined &&
    user.q3_w !== undefined &&
    user.q3_t !== undefined &&
    user.q3_d !== undefined &&
    user.q4_w !== undefined &&
    user.q4_t !== undefined &&
    user.q4_d !== undefined
  );
}

/**
 * Returns whether or not the user contains appropriate fields to perform a quarterly product
 * coefficient calculation
 * @param user the user we're testing
 * @returns boolean: true if user contains all required fields
 */
export function calculateProdCoefficients(user: any): boolean {
  return (
    user.q1_w !== undefined &&
    user.q1_t !== undefined &&
    user.q1_r !== undefined &&
    user.q2_w !== undefined &&
    user.q2_t !== undefined &&
    user.q2_r !== undefined &&
    user.q3_w !== undefined &&
    user.q3_t !== undefined &&
    user.q3_r !== undefined &&
    user.q4_w !== undefined &&
    user.q4_t !== undefined &&
    user.q4_r !== undefined &&
    user.production_coefficient !== undefined &&
    user.production_coefficient.length === 0
  );
}

/**
 * Sends an email to the intended recipient
 * @param recipient: the email address of the "to"
 * @param contents: the contents of the email
 */
export async function sendEmail(recipient: string, contents: string) {
  const textStyle = `text-align: center; font-family: Arial, Helvetica, sans-serif; width: 50%; 
  font-weight: bold;`;
  const htmlContents: string = `
    <div align="center">
      <img src="https://i.ibb.co/JvJFq1f/logo.png" alt="Solarvoyant Logo" width="100" height="100">
      <h2 style="${textStyle} font-size: x-large;">Hello from the Solarvoyant Team!</h2>
      <p style="${textStyle} font-size: larger;">
        ${contents}
      </p>
    </div>`;

  const message = {
    from: process.env.MAIL_USERNAME,
    to: recipient,
    subject: "New Notification from Solarvoyant ☀️",
    html: htmlContents,
  };

  try {
    await emailTransport.sendMail(message);
  } catch (err: any) {
    console.log(err);
    throw new ErrorWithStatus("email failed to send", 400);
  }
}

/** Gets the current season
 * @returns the number of the current season 0 is Summer, 1 is Autumn, etc.
 */
function getSeason(): number {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) {
    return 1;
  } else if (month >= 6 && month <= 8) {
    return 2;
  } else if (month >= 9 && month <= 11) {
    return 3;
  } else {
    return 0;
  }
}
