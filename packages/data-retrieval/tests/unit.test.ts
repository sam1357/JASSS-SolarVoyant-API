import {
  validateInputs,
  filterData,
  getAllSuburbsForHeatmap,
  getHeatmapDataFromCache,
  addDays,
  containsData,
  handleCoefficientCalculation,
  getCoefficient,
} from "../src/utils";
import { ErrorWithStatus } from "../src/types/errorWithStatus";
import {
  allDateAllAttribute,
  oneDateAllAttribute,
  twoDateTwoAttribute,
  allDateOneAttribute,
  dummyInput,
} from "./resources/unitTestObjects";
import { JSONData } from "../src/types/dataInterface";
import { dateToStr, addNDaysToDay } from "./resources/testUtils";
import { capitalise, readSuburbs } from "../src/s3";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import { Uint8ArrayBlobAdapter } from "@smithy/util-stream";
import { handleWmoRetrieve, validateEnergyEndpoint } from "../src/endpoints";
import { HISTORY_CUTOFF_DATE } from "../src/constants";
import { APIGatewayEvent } from "aws-lambda";

const mockS3Client = mockClient(S3Client);

beforeAll(() => {
  updateDatesOfTestInputs();
});

describe("Test ValidateEnergyEndpoint", () => {
  it("Test no query string", () => {
    const event: APIGatewayEvent = {} as any;
    event.httpMethod = "GET";
    event.path = "/data-retrieval/retrieve-energy-data";
    expect(() => {validateEnergyEndpoint(event)}).toThrow(new ErrorWithStatus("Required param 'userID' is missing.", 400))
  });

  it("Test no param provided", () => {
    const event: APIGatewayEvent = {} as any;
    event.httpMethod = "GET";
    event.path = "/data-retrieval/retrieve-energy-data";
    event.queryStringParameters = {
      "A": "B"
    };
    expect(() => {validateEnergyEndpoint(event)}).toThrow(new ErrorWithStatus("Required param 'userID' is missing.", 400))
  });

  it("Test working", () => {
    const event: APIGatewayEvent = {} as any;
    event.httpMethod = "GET";
    event.path = "/data-retrieval/retrieve-energy-data";
    event.queryStringParameters = {
      "userID": "B"
    }
    expect(() => {validateEnergyEndpoint(event)}).not.toThrow();
  });
});

describe("Test Get Coefficient", () => {
  it("Returns default case", () => {
    expect(getCoefficient({})).toBe(1);
  });
});

describe("Test ContainsData", () => {
  it("Test doesn't contain #1", () => {
    expect(containsData({})).toBe(false);
  });

  it("Test doesn't contain #2", () => {
    expect(containsData({
      q1_w: "1",
      q2_w: "1",
      q3_w: "1",
    })).toBe(false);
  });

  it("Test contains #1", () => {
    expect(containsData({
      q1_w: "A",
      q1_t: "A",
      q1_d: "A",
      q2_w: "A",
      q2_t: "A",
      q2_d: "A",
      q3_w: "A",
      q3_t: "A",
      q3_d: "A",
      q4_w: "A",
      q4_t: "A",
      q4_d: "A"
    })).toBe(true);
  });

});

describe("Test HandleCoefficientCalculator", () => {
  it("Empty case", async () => {
    expect(await handleCoefficientCalculation({})).toStrictEqual(["1", "1"]);
  });

  it("Test doesn't contain #2", async () => {
    expect(await handleCoefficientCalculation({
        q1_w: "1",
        q1_t: "2",
        q1_d: "3",
        q2_w: "4",
        q2_t: "5",
        q2_d: "6",
        q3_w: "7",
        q3_t: "8",
        q3_d: "9",
        q4_w: "10",
        q4_t: "11",
        q4_d: "12"
    })).toStrictEqual([1.9999999999999982, -0.9999999999999987]);
  });

});

describe("Test Test Utils Functions", () => {
  it("Test capitalise", () => {
    expect(capitalise("PANANIA")).toBe("Panania");
    expect(capitalise("Bass HILL")).toBe("Bass Hill");
  });
});

describe("Test retrieve WMO function", () => {
  it("fail case", async () => {
    mockS3Client.on(GetObjectCommand).rejects(new ErrorWithStatus("Bad", 500));
    try {
      await handleWmoRetrieve();
    } catch (err: any) {
      expect(err.statuscode).toBe(500);
      expect(err.message).toEqual("Bad");
    }
  });
});

