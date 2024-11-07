import request from "supertest";
import { API_ENDPOINT } from "../constants";
import { formatDate, getDate } from "../utils";
import { differenceInHours } from "date-fns";
import { addMsg } from "jest-html-reporters/helper";

describe("GET /data-retrieval/retrieve", () => {
  // testing common error points and ensure they handle correctly
  test("No input parameters provided, returns 400", async () => {
    const response = await request(API_ENDPOINT)
      .get("/data-retrieval/retrieve")
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual(
      "Required params ('suburb' or 'address'), 'startDate', and 'endDate' are missing."
    );
  });

  test("Provided suburb is not in Sydney, returns 400", async () => {
    const response = await request(API_ENDPOINT)
      .get("/data-retrieval/retrieve")
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
      .get("/data-retrieval/retrieve")
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
      .get("/data-retrieval/retrieve")
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
      .get("/data-retrieval/retrieve")
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
      .get("/data-retrieval/retrieve")
      .query({
        suburb: "Kensington",
        startDate: getDate(1),
        endDate: getDate(),
      })
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual("End Date is before Start Date");
  });

  test("Dates are in history, returns 400", async () => {
    const response = await request(API_ENDPOINT)
      .get("/data-retrieval/retrieve")
      .query({
        suburb: "Kensington",
        startDate: getDate(-1),
        endDate: getDate(-2),
      })
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual("Start Date cannot be in the past");
  });

  test("Dates are too far in future", async () => {
    const response = await request(API_ENDPOINT)
      .get("/data-retrieval/retrieve")
      .query({
        suburb: "Kensington",
        startDate: getDate(8),
        endDate: getDate(9),
      })
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual("Start Date is not within 7 days of the future");
  });

  test("Invalid weather attribute provided", async () => {
    const response = await request(API_ENDPOINT)
      .get("/data-retrieval/retrieve")
      .query({
        suburb: "Kensington",
        startDate: getDate(),
        endDate: getDate(),
        attributes: "hi",
      })
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual("'hi' is not a valid weather condition");
  });

  test("No attributes should provide all possible attributes with suburb", async () => {
    const response = await request(API_ENDPOINT)
      .get("/data-retrieval/retrieve")
      .query({
        suburb: "Kensington",
        startDate: getDate(),
        endDate: getDate(),
      })
      .set("Accept", "application/json");

    const body = response.body;
    const event = body.events[0];

    expect(response.statusCode).toBe(200);
    expect(body).toBeDefined();
    // 24 hourly events + 1 daily, -1 on DST changes
    expect([24, 25]).toContain(body.events.length);
    // check that fetched date is requested date
    expect(formatDate(event.time_object.timestamp)).toEqual(getDate());
    expect(event.attributes.location.suburb).toEqual("Kensington");
    expect(event.event_type).toEqual("hourly");
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
    ].forEach((k) => expect(event.attributes).toHaveProperty(k));

    await addMsg({
      message: body,
    });
    await addMsg({
      message:
        "This test also checks data-preprocessing by checking the timestamp and ensuring that the\
data was refreshed in the last 4 hours.",
    });

    // this will by extension test preprocessing, as we are checking that a refresh of the data was
    // performed in the last 4 hours
    expect(differenceInHours(new Date(body.time_object.timestamp), new Date())).toBeLessThanOrEqual(
      4
    );
  });

  test("If provided attributes, should return requested attributes with address", async () => {
    const response = await request(API_ENDPOINT)
      .get("/data-retrieval/retrieve")
      .query({
        address: "17 High Street, Randwick",
        startDate: getDate(),
        endDate: getDate(),
        attributes: ["temperature_2m"],
      })
      .set("Accept", "application/json");

    const body = response.body;
    const event = body.events[0];

    expect(response.statusCode).toBe(200);
    expect(body).toBeDefined();
    expect(event.event_type).toEqual("hourly");
    expect(event.attributes.location.suburb).toEqual("Randwick");
    // check all requested properties exist
    expect(event.attributes).toHaveProperty("temperature_2m");
    await addMsg({
      message: response.body,
    });
  });
});

