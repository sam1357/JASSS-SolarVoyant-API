import { InvokeCommand, Lambda } from "@aws-sdk/client-lambda";
import { Uint8ArrayBlobAdapter } from "@smithy/util-stream";
import { ANALYTICS_DEFAULT_QUERY, ANALYTICS_LAMBDA_NAME, GROUP_NAME } from "@src/constants";
import LambdaInvoker from "@src/lambdaInvoker";
import { mockClient } from "aws-sdk-client-mock";
import * as fs from "fs";

describe("invokeLambda", () => {
  const mockLambda = mockClient(Lambda);
  beforeEach(() => {
    mockLambda.restore();
  });

  it("should fail with invalid function", async () => {
    const invoker = new LambdaInvoker();
    const payload = { key: "value" };
    const functionName = "testFunction";

    mockLambda.on(InvokeCommand).rejects(new Error("Function not found"));

    try {
      await invoker.invokeLambda(payload, functionName);
    } catch (err: any) {
      expect(err.message).toContain(
        "An error occurred when invoking lambda testFunction. Error: Function not found:"
      );
      expect(err.statusCode).toBe(500);
    }
  });

  it("should fail with invalid payload", async () => {
    const invoker = new LambdaInvoker();
    const payload = { key: "value" };
    const functionName = `${GROUP_NAME}_prod_${ANALYTICS_LAMBDA_NAME}`;

    mockLambda
      .on(InvokeCommand)
      .rejects(
        new Error(
          "An error occurred when invoking lambda SE3011-24-F14A-03_prod_jasss_analytics_lambda."
        )
      );

    try {
      await invoker.invokeLambda(payload, functionName);
    } catch (err: any) {
      expect(err.message).toContain(
        "An error occurred when invoking lambda SE3011-24-F14A-03_prod_jasss_analytics_lambda."
      );
      expect(err.statusCode).toBe(400);
    }
  });

  it("should invoke correctly with mocked data, expect it to return data", async () => {
    const invoker = new LambdaInvoker();
    const payload = {
      httpMethod: "POST",
      path: "/prod/data-analytics/summarise",
      body: {
        query: ANALYTICS_DEFAULT_QUERY,
        weather: JSON.parse(
          fs.readFileSync("./tests/resources/dummyInput.json", { encoding: "utf-8", flag: "r" })
        ),
      },
    };
    const functionName = `${GROUP_NAME}_prod_${ANALYTICS_LAMBDA_NAME}`;

    const payload2 = Uint8ArrayBlobAdapter.fromString(JSON.stringify({ data: "data" }));
    mockLambda.on(InvokeCommand).resolves({ Payload: payload2 });

    const res = await invoker.invokeLambda(payload, functionName);
    expect(res).toBeDefined();
    expect(res.analytics).toBeDefined();
  });
});