describe("Test Input Validation Function", () => {
  // Tests with Valid Inputs
  it("Valid: Forecast retrieval, All Inputs are Valid, with one weather Condition", () => {
    expect(() => {
      validateInputs(
        "Kensington",
        dateToStr(addNDaysToDay(0)),
        dateToStr(addNDaysToDay(1)),
        "temperature_2m",
        "forecast"
      );
    }).not.toThrow();
  });

  it("Valid: Forecast retrieval, All Inputs are Valid, with weather conditions empty", () => {
    expect(() => {
      validateInputs(
        "Kensington",
        dateToStr(addNDaysToDay(0)),
        dateToStr(addNDaysToDay(1)),
        "",
        "forecast"
      );
    }).not.toThrow();
  });

  it("Valid: Forecast retrieval, All Inputs are Valid, multiple weather conditions", () => {
    expect(() => {
      validateInputs(
        "Kensington",
        dateToStr(addNDaysToDay(0)),
        dateToStr(addNDaysToDay(1)),
        "temperature_2m, cloud_cover",
        "forecast"
      );
    }).not.toThrow();
  });

  it("Valid: Forecast retrieval, All Inputs Valid, with start and end date as same date", () => {
    expect(() => {
      validateInputs(
        "Kensington",
        dateToStr(addNDaysToDay(0)),
        dateToStr(addNDaysToDay(0)),
        "temperature_2m",
        "forecast"
      );
    }).not.toThrow();
  });

  it("Valid: History retrieval, All Inputs are Valid, with one weather Condition", () => {
    expect(() => {
      validateInputs(
        "Kensington",
        dateToStr(addNDaysToDay(-1)),
        dateToStr(addNDaysToDay(-1)),
        "temperature_2m",
        "history"
      );
    }).not.toThrow();
  });

  it("Valid: History retrieval, All Inputs are Valid, with weather conditions empty", () => {
    expect(() => {
      validateInputs(
        "Kensington",
        dateToStr(addNDaysToDay(-1)),
        dateToStr(addNDaysToDay(-1)),
        "",
        "history"
      );
    }).not.toThrow();
  });

  it("Valid: History retrieval, All Inputs are Valid, multiple weather conditions", () => {
    expect(() => {
      validateInputs(
        "Kensington",
        dateToStr(addNDaysToDay(-1)),
        dateToStr(addNDaysToDay(-1)),
        "temperature_2m, cloud_cover",
        "history"
      );
    }).not.toThrow();
  });

  it("Valid: History retrieval, All Inputs Valid, with start and end date as the same date", () => {
    expect(() => {
      validateInputs(
        "Kensington",
        dateToStr(addNDaysToDay(-5)),
        dateToStr(addNDaysToDay(-5)),
        "temperature_2m",
        "history"
      );
    }).not.toThrow();
  });

  // Tests with Invalid Inputs
  //// Date validation
  it("Invalid: Bad startDate Format", () => {
    expect(() => {
      validateInputs(
        "Kensington",
        "asdf",
        dateToStr(addNDaysToDay(0)),
        "temperature_2m",
        "history"
      );
    }).toThrow(new ErrorWithStatus("Start Date has an invalid format", 400));
    expect(() => {
      validateInputs(
        "Kensington",
        "asdf",
        dateToStr(addNDaysToDay(0)),
        "temperature_2m",
        "forecast"
      );
    }).toThrow(new ErrorWithStatus("Start Date has an invalid format", 400));
  });

  it("Invalid: Bad endDate Format", () => {
    expect(() => {
      validateInputs(
        "Kensington",
        dateToStr(addNDaysToDay(-1)),
        "asdf",
        "temperature_2m",
        "history"
      );
    }).toThrow(new ErrorWithStatus("End Date has an invalid format", 400));
    expect(() => {
      validateInputs(
        "Kensington",
        "asdf",
        dateToStr(addNDaysToDay(0)),
        "temperature_2m",
        "forecast"
      );
    }).toThrow(new ErrorWithStatus("Start Date has an invalid format", 400));
  });

  it("Invalid: startDate is a non-existent date", () => {
    expect(() => {
      validateInputs(
        "Kensington",
        "2024-03-33",
        dateToStr(addNDaysToDay(0)),
        "temperature_2m",
        "forecast"
      );
    }).toThrow(new ErrorWithStatus("Start Date is not a date that exists", 400));
    expect(() => {
      validateInputs(
        "Kensington",
        "2024-03-33",
        dateToStr(addNDaysToDay(0)),
        "temperature_2m",
        "history"
      );
    }).toThrow(new ErrorWithStatus("Start Date is not a date that exists", 400));
  });

  it("Invalid: endDate is a non-existent date", () => {
    expect(() => {
      validateInputs(
        "Kensington",
        dateToStr(addNDaysToDay(0)),
        "2024-03-33",
        "temperature_2m",
        "forecast"
      );
    }).toThrow(new ErrorWithStatus("End Date is not a date that exists", 400));
    expect(() => {
      validateInputs(
        "Kensington",
        dateToStr(addNDaysToDay(-1)),
        "2024-03-33",
        "temperature_2m",
        "history"
      );
    }).toThrow(new ErrorWithStatus("End Date is not a date that exists", 400));
  });

  it("Invalid: Forecast retrieval, startDate is after endDate", () => {
    expect(() => {
      validateInputs(
        "Kensington",
        dateToStr(addNDaysToDay(1)),
        dateToStr(addNDaysToDay(0)),
        "temperature_2m",
        "forecast"
      );
    }).toThrow(new ErrorWithStatus("End Date is before Start Date", 400));
  });

  it("Invalid: Forecast retrieval, startDate is in the past", () => {
    expect(() => {
      validateInputs(
        "Kensington",
        dateToStr(addNDaysToDay(-1)),
        dateToStr(addNDaysToDay(0)),
        "temperature_2m",
        "forecast"
      );
    }).toThrow(new ErrorWithStatus("Start Date cannot be in the past", 400));
  });

  it("Invalid: Forecast retrieval, endDate is too far in future", () => {
    expect(() => {
      validateInputs(
        "Kensington",
        dateToStr(addNDaysToDay(0)),
        dateToStr(addNDaysToDay(8)),
        "temperature_2m",
        "forecast"
      );
    }).toThrow(new ErrorWithStatus("End Date is not within 7 days of the future", 400));
  });

  it("Invalid: Forecast retrieval, startDate and endDate are too far in future", () => {
    expect(() => {
      validateInputs(
        "Kensington",
        dateToStr(addNDaysToDay(10)),
        dateToStr(addNDaysToDay(11)),
        "temperature_2m",
        "forecast"
      );
    }).toThrow(new ErrorWithStatus("Start Date is not within 7 days of the future", 400));
  });

  it("Invalid: Forecast retrieval, startDate and endDate are in the past", () => {
    expect(() => {
      validateInputs(
        "Kensington",
        dateToStr(addNDaysToDay(-1)),
        dateToStr(addNDaysToDay(-1)),
        "temperature_2m",
        "forecast"
      );
    }).toThrow(new ErrorWithStatus("Start Date cannot be in the past", 400));
  });

  it("Invalid: Forecast retrieval, startDate is after endDate", () => {
    expect(() => {
      validateInputs(
        "Kensington",
        dateToStr(addNDaysToDay(-1)),
        dateToStr(addNDaysToDay(-2)),
        "temperature_2m",
        "history"
      );
    }).toThrow(new ErrorWithStatus("End Date is before Start Date", 400));
  });

  it("Invalid: History retrieval, startDate is too far in the past", () => {
    expect(() => {
      validateInputs(
        "Kensington",
        dateToStr(new Date("2024-02-24")),
        dateToStr(addNDaysToDay(1)),
        "temperature_2m",
        "history"
      );
    }).toThrow(
      new ErrorWithStatus(
        `Start Date is not after the historical cut off date of ${HISTORY_CUTOFF_DATE}`,
        400
      )
    );
  });

  it("Invalid: History retrieval, endDate is in the future", () => {
    expect(() => {
      validateInputs(
        "Kensington",
        dateToStr(addNDaysToDay(-1)),
        dateToStr(addNDaysToDay(1)),
        "temperature_2m",
        "history"
      );
    }).toThrow(new ErrorWithStatus("End Date cannot be in the future", 400));
  });

  it("Invalid: History retrieval, startDate and endDate are too far in the past", () => {
    expect(() => {
      validateInputs(
        "Kensington",
        dateToStr(new Date("2023-02-30")),
        dateToStr(new Date("2024-02-24")),
        "temperature_2m",
        "history"
      );
    }).toThrow(
      new ErrorWithStatus(
        `Start Date is not after the historical cut off date of ${HISTORY_CUTOFF_DATE}`,
        400
      )
    );
  });

  it("Invalid: History retrieval, startDate and endDate are in the future", () => {
    expect(() => {
      validateInputs(
        "Kensington",
        dateToStr(addNDaysToDay(2)),
        dateToStr(addNDaysToDay(3)),
        "temperature_2m",
        "history"
      );
    }).toThrow(new ErrorWithStatus("Start Date cannot be in the future", 400));
  });

  //// Weather Condition Validation
  it("Invalid: Forecast retrieval, Non-existent weather condition", () => {
    expect(() => {
      validateInputs(
        "Kensington",
        dateToStr(addNDaysToDay(0)),
        dateToStr(addNDaysToDay(1)),
        "asdf",
        "forecast"
      );
    }).toThrow(new ErrorWithStatus("'asdf' is not a valid weather condition", 400));
  });

  it("Invalid: Forecast retrieval, Non-existent weather conditions with valid condition", () => {
    expect(() => {
      validateInputs(
        "Kensington",
        dateToStr(addNDaysToDay(0)),
        dateToStr(addNDaysToDay(1)),
        "temperature_2m, qwert, asdf",
        "forecast"
      );
    }).toThrow(new ErrorWithStatus("'qwert' is not a valid weather condition", 400));
  });

  it("Invalid: History retrieval, Non-existent weather condition", () => {
    expect(() => {
      validateInputs(
        "Kensington",
        dateToStr(addNDaysToDay(-1)),
        dateToStr(addNDaysToDay(-1)),
        "asdf",
        "history"
      );
    }).toThrow(new ErrorWithStatus("'asdf' is not a valid weather condition", 400));
  });

  it("Invalid: History retrieval, Non-existent weather conditions with a valid condition", () => {
    expect(() => {
      validateInputs(
        "Kensington",
        dateToStr(addNDaysToDay(-1)),
        dateToStr(addNDaysToDay(-1)),
        "temperature_2m, qwert, asdf",
        "history"
      );
    }).toThrow(new ErrorWithStatus("'qwert' is not a valid weather condition", 400));
  });
});

