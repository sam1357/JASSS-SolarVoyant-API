import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { handler } from "../src";
import { addNDaysToDay, dateToStr } from "./resources/testUtils";
import { retrieveHistoricalRes } from "./resources/integrationTestObjects";
import { HISTORY_CUTOFF_DATE } from "../src/constants";
import { handleHeatmapRetrieve } from "../src/endpoints";

describe("Paths/Methods not provided", () => {
  it("test no path", async () => {
    const event: APIGatewayEvent = {} as any;
    event.httpMethod = "GET";
    const response: APIGatewayProxyResult = await handler(event);
    const returnObj: string = JSON.stringify({ message: "No path provided" });
    expect(response.body).toStrictEqual(returnObj);
    expect(response.statusCode).toBe(400);
  });

  it("test no method", async () => {
    const event: APIGatewayEvent = {} as any;
    event.path = "/data-retrieval/ping";
    const response: APIGatewayProxyResult = await handler(event);
    const returnObj: string = JSON.stringify({ message: "No httpMethod provided" });
    expect(response.body).toStrictEqual(returnObj);
    expect(response.statusCode).toBe(400);
  });

  it("unrecognised path/method combination #1", async () => {
    const event: APIGatewayEvent = {} as any;
    event.path = "/data-retrieval/ping";
    event.httpMethod = "POST";
    const response: APIGatewayProxyResult = await handler(event);
    const returnObj: string = JSON.stringify({
      message: "Unrecognised path and method combination",
    });
    expect(response.body).toStrictEqual(returnObj);
    expect(response.statusCode).toBe(400);
  });

  it("unrecognised path/method combination #2", async () => {
    const event: APIGatewayEvent = {} as any;
    event.path = "/data-retrieval/non-existent";
    event.httpMethod = "GET";
    const response: APIGatewayProxyResult = await handler(event);
    const returnObj: string = JSON.stringify({
      message: "Unrecognised path and method combination",
    });
    expect(response.body).toStrictEqual(returnObj);
    expect(response.statusCode).toBe(400);
  });
});

describe("Full integration test for retrieve energy data", () => {
  it("Test with no param provided", async () => {
    const event: APIGatewayEvent = {} as any;
    event.path = "/data-retrieval/retrieve-energy-data";
    event.httpMethod = "GET";
    const response: APIGatewayProxyResult = await handler(event);
    const returnObj: string = JSON.stringify({
      message: "Required param 'userID' is missing.",
    });
    expect(response.statusCode).toBe(400);
    expect(response.body).toStrictEqual(returnObj);
  });

  it("Test with invalid param provided", async () => {
    const event: APIGatewayEvent = {} as any;
    event.path = "/data-retrieval/retrieve-energy-data";
    event.httpMethod = "GET";
    event.queryStringParameters = {
      "A": "b",
    };
    const response: APIGatewayProxyResult = await handler(event);
    const returnObj: string = JSON.stringify({
      message: "Required param 'userID' is missing.",
    });
    expect(response.statusCode).toBe(400);
    expect(response.body).toStrictEqual(returnObj);
  });

  it("Test with real user-data", async () => {
    const event: APIGatewayEvent = {} as any;
    event.path = "/data-retrieval/retrieve-energy-data";
    event.httpMethod = "GET";
    event.queryStringParameters = {
      "userID": "f6cac409-d094-4fb8-a845-dd1321e9c476"
    }
    const response: APIGatewayProxyResult = await handler(event);
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain("energy_production_hourly")
    expect(response.body).toContain("energy_consumption_hourly");
  })

})

describe("Full integration test for PING", () => {
  it("test /ping", async () => {
    const event: APIGatewayEvent = {} as any;
    event.path = "/data-retrieval/ping";
    event.httpMethod = "GET";
    const response: APIGatewayProxyResult = await handler(event);
    const returnObj: string = JSON.stringify({ ping: "successful" });
    expect(response.body).toStrictEqual(returnObj);
    expect(response.statusCode).toBe(200);
  });
});

