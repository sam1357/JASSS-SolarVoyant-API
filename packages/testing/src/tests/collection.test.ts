import request from "supertest";
import { API_ENDPOINT } from "../constants";
import { addMsg } from "jest-html-reporters/helper";

describe("GET /data-collection/suburbs", () => {
  test("It should respond with a list of suburbs", async () => {
    const response = await request(API_ENDPOINT)
      .get("/data-collection/suburbs")
      .query({ testPath: "suburbsData/sydney_suburbs_test.json" })
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(200);
    expect(response.body.length).toEqual(680);
    // check all properties are present
    ["suburb", "longitude", "latitude"].forEach((k) => expect(response.body[0]).toHaveProperty(k));

    await addMsg({
      message: response.body,
    });
  });
});

describe("GET /data-collection/weather", () => {
  test("It should respond with weather data for one suburb", async () => {
    // sleep for 2 seconds to prevent rate limiting
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const response = await request(API_ENDPOINT)
      .get("/data-collection/weather")
      .query({
        testPath: "SE3011-24-F14A-03/suburbsData/sydney_suburbs_test.json",
        s3Key: "SE3011-24-F14A-03/rawData.test1.json",
      })
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(200);
  });

  test("It should respond with 404 with invalid test json", async () => {
    const response = await request(API_ENDPOINT)
      .get("/data-collection/weather")
      .query({
        testPath: "suburbsData/invalid.json",
        s3Key: "SE3011-24-F14A-03/rawData.test2.json",
      }) // subset of data only
      .set("Accept", "application/json");

    // check correct status code
    expect(response.statusCode).toBe(404);
    // check error is returned
    expect(response.body.message).toEqual("The specified key does not exist.");
  });
});