describe("Test filterData Function", () => {
  // NOTE: filterData's behaviour is the same regardless of forecast/history retrieval.
  let inputData: JSONData;

  beforeEach(() => {
    inputData = JSON.parse(JSON.stringify(dummyInput));
  });

  it("Valid: Wide Date Range, no Weather Conditions Specified", () => {
    expect(
      filterData(inputData, dateToStr(addNDaysToDay(0)), dateToStr(addNDaysToDay(2)), [])
    ).toEqual(allDateAllAttribute);
  });

  it("Valid: Single Date, no Weather Conditions Specified", () => {
    expect(
      filterData(inputData, dateToStr(addNDaysToDay(0)), dateToStr(addNDaysToDay(0)), [])
    ).toEqual(oneDateAllAttribute);
  });

  it("Valid: Wide Date Range, One Weather Conditions Specified", () => {
    expect(
      filterData(inputData, dateToStr(addNDaysToDay(0)), dateToStr(addNDaysToDay(2)), [
        "temperature_2m",
      ])
    ).toEqual(allDateOneAttribute);
  });

  it("Valid: Narrower Date Range, Two Weather Conditions Specified", () => {
    expect(
      filterData(inputData, dateToStr(addNDaysToDay(1)), dateToStr(addNDaysToDay(2)), [
        "daylight_duration",
        "precipitation",
      ])
    ).toEqual(twoDateTwoAttribute);
  });
});

