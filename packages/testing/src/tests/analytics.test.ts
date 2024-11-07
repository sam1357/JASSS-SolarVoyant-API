import request from "supertest";
import { formatDate, getDate } from "../utils";
import { addMsg } from "jest-html-reporters/helper";
import { API_ENDPOINT } from "../constants";

describe("GET /data-analytics/analyse", () => {
  // testing common error points and ensure they handle correctly
  test("No input parameters provided, returns 400", async () => {
    const response = await request(API_ENDPOINT)
      .get("/data-analytics/analyse")
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual("Please provide either 'suburb' or 'address'.");
  });

  test("Provided suburb is not in Sydney, returns 400", async () => {
    const response = await request(API_ENDPOINT)
      .get("/data-analytics/analyse")
      .query({
        suburb: "Shinjuku",
        startDate: getDate(),
        endDate: getDate(),
      })
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual("Unrecognised suburb 'Shinjuku'");
  });

  test("Provided address is not in Sydney, returns 400", async () => {
    const response = await request(API_ENDPOINT)
      .get("/data-analytics/analyse")
      .query({
        address: "Shinjuku",
        startDate: getDate(),
        endDate: getDate(),
      })
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual("Unable to find address for Shinjuku");
  });

  test("Start date is in invalid format, returns 400", async () => {
    const response = await request(API_ENDPOINT)
      .get("/data-analytics/analyse")
      .query({
        suburb: "Kensington",
        startDate: "bad date",
        endDate: getDate(),
      })
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual("Start Date has an invalid format");
  });

  test("End date does not exist, returns 400", async () => {
    const response = await request(API_ENDPOINT)
      .get("/data-analytics/analyse")
      .query({
        suburb: "Kensington",
        startDate: getDate(),
        endDate: "9999-99-99",
      })
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual("End Date is not a date that exists");
  });

  test("End date is before start date, returns 400", async () => {
    const response = await request(API_ENDPOINT)
      .get("/data-analytics/analyse")
      .query({
        suburb: "Kensington",
        startDate: getDate(2),
        endDate: getDate(1),
      })
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual("End Date is before Start Date");
  });

  test("Dates are too far in future", async () => {
    const response = await request(API_ENDPOINT)
      .get("/data-analytics/analyse")
      .query({
        suburb: "Kensington",
        startDate: getDate(8),
        endDate: getDate(9),
      })
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual("Start Date is not within 7 days of the future");
  });

  test("Should provide all possible attributes with suburb", async () => {
    const response = await request(API_ENDPOINT)
      .get("/data-analytics/analyse")
      .query({
        suburb: "Kensington",
        startDate: getDate(),
        endDate: getDate(1),
      })
      .set("Accept", "application/json");

    const body = response.body;

    expect(response.statusCode).toBe(200);
    expect(body).toBeDefined();
    expect(body.location.suburb).toEqual("Kensington");
    // check start and end timestamps are correct
    expect(formatDate(body.time_object.start_timestamp)).toEqual(getDate());
    expect(formatDate(body.time_object.end_timestamp)).toEqual(getDate(1));
    // check all properties exist
    [
      "temperature_2m",
      "relative_humidity_2m",
      "precipitation",
      "precipitation_probability",
      "cloud_cover",
      "wind_speed_10m",
      "wind_direction_10m",
      "uv_index",
      "shortwave_radiation",
      "daylight_duration",
      "sunshine_duration",
    ].forEach((k) => expect(body.analytics).toHaveProperty(k));

    await addMsg({
      message: body,
    });
  });
});