describe("Full integration test for retrieving WMO codes", () => {
  it("test /retrieve-wmo", async () => {
    const event: APIGatewayEvent = {} as any;
    event.path = "/data-retrieval/retrieve-wmo";
    event.httpMethod = "GET";
    const response: APIGatewayProxyResult = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();
  });
});

describe("/retrieve - Error Cases", () => {
  it("no params /retrieve", async () => {
    const event: APIGatewayEvent = {} as any;
    event.path = "/data-retrieval/retrieve";
    event.httpMethod = "GET";
    const response: APIGatewayProxyResult = await handler(event);
    const returnObj: string = JSON.stringify({
      message: "Required params ('suburb' or 'address'), 'startDate', and 'endDate' are missing.",
    });
    expect(response.body).toStrictEqual(returnObj);
    expect(response.statusCode).toBe(400);
  });

  it("some params /retrieve", async () => {
    const event: APIGatewayEvent = {} as any;
    event.path = "/data-retrieval/retrieve";
    event.httpMethod = "GET";
    event.queryStringParameters = {
      "endDate": "A",
    };

    const response: APIGatewayProxyResult = await handler(event);
    const returnObj: string = JSON.stringify({
      message: "Please provide either 'suburb' or 'address'.",
    });
    expect(response.body).toStrictEqual(returnObj);
    expect(response.statusCode).toBe(400);
  });

  it("missing one param /retrieve", async () => {
    const event: APIGatewayEvent = {} as any;
    event.path = "/data-retrieval/retrieve";
    event.httpMethod = "GET";
    event.queryStringParameters = {
      "endDate": "A",
      "suburb": "A",
    };

    const response: APIGatewayProxyResult = await handler(event);
    const returnObj: string = JSON.stringify({
      message: "Required param 'startDate' is missing.",
    });
    expect(response.body).toStrictEqual(returnObj);
    expect(response.statusCode).toBe(400);
  });

  it("invalid start date regex", async () => {
    const endDate: string = dateToStr(addNDaysToDay(0));
    const event: APIGatewayEvent = {} as any;
    event.path = "/data-retrieval/retrieve";
    event.httpMethod = "GET";
    event.queryStringParameters = {
      "endDate": endDate,
      "startDate": "B",
      "suburb": "Panania",
    };

    const response: APIGatewayProxyResult = await handler(event);
    const returnObj: string = JSON.stringify({ message: "Start Date has an invalid format" });
    expect(response.body).toStrictEqual(returnObj);
    expect(response.statusCode).toBe(400);
  });

  it("invalid end date regex", async () => {
    const startDate: string = dateToStr(addNDaysToDay(0));
    const event: APIGatewayEvent = {} as any;
    event.path = "/data-retrieval/retrieve";
    event.httpMethod = "GET";
    event.queryStringParameters = {
      "endDate": "B",
      "startDate": startDate,
      "suburb": "Panania",
    };

    const response: APIGatewayProxyResult = await handler(event);
    const returnObj: string = JSON.stringify({ message: "End Date has an invalid format" });
    expect(response.body).toStrictEqual(returnObj);
    expect(response.statusCode).toBe(400);
  });

  it("invalid suburb", async () => {
    const date: string = dateToStr(addNDaysToDay(0));
    const event: APIGatewayEvent = {} as any;
    event.path = "/data-retrieval/retrieve";
    event.httpMethod = "GET";
    event.queryStringParameters = {
      "endDate": date,
      "startDate": date,
      "suburb": "Doesn't exist",
    };
    const response: APIGatewayProxyResult = await handler(event);
    const returnObj: string = JSON.stringify({ message: "Unrecognised suburb 'Doesn't exist'" });
    expect(response.body).toStrictEqual(returnObj);
    expect(response.statusCode).toBe(400);
  });

  it("invalid date - before current date", async () => {
    const startDate: string = dateToStr(addNDaysToDay(-1));
    const endDate: string = dateToStr(addNDaysToDay(0));
    const event: APIGatewayEvent = {} as any;
    event.path = "/data-retrieval/retrieve";
    event.httpMethod = "GET";
    event.queryStringParameters = {
      "startDate": startDate,
      "endDate": endDate,
      "suburb": "Panania",
    };
    const response: APIGatewayProxyResult = await handler(event);
    const returnObj: string = JSON.stringify({ message: "Start Date cannot be in the past" });
    expect(response.body).toStrictEqual(returnObj);
    expect(response.statusCode).toBe(400);
  });

  it("invalid date - more than 7 days in the future", async () => {
    const startDate: string = dateToStr(addNDaysToDay(0));
    const endDate: string = dateToStr(addNDaysToDay(10));
    const event: APIGatewayEvent = {} as any;
    event.path = "/data-retrieval/retrieve";
    event.httpMethod = "GET";
    event.queryStringParameters = {
      "startDate": startDate,
      "endDate": endDate,
      "suburb": "Panania",
    };
    const response: APIGatewayProxyResult = await handler(event);
    const returnObj: string = JSON.stringify({
      message: "End Date is not within 7 days of the future",
    });
    expect(response.body).toStrictEqual(returnObj);
    expect(response.statusCode).toBe(400);
  });

  it("start date after end date", async () => {
    const startDate: string = dateToStr(addNDaysToDay(5));
    const endDate: string = dateToStr(addNDaysToDay(1));
    const event: APIGatewayEvent = {} as any;
    event.path = "/data-retrieval/retrieve";
    event.httpMethod = "GET";
    event.queryStringParameters = {
      "startDate": startDate,
      "endDate": endDate,
      "suburb": "Panania",
    };
    const response: APIGatewayProxyResult = await handler(event);
    const returnObj: string = JSON.stringify({ message: "End Date is before Start Date" });
    expect(response.body).toStrictEqual(returnObj);
    expect(response.statusCode).toBe(400);
  });

  it("invalid attributes", async () => {
    const startDate: string = dateToStr(addNDaysToDay(1));
    const endDate: string = dateToStr(addNDaysToDay(5));
    const event: APIGatewayEvent = {} as any;
    event.path = "/data-retrieval/retrieve";
    event.httpMethod = "GET";
    event.queryStringParameters = {
      "startDate": startDate,
      "endDate": endDate,
      "suburb": "Panania",
      "attributes": "X",
    };
    const response: APIGatewayProxyResult = await handler(event);
    const returnObj: string = JSON.stringify({ message: "'x' is not a valid weather condition" });
    expect(response.body).toStrictEqual(returnObj);
    expect(response.statusCode).toBe(400);
  });

  it("standard case #2 - address invalid", async () => {
    const startDate: string = dateToStr(addNDaysToDay(1));
    const endDate: string = dateToStr(addNDaysToDay(2));
    const event: APIGatewayEvent = {} as any;
    event.path = "/data-retrieval/retrieve";
    event.httpMethod = "GET";
    event.queryStringParameters = {
      "startDate": startDate,
      "endDate": endDate,
      "address": "405 E 45th St",
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(400);
  });
});

describe("/retrieve - Success Cases", () => {
  // Displaying no information about events because of the incorrect time
  it("standard case #1", async () => {
    const startDate: string = dateToStr(addNDaysToDay(1));
    const endDate: string = dateToStr(addNDaysToDay(2));
    const event: APIGatewayEvent = {} as any;
    event.path = "/data-retrieval/retrieve";
    event.httpMethod = "GET";
    event.queryStringParameters = {
      "startDate": startDate,
      "endDate": endDate,
      "suburb": "TEST",
    };

    const response = await handler(event);

    const returnObj = {
      data_source: "Weather API",
      dataset_type: "Weather/Climate data",
      dataset_id:
        "https://seng3011-student.s3.ap-southeast-2.amazonaws.com/SE3011-24-F11A-03/data.json",
      time_object: { timestamp: expect.any(String), timezone: "Australia/Sydney" },
      events: [],
    };
    expect(JSON.parse(response.body)).toStrictEqual(returnObj);
    expect(response.statusCode).toBe(200);
  });

  it("standard case #2 - address", async () => {
    const startDate: string = dateToStr(addNDaysToDay(1));
    const endDate: string = dateToStr(addNDaysToDay(2));
    const event: APIGatewayEvent = {} as any;
    event.path = "/data-retrieval/retrieve";
    event.httpMethod = "GET";
    event.queryStringParameters = {
      "startDate": startDate,
      "endDate": endDate,
      "address": "21 Hinemoa Street",
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    expect(JSON.stringify(response.body)).toContain("Panania");
  });
});

describe("/retrieve-history - Error Cases", () => {
  it("no params /retrieve-history", async () => {
    const event: APIGatewayEvent = {} as any;
    event.path = "/data-retrieval/retrieve-history";
    event.httpMethod = "GET";
    const response: APIGatewayProxyResult = await handler(event);
    const returnObj: string = JSON.stringify({
      message: "Required params ('suburb' or 'address'), 'startDate', and 'endDate' are missing.",
    });
    expect(response.body).toStrictEqual(returnObj);
    expect(response.statusCode).toBe(400);
  });

  it("some params /retrieve-history", async () => {
    const event: APIGatewayEvent = {} as any;
    event.path = "/data-retrieval/retrieve-history";
    event.httpMethod = "GET";
    event.queryStringParameters = {
      "endDate": "A",
    };

    const response: APIGatewayProxyResult = await handler(event);
    const returnObj: string = JSON.stringify({
      message: "Please provide either 'suburb' or 'address'.",
    });
    expect(response.body).toStrictEqual(returnObj);
    expect(response.statusCode).toBe(400);
  });

  it("both suburb and address provided /retrieve-history", async () => {
    const event: APIGatewayEvent = {} as any;
    event.path = "/data-retrieval/retrieve-history";
    event.httpMethod = "GET";
    event.queryStringParameters = { "address": "hi", "suburb": "bye" };
    const response: APIGatewayProxyResult = await handler(event);
    const returnObj: string = JSON.stringify({
      message: "Please provide either 'suburb' or 'address' only.",
    });
    expect(response.body).toStrictEqual(returnObj);
    expect(response.statusCode).toBe(400);
  });

  it("invalid suburb", async () => {
    const date: string = dateToStr(addNDaysToDay(0));
    const event: APIGatewayEvent = {} as any;
    event.path = "/data-retrieval/retrieve-history";
    event.httpMethod = "GET";
    event.queryStringParameters = {
      "endDate": date,
      "startDate": date,
      "suburb": "Doesn't exist",
    };
    const response: APIGatewayProxyResult = await handler(event);
    const returnObj: string = JSON.stringify({ message: "Unrecognised suburb 'Doesn't exist'" });
    expect(response.body).toStrictEqual(returnObj);
    expect(response.statusCode).toBe(400);
  });

  it("invalid date - startDate is too far in the past", async () => {
    const startDate: string = dateToStr(new Date("2023-02-25"));
    const endDate: string = dateToStr(addNDaysToDay(0));
    const event: APIGatewayEvent = {} as any;
    event.path = "/data-retrieval/retrieve-history";
    event.httpMethod = "GET";
    event.queryStringParameters = {
      "startDate": startDate,
      "endDate": endDate,
      "suburb": "Panania",
    };
    const response: APIGatewayProxyResult = await handler(event);
    const returnObj: string = JSON.stringify({
      message: `Start Date is not after the historical cut off date of ${HISTORY_CUTOFF_DATE}`,
    });
    expect(response.body).toStrictEqual(returnObj);
    expect(response.statusCode).toBe(400);
  });

  it("invalid date - endDate is in the future", async () => {
    const startDate: string = dateToStr(addNDaysToDay(-1));
    const endDate: string = dateToStr(addNDaysToDay(1));
    const event: APIGatewayEvent = {} as any;
    event.path = "/data-retrieval/retrieve-history";
    event.httpMethod = "GET";
    event.queryStringParameters = {
      "startDate": startDate,
      "endDate": endDate,
      "suburb": "Panania",
    };
    const response: APIGatewayProxyResult = await handler(event);
    const returnObj: string = JSON.stringify({ message: "End Date cannot be in the future" });
    expect(response.body).toStrictEqual(returnObj);
    expect(response.statusCode).toBe(400);
  });

  it("invalid attribute", async () => {
    const startDate: string = dateToStr(addNDaysToDay(-2));
    const endDate: string = dateToStr(addNDaysToDay(-1));
    const event: APIGatewayEvent = {} as any;
    event.path = "/data-retrieval/retrieve-history";
    event.httpMethod = "GET";
    event.queryStringParameters = {
      "startDate": startDate,
      "endDate": endDate,
      "suburb": "Panania",
      "attributes": "x",
    };
    const response: APIGatewayProxyResult = await handler(event);
    const returnObj: string = JSON.stringify({
      message: "'x' is not a valid weather condition",
    });
    expect(response.body).toStrictEqual(returnObj);
    expect(response.statusCode).toBe(400);
  });

  it("standard case #2 - address invalid", async () => {
    const startDate: string = dateToStr(addNDaysToDay(1));
    const endDate: string = dateToStr(addNDaysToDay(2));
    const event: APIGatewayEvent = {} as any;
    event.path = "/data-retrieval/retrieve-history";
    event.httpMethod = "GET";
    event.queryStringParameters = {
      "startDate": startDate,
      "endDate": endDate,
      "address": "405 E 45th St",
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(400);
  });
});

describe("/retrieve-history - Success Cases", () => {
  // Displaying no information about events because of the incorrect time
  it("standard case #1", async () => {
    const startDate: string = dateToStr(new Date(HISTORY_CUTOFF_DATE));
    const endDate: string = dateToStr(addNDaysToDay(1, new Date(HISTORY_CUTOFF_DATE)));
    const event: APIGatewayEvent = {} as any;
    event.path = "/data-retrieval/retrieve-history";
    event.httpMethod = "GET";
    event.queryStringParameters = {
      "startDate": startDate,
      "endDate": endDate,
      "suburb": "prestons",
      "attributes": "temperature_2m, relative_humidity_2m",
    };

    const response = await handler(event);

    expect(JSON.parse(response.body)).toStrictEqual(retrieveHistoricalRes);
    expect(response.statusCode).toBe(200);
  });

  it("standard case #2 - address", async () => {
    const startDate: string = dateToStr(addNDaysToDay(-1));
    const endDate: string = dateToStr(addNDaysToDay(-1));
    const event: APIGatewayEvent = {} as any;
    event.path = "/data-retrieval/retrieve-history";
    event.httpMethod = "GET";
    event.queryStringParameters = {
      "startDate": startDate,
      "endDate": endDate,
      "address": "21 Hinemoa Street",
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    expect(JSON.stringify(response.body)).toContain("Panania");
  });
});

describe("Full integration test for /retrieve-heatmap", () => {
  it(
    "test /retrieve-heatmap",
    async () => {
      const event: APIGatewayEvent = {} as any;
      event.path = "/data-retrieval/retrieve-heatmap";
      event.httpMethod = "GET";

      const response: APIGatewayProxyResult = await handleHeatmapRetrieve();
      expect(response.statusCode).toBe(200);
      expect(response.body).toBeDefined();
    },
    20 * 1000
  );
});