describe("Test readSuburbs Function", () => {
  beforeEach(() => {
    mockS3Client.reset();
  });

  it("Invalid: Invalid suburb", async () => {
    /* NOTE: This case is highly unlikely to occur, as the suburb parameter is always validated 
    by another function, before being passed in to readBucket */
    mockS3Client.on(GetObjectCommand).rejects(new Error("Bad"));
    expect(async () => await readSuburbs("nope", "forecast")).rejects.toThrow(
      new ErrorWithStatus(
        // eslint-disable-next-line
        "Unable to read from S3 bucket | key: SE3011-24-F14A-03/weatherData/forecast/Nope.json | error: Bad",
        400
      )
    );
  });

  it("Valid: All valid inputs provided", async () => {
    mockS3Client.on(GetObjectCommand).resolves({
      Body: Uint8ArrayBlobAdapter.fromString(JSON.stringify({ a: "Some content" })) as any,
    });
    expect(async () => await readSuburbs("kensington", "forecast")).resolves;
  });
});

describe("Test addDays Function", () => {
  it("Valid: Add 0 days", () => {
    const expectedDate: Date = new Date();
    expectedDate.setDate(expectedDate.getDate());
    expect(addDays(new Date(), 0)).toEqual(expectedDate);
  });

  it("Valid: Add 1 day", () => {
    const expectedDate: Date = new Date();
    expectedDate.setDate(expectedDate.getDate() + 1);
    expect(addDays(new Date(), 1)).toEqual(expectedDate);
  });

  it("Valid: Add 2 days", () => {
    const expectedDate: Date = new Date();
    expectedDate.setDate(expectedDate.getDate() + 2);
    expect(addDays(new Date(), 2)).toEqual(expectedDate);
  });

  it("Valid: Add 3 days", () => {
    const expectedDate: Date = new Date();
    expectedDate.setDate(expectedDate.getDate() + 3);
    expect(addDays(new Date(), 3)).toEqual(expectedDate);
  });
});