describe("GET /data-retrieval/retrieve-wmo", () => {
  test("Returns data successfully", async () => {
    const response = await request(API_ENDPOINT)
      .get("/data-retrieval/retrieve-wmo")
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();

    await addMsg({
      message: response.body,
    });
  });
});

describe("GET /data-retrieval/retrieve-history", () => {
  // testing common error points and ensure they handle correctly
  test("No input parameters provided, returns 400", async () => {
    const response = await request(API_ENDPOINT)
      .get("/data-retrieval/retrieve-history")
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual(
      "Required params ('suburb' or 'address'), 'startDate', and 'endDate' are missing."
    );
  });

  test("Provided suburb is not in Sydney, returns 400", async () => {
    const response = await request(API_ENDPOINT)
      .get("/data-retrieval/retrieve-history")
      .query({
        suburb: "Shinjuku",
        startDate: getDate(-1),
        endDate: getDate(-1),
      })
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual("Unrecognised suburb 'Shinjuku'");
  });

  test("End date is in the future, return 400", async () => {
    const response = await request(API_ENDPOINT)
      .get("/data-retrieval/retrieve-history")
      .query({
        suburb: "Kensington",
        startDate: getDate(-1),
        endDate: getDate(1),
      })
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual("End Date cannot be in the future");
  });

  test("Start date is before cutoff day", async () => {
    const response = await request(API_ENDPOINT)
      .get("/data-retrieval/retrieve-history")
      .query({
        suburb: "Kensington",
        startDate: "2024-02-24",
        endDate: getDate(-1),
      })
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain("Start Date is not after the historical cut off date");
  });

  test("Invalid weather attribute provided", async () => {
    const response = await request(API_ENDPOINT)
      .get("/data-retrieval/retrieve-history")
      .query({
        suburb: "Kensington",
        startDate: getDate(-1),
        endDate: getDate(-1),
        attributes: "hi",
      })
      .set("Accept", "application/json");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual("'hi' is not a valid weather condition");
  });

  test("No attributes should provide all possible attributes with address", async () => {
    const response = await request(API_ENDPOINT)
      .get("/data-retrieval/retrieve-history")
      .query({
        address: "17 High Street, Randwick",
        startDate: getDate(-1),
        endDate: getDate(-1),
      })
      .set("Accept", "application/json");

    const body = response.body;
    const event = body.events[0];

    expect(response.statusCode).toBe(200);
    expect(body).toBeDefined();
    // 1 event for 1 day
    expect(body.events.length).toBe(1);
    // check that fetched date is requested date
    expect(formatDate(event.time_object.timestamp)).toEqual(getDate(-1));
    expect(event.attributes.location.suburb).toEqual("Randwick");
    expect(event.event_type).toEqual("historical");
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
      "sunshine_duration",
      "daylight_duration",
    ].forEach((k) => expect(event.attributes).toHaveProperty(k));

    await addMsg({
      message: body,
    });
  });

  test("If provided attributes, should return requested attributes with suburb", async () => {
    const response = await request(API_ENDPOINT)
      .get("/data-retrieval/retrieve-history")
      .query({
        suburb: "Kensington",
        startDate: getDate(-2),
        endDate: getDate(-2),
        attributes: ["temperature_2m"],
      })
      .set("Accept", "application/json");

    const body = response.body;
    const event = body.events[0];

    expect(response.statusCode).toBe(200);
    expect(body).toBeDefined();
    expect(event.event_type).toEqual("historical");
    expect(event.attributes.location.suburb).toEqual("Kensington");
    // check all requested properties exist
    expect(event.attributes).toHaveProperty("temperature_2m");

    await addMsg({
      message: body,
    });
  });
});
