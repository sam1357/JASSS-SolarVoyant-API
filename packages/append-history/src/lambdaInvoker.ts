import { LambdaClient, InvokeCommand, InvocationType } from "@aws-sdk/client-lambda";
import { GROUP_NAME, ANALYTICS_LAMBDA_NAME, DEFAULT_RETRIES } from "./constants";
import { ErrorWithStatus } from "./interfaces/errorWithStatus";
import { testJSON } from "./utils";

/**
 * Represents a class for invoking AWS Lambda functions with concurrency control.
 */
class LambdaInvoker {
  private lambda: LambdaClient;
  public static _DEFAULT_FUNCTION = `${GROUP_NAME}_prod_${ANALYTICS_LAMBDA_NAME}`;

  /**
   * Constructs a new LambdaInvoker instance.
   */
  constructor() {
    this.lambda = new LambdaClient({
      region: process.env.DEFAULT_REGION,
      maxAttempts: DEFAULT_RETRIES,
    });
  }

  /**
   * Invokes an AWS Lambda function with the provided payload.
   * @param payload The payload to send to the Lambda function.
   * @returns A Promise that resolves with the result of the Lambda invocation.
   */
  async invokeLambda(payload: any, functionName: string): Promise<any> {
    try {
      const params = {
        FunctionName: functionName,
        InvocationType: InvocationType.RequestResponse,
        Payload: JSON.stringify(payload),
      };

      const res = await this.lambda.send(new InvokeCommand(params));

      if (!res || Object.keys(res).length === 0) {
        throw new ErrorWithStatus("No return object received from lambda.", 500);
      }

      const summarisedRes = JSON.parse(res?.Payload?.transformToString() as string);

      if (!summarisedRes || summarisedRes.statusCode !== 200) {
        throw new ErrorWithStatus(
          testJSON(summarisedRes.body)
            ? JSON.parse(summarisedRes.body).message
            : "An unknown error occurred",
          summarisedRes?.statusCode || 500
        );
      }

      return JSON.parse(summarisedRes.body);
    } catch (err: any) {
      throw new ErrorWithStatus(
        `An error occurred when invoking lambda ${functionName}. Error: ${err.message}`,
        err.statusCode || 500
      );
    }
  }
}

export default LambdaInvoker;