describe("Test getHeatmapData from cache error handling using mock", () => {
  it("Error case", async () => {
    mockS3Client.on(GetObjectCommand).rejects(new ErrorWithStatus("Bad", 500));
    try {
      await getHeatmapDataFromCache();
    } catch (err: any) {
      expect(err.statuscode).toBe(500);
      expect(err.message).toEqual("Bad");
    }
  });

  it("Valid: All valid inputs provided", async () => {
    mockS3Client.on(GetObjectCommand).resolves({
      Body: Uint8ArrayBlobAdapter.fromString(JSON.stringify({ a: "Some content" })) as any,
    });
    expect(async () => await getHeatmapDataFromCache()).resolves;
  });
});

describe("Test getAllSuburbsForHeatmap", () => {
  it("Valid: All valid inputs provided", async () => {
    mockS3Client.on(GetObjectCommand).resolves({
      Body: Uint8ArrayBlobAdapter.fromString(JSON.stringify({ a: "Some content" })) as any,
    });
    expect(async () => await getAllSuburbsForHeatmap()).resolves;
  });

  it("Error case", async () => {
    mockS3Client.on(GetObjectCommand).rejects(new Error("Bad"));
    try {
      await getAllSuburbsForHeatmap();
    } catch (err: any) {
      expect(err.message).toContain("Bad");
      expect(err.statusCode).toBe(500);
    }
  });
});

function updateDatesOfTestInputs() {
  const time1 = `${dateToStr(addNDaysToDay(0))}T07:52:02+11:00`;
  const time2 = `${dateToStr(addNDaysToDay(1))}T12:52:02+11:00`;
  const time3 = `${dateToStr(addNDaysToDay(2))}T22:52:02+11:00`;

  // Update dummyInput
  dummyInput.time_object.timestamp = time1;
  dummyInput.events[0].time_object.timestamp = time1;
  dummyInput.events[1].time_object.timestamp = time2;
  dummyInput.events[2].time_object.timestamp = time3;

  // allDateAllAttribute
  allDateAllAttribute.time_object.timestamp = time1;
  allDateAllAttribute.events[0].time_object.timestamp = time1;
  allDateAllAttribute.events[1].time_object.timestamp = time2;
  allDateAllAttribute.events[2].time_object.timestamp = time3;

  // oneDateAllAttribute
  oneDateAllAttribute.time_object.timestamp = time1;
  oneDateAllAttribute.events[0].time_object.timestamp = time1;

  // allDateOneAttribute
  allDateOneAttribute.time_object.timestamp = time1;
  allDateOneAttribute.events[0].time_object.timestamp = time1;
  allDateOneAttribute.events[1].time_object.timestamp = time2;
  allDateOneAttribute.events[2].time_object.timestamp = time3;

  //twoDateTwoAttribute
  twoDateTwoAttribute.time_object.timestamp = time1;
  twoDateTwoAttribute.events[0].time_object.timestamp = time2;
  twoDateTwoAttribute.events[1].time_object.timestamp = time3;
}