describe("GET /data-analytics/analyse-selective", () => {
  // testing common error points and ensure they handle correctly
  test("No input parameters provided, returns 400", async () => {
    const response = await request(API_ENDPOINT)
      .post("/data-analytics/analyse-selective")
      .send({ query: { temperature_2m: "mean, mode", precipitation: "max" } })
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual("Please provide either 'suburb' or 'address'.");
  });

  test("Provided suburb is not in Sydney, returns 400", async () => {
    const response = await request(API_ENDPOINT)
      .post("/data-analytics/analyse-selective")
      .query({
        suburb: "Shinjuku",
        startDate: getDate(),
        endDate: getDate(1),
      })
      .send({ query: { temperature_2m: "mean, mode", precipitation: "max" } })
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual("Unrecognised suburb 'Shinjuku'");
  });

  test("Provided address is not in Sydney, returns 400", async () => {
    const response = await request(API_ENDPOINT)
      .post("/data-analytics/analyse-selective")
      .query({
        address: "Shinjuku",
        startDate: getDate(),
        endDate: getDate(),
      })
      .send({ query: { temperature_2m: "mean, mode", precipitation: "max" } })
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual("Unable to find address for Shinjuku");
  });

  test("Start date is in invalid format, returns 400", async () => {
    const response = await request(API_ENDPOINT)
      .post("/data-analytics/analyse-selective")
      .query({
        suburb: "Kensington",
        startDate: "bad date",
        endDate: getDate(),
      })
      .send({ query: { temperature_2m: "mean, mode", precipitation: "max" } })
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual("Start Date has an invalid format");
  });

  test("End date does not exist, returns 400", async () => {
    const response = await request(API_ENDPOINT)
      .post("/data-analytics/analyse-selective")
      .query({
        suburb: "Kensington",
        startDate: getDate(),
        endDate: "9999-99-99",
      })
      .send({ query: { temperature_2m: "mean, mode", precipitation: "max" } })
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual("End Date is not a date that exists");
  });

  test("End date is before start date, returns 400", async () => {
    const response = await request(API_ENDPOINT)
      .post("/data-analytics/analyse-selective")
      .query({
        suburb: "Kensington",
        startDate: getDate(2),
        endDate: getDate(1),
      })
      .send({ query: { temperature_2m: "mean, mode", precipitation: "max" } })
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual("End Date is before Start Date");
  });

  test("No body provided", async () => {
    const response = await request(API_ENDPOINT)
      .post("/data-analytics/analyse-selective")
      .query({
        suburb: "Kensington",
        startDate: getDate(),
        endDate: getDate(1),
      })
      .send({})
      .set("Accept", "application/json");

    const body = response.body;

    expect(response.statusCode).toBe(400);
    expect(body.message).toEqual("This route requires a query component in the body");
  });

  test("Should provide requested attributes and operations", async () => {
    const response = await request(API_ENDPOINT)
      .post("/data-analytics/analyse-selective")
      .query({
        suburb: "Kensington",
        startDate: getDate(),
        endDate: getDate(1),
      })
      .send({ query: { temperature_2m: "mean, mode", precipitation: "max" } })
      .set("Accept", "application/json");

    const body = response.body;

    expect(response.statusCode).toBe(200);
    expect(body).toBeDefined();
    expect(body.location.suburb).toEqual("Kensington");
    // check start and end timestamps are correct
    expect(formatDate(body.time_object.start_timestamp)).toEqual(getDate());
    expect(formatDate(body.time_object.end_timestamp)).toEqual(getDate(1));
    // check all properties exist
    ["temperature_2m", "precipitation"].forEach((k) => expect(body.analytics).toHaveProperty(k));
    ["mean", "mode"].forEach((k) => expect(body.analytics.temperature_2m).toHaveProperty(k));
    expect(body.analytics.precipitation).toHaveProperty("max");

    await addMsg({
      message: body,
    });
  });
});

describe("GET /data-analytics/analyse-history", () => {
  // testing common error points and ensure they handle correctly
  test("No input parameters provided, returns 400", async () => {
    const response = await request(API_ENDPOINT)
      .get("/data-analytics/analyse-history")
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual("Please provide either 'suburb' or 'address'.");
  });

  test("Provided suburb is not in Sydney, returns 400", async () => {
    const response = await request(API_ENDPOINT)
      .get("/data-analytics/analyse-history")
      .query({
        suburb: "Shinjuku",
        startDate: getDate(-2),
        endDate: getDate(-1),
      })
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual("Unrecognised suburb 'Shinjuku'");
  });

  test("Provided address is not in Sydney, returns 400", async () => {
    const response = await request(API_ENDPOINT)
      .get("/data-analytics/analyse-history")
      .query({
        address: "Shinjuku",
        startDate: getDate(-2),
        endDate: getDate(-1),
      })
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual("Unable to find address for Shinjuku");
  });

  test("Start date is in invalid format, returns 400", async () => {
    const response = await request(API_ENDPOINT)
      .get("/data-analytics/analyse-history")
      .query({
        suburb: "Kensington",
        startDate: "bad date",
        endDate: getDate(-2),
      })
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual("Start Date has an invalid format");
  });

  test("End date is before start date, returns 400", async () => {
    const response = await request(API_ENDPOINT)
      .get("/data-analytics/analyse-history")
      .query({
        suburb: "Kensington",
        startDate: getDate(-2),
        endDate: getDate(-3),
      })
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual("End Date is before Start Date");
  });

  test("Dates are too far in history, returns 400", async () => {
    const response = await request(API_ENDPOINT)
      .get("/data-analytics/analyse-history")
      .query({
        suburb: "Kensington",
        startDate: "2024-02-23",
        endDate: "2024-02-23",
      })
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain("Start Date is not after the historical cut off date");
  });

  test("Should provide all possible attributes with suburb", async () => {
    const response = await request(API_ENDPOINT)
      .get("/data-analytics/analyse-history")
      .query({
        suburb: "Kensington",
        startDate: getDate(-2),
        endDate: getDate(-1),
      })
      .set("Accept", "application/json");

    const body = response.body;

    expect(response.statusCode).toBe(200);
    expect(body).toBeDefined();
    expect(body.location.suburb).toEqual("Kensington");
    // check start and end timestamps are correct
    expect(formatDate(body.time_object.start_timestamp)).toEqual(getDate(-2));
    expect(formatDate(body.time_object.end_timestamp)).toEqual(getDate(-1));
    // check all properties exist
    [
      "temperature_2m",
      "relative_humidity_2m",
      "precipitation",
      "precipitation_probability",
      "cloud_cover",
      "wind_speed_10m",
      "wind_direction_10m",
      "uv_index",
      "shortwave_radiation",
      "daylight_duration",
      "sunshine_duration",
    ].forEach((k) => expect(body.analytics).toHaveProperty(k));

    await addMsg({
      message: body,
    });
  });
});

