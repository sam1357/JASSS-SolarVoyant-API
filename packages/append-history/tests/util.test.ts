import {
  getDateInTimezone,
  testJSON,
  filterTodayEvents,
  createNewEvent,
  mapValuesToKeys,
  summariseEvents,
} from "@src/utils";
import { parse } from "date-fns";
import { Event, AnalyticsResult, AnalyticsAttribute } from "@src/interfaces";
import * as fs from "fs";
import LambdaInvoker from "@src/lambdaInvoker";
import { SECONDS_IN_DAY, TO_MEGA } from "@src/constants";

describe("filterTodayEvents", () => {
  it("should filter events that happened today", () => {
    const events: Event[] = [
      {
        time_object: {
          timestamp: new Date().toISOString(),
          timezone: "Australia/Sydney",
          duration: 24,
          duration_unit: "hr",
        },
        event_type: "historical",
        attributes: {},
      },
      {
        time_object: {
          timestamp: new Date("2024-03-21").toISOString(),
          timezone: "Australia/Sydney",
          duration: 24,
          duration_unit: "hr",
        },
        event_type: "historical",
        attributes: {},
      },
    ];
    const filteredEvents = filterTodayEvents(events);
    expect(filteredEvents.length).toBe(1);
  });
});

describe("createNewEvent", () => {
  it("should create a new event from analytics data", () => {
    const time = new Date().toISOString();
    const mockAnalyticsResult: AnalyticsResult = {
      time_object: {
        start_timestamp: time,
        end_timestamp: time,
        timezone: "Australia/Sydney",
        units: "iso8601",
      },
      location: {
        suburb: "Kensington",
        latitude: 20,
        longitude: 20,
      },
      units: {
        temperature_2m: "C",
      },
      analytics: {
        temperature_2m: { mean: 20 },
        shortwave_radiation: { mean: 20 },
      },
    };
    expect(createNewEvent(mockAnalyticsResult)).toStrictEqual({
      time_object: {
        timestamp: time,
        timezone: "Australia/Sydney",
        duration: 24,
        duration_unit: "hr",
      },
      event_type: "historical",
      attributes: {
        location: {
          suburb: "Kensington",
          latitude: 20,
          longitude: 20,
        },
        units: {
          temperature_2m: "C",
          shortwave_radiation: "MJ/m²",
        },
        temperature_2m: 20,
        shortwave_radiation: (20 * SECONDS_IN_DAY) / TO_MEGA,
      },
    });
  });
});

describe("mapValuesToKeys", () => {
  it("should properly map analytics object to WeatherConditions", () => {
    const mockAnalytics: AnalyticsAttribute = {
      temperature_2m: { mean: 20 },
      humidity_2m: { mean: 20 },
    };
    expect(mapValuesToKeys(mockAnalytics)).toStrictEqual({ temperature_2m: 20, humidity_2m: 20 });
  });
});

describe("summariseEvents", () => {
  it("should return data from analytics", async () => {
    const data = JSON.parse(
      fs.readFileSync("./tests/resources/dummyInput.json", { encoding: "utf-8", flag: "r" })
    );

    const res = await summariseEvents(data, new LambdaInvoker());
    expect(res).toBeDefined();
  });
});

describe("testJSON function", () => {
  it("should return false if input is not a string", () => {
    expect(testJSON(123 as any)).toBe(false); // Passing a number
    expect(testJSON(true as any)).toBe(false); // Passing a boolean
  });

  test("should return true for valid JSON string", () => {
    // eslint-disable-next-line
    const validJSONString = `{"name": "John", "age": 30}`;
    expect(testJSON(validJSONString)).toBe(true);
  });

  test("should return false for invalid JSON string", () => {
    // eslint-disable-next-line
    const invalidJSONString = `{"name": "John", "age": 30`;
    expect(testJSON(invalidJSONString)).toBe(false);
  });

  test("should return false for empty string", () => {
    const emptyString = "";
    expect(testJSON(emptyString)).toBe(false);
  });
});

describe("getDateInTimezone", () => {
  it("should return a date in the correct format", () => {
    const dateInSydneyFormat = getDateInTimezone();
    const parsedDate = parse(dateInSydneyFormat, "yyyy-MM-dd", new Date());
    expect(parsedDate).toBeInstanceOf(Date);
    expect(dateInSydneyFormat).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