describe("GET /data-analytics/analyse-selective-history", () => {
  // testing common error points and ensure they handle correctly
  test("No input parameters provided, returns 400", async () => {
    const response = await request(API_ENDPOINT)
      .post("/data-analytics/analyse-selective-history")
      .send({ query: { temperature_2m: "mean, mode", precipitation: "max" } })
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual("Please provide either 'suburb' or 'address'.");
  });

  test("Provided suburb is not in Sydney, returns 400", async () => {
    const response = await request(API_ENDPOINT)
      .post("/data-analytics/analyse-selective-history")
      .query({
        suburb: "Shinjuku",
        startDate: getDate(-2),
        endDate: getDate(-1),
      })
      .send({ query: { temperature_2m: "mean, mode", precipitation: "max" } })
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual("Unrecognised suburb 'Shinjuku'");
  });

  test("Provided address is not in Sydney, returns 400", async () => {
    const response = await request(API_ENDPOINT)
      .post("/data-analytics/analyse-selective-history")
      .query({
        address: "Shinjuku",
        startDate: getDate(-2),
        endDate: getDate(-1),
      })
      .send({ query: { temperature_2m: "mean, mode", precipitation: "max" } })
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual("Unable to find address for Shinjuku");
  });

  test("Start date is in invalid format, returns 400", async () => {
    const response = await request(API_ENDPOINT)
      .post("/data-analytics/analyse-selective-history")
      .query({
        suburb: "Kensington",
        startDate: "bad date",
        endDate: getDate(-1),
      })
      .send({ query: { temperature_2m: "mean, mode", precipitation: "max" } })
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual("Start Date has an invalid format");
  });

  test("End date is before start date, returns 400", async () => {
    const response = await request(API_ENDPOINT)
      .post("/data-analytics/analyse-selective-history")
      .query({
        suburb: "Kensington",
        startDate: getDate(-1),
        endDate: getDate(-2),
      })
      .send({ query: { temperature_2m: "mean, mode", precipitation: "max" } })
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual("End Date is before Start Date");
  });

  test("No body provided", async () => {
    const response = await request(API_ENDPOINT)
      .post("/data-analytics/analyse-selective-history")
      .query({
        suburb: "Kensington",
        startDate: getDate(-2),
        endDate: getDate(-1),
      })
      .send({})
      .set("Accept", "application/json");

    const body = response.body;

    expect(response.statusCode).toBe(400);
    expect(body.message).toEqual("This route requires a query component in the body");
  });

  test("Should provide requested attributes and operations", async () => {
    const response = await request(API_ENDPOINT)
      .post("/data-analytics/analyse-selective-history")
      .query({
        suburb: "Kensington",
        startDate: getDate(-2),
        endDate: getDate(-1),
      })
      .send({ query: { temperature_2m: "mean, mode", precipitation: "max" } })
      .set("Accept", "application/json");

    const body = response.body;

    expect(response.statusCode).toBe(200);
    expect(body).toBeDefined();
    expect(body.location.suburb).toEqual("Kensington");
    // check start and end timestamps are correct
    expect(formatDate(body.time_object.start_timestamp)).toEqual(getDate(-2));
    expect(formatDate(body.time_object.end_timestamp)).toEqual(getDate(-1));
    // check all properties exist
    ["temperature_2m", "precipitation"].forEach((k) => expect(body.analytics).toHaveProperty(k));
    ["mean", "mode"].forEach((k) => expect(body.analytics.temperature_2m).toHaveProperty(k));
    expect(body.analytics.precipitation).toHaveProperty("max");

    await addMsg({
      message: body,
    });
  });
});
