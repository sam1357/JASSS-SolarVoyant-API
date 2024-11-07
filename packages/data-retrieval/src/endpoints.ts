import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { headers } from ".";
import { JSONData } from "./types/dataInterface";
import { ErrorWithStatus } from "./types/errorWithStatus";
import { handleParameterReturn } from "./types/handleParameterReturn";
import { capitalise, readBucket, readSuburbs, writeBucket } from "./s3";
import {
  filterData,
  getAllSuburbsForHeatmap,
  getCoefficient,
  getHeatmapDataFromCache,
  getSuburb,
  getUser,
  handleCoefficientCalculation,
  validateInputs,
} from "./utils";
import {
  CALCULATION_OFFSET,
  DEFAULT_TTL,
  GROUP_NAME,
  ROOT_FOLDER,
  SHORTWAVE_RATIO,
  logger,
} from "./constants";

export async function handlePing(): Promise<APIGatewayProxyResult> {
  return {
    headers,
    statusCode: 200,
    body: JSON.stringify({ ping: "successful" }),
  };
}

export async function handleEnergyDataRetrieve(
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  try {
    validateEnergyEndpoint(event);

    const userID = (event.queryStringParameters?.userID ?? "") as string;
    const userData = await getUser(userID);

    let tempCoefficient;
    let daylightCoefficient;
    if (
      !userData.temp_coefficient ||
      !userData.daylight_coefficient ||
      (userData.temp_coefficient && userData.temp_coefficient === "0") ||
      (userData.daylight_coefficient && userData.daylight_coefficient === "0")
    ) {
      const calculateResult = await handleCoefficientCalculation(userData);
      tempCoefficient = parseFloat(calculateResult[0]);
      daylightCoefficient = parseFloat(calculateResult[1]);
    } else {
      tempCoefficient = parseFloat(userData.temp_coefficient);
      daylightCoefficient = parseFloat(userData.daylight_coefficient);
    }

    tempCoefficient = Math.abs(tempCoefficient);

    const key: string = `weatherData/forecast/${capitalise(userData.suburb)}.json`;
    const data = JSON.parse(await readBucket(`${ROOT_FOLDER}${key}`));

    const production_coefficient = getCoefficient(userData);

    const energy_production_hourly: number[] = [];
    let energy_consumption_hourly: number[] = [];
    let surfaceArea = 100;
    if (userData.surface_area) {
      surfaceArea = parseFloat(userData.surface_area);
    }

    let temperature = 1,
      radiation = 1,
      daylightDuration = 1;

    for (const entry of data.events) {
      if (entry.attributes.daylight_duration !== undefined) {
        daylightDuration = parseFloat(entry.attributes.daylight_duration);
      }
      if (entry.attributes.temperature_2m !== undefined) {
        temperature = parseFloat(entry.attributes.temperature_2m);
      }
      if (entry.attributes.shortwave_radiation !== undefined) {
        radiation = parseFloat(entry.attributes.shortwave_radiation) / 8;
        // radiation *= SHORTWAVE_RATIO;
      }
      let energyGeneration;
      if (temperature > 25) {
        energyGeneration = surfaceArea * radiation * (1 - 0.004 * (temperature - 25));
      } else {
        energyGeneration = surfaceArea * radiation;
      }
      energyGeneration *= production_coefficient;
      energy_production_hourly.push(energyGeneration);

      const energyConsumption = tempCoefficient * Math.abs(temperature - 23.6);
      energy_consumption_hourly.push(energyConsumption);
    }

    let offset = 0;
    if (userData.quarterly_energy_consumption === undefined) {
      offset = CALCULATION_OFFSET;
    } else {
      const consumptionArray = userData.quarterly_energy_consumption.split(",");
      for (const entry of consumptionArray) {
        offset += parseFloat(entry.trim());
      }
      offset /= 4;
    }

    const ratio = daylightCoefficient * (daylightDuration / 24);
    energy_consumption_hourly = energy_consumption_hourly.map(
      (element) => element + ratio + offset
    );

    return {
      headers,
      statusCode: 200,
      body: JSON.stringify({
        "energy_production_hourly": energy_production_hourly.slice(0, 168),
        "energy_consumption_hourly": energy_consumption_hourly.slice(0, 168),
      }),
    };
  } catch (err: any) {
    logger.error("Retrieve energy data endpoint: an error has occurred: ", err);
    return {
      headers,
      statusCode: err.statusCode,
      body: JSON.stringify({ message: err.message }),
    };
  }
}

export async function handleRetrieve(
  event: APIGatewayEvent,
  timeFrame: string
): Promise<APIGatewayProxyResult> {
  try {
    // (1) Check for all Required Parameters & Get Suburb from Address
    const res = await checkParametersAndGetSuburb(event);

    // (2) Validate Inputs
    validateInputs(res.suburb, res.startDate, res.endDate, res.attributes, timeFrame);

    // (3) Retrieve Data from Bucket
    const data: JSONData = await readSuburbs(res.suburb, timeFrame);

    // (4) Return Data
    let attributesArray: string[] = [];
    if (res.attributes !== "") {
      attributesArray = res.attributes.split(",").map((item) => item.trim().toLowerCase());
    }
    const returnData = filterData(data, res.startDate, res.endDate, attributesArray);

    return {
      headers,
      statusCode: 200,
      body: JSON.stringify(returnData),
    };
  } catch (error) {
    if (error instanceof ErrorWithStatus) {
      logger.error("Error with the retrieval API", error.message);
      return {
        headers,
        statusCode: error.statusCode,
        body: JSON.stringify({ message: error.message }),
      };
    } else {
      return {
        headers,
        statusCode: 400,
        body: JSON.stringify(error),
      };
    }
  }
}

// fetches the wmo codes from s3
export async function handleWmoRetrieve(): Promise<APIGatewayProxyResult> {
  try {
    return {
      headers,
      statusCode: 200,
      body: await readBucket(`${GROUP_NAME}/weatherData/wmoCodes.json`),
    };
  } catch (error: any) {
    logger.error("Error with the retrieval API in fetching wmoCodes: ", error.message);
    return {
      headers,
      statusCode: error.statusCode,
      body: JSON.stringify({ message: error.message }),
    };
  }
}

// fetch historical events for all suburbs
export async function handleHeatmapRetrieve(): Promise<APIGatewayProxyResult> {
  try {
    const cachedData = await getHeatmapDataFromCache();

    if (cachedData.length > 0) {
      return {
        headers,
        statusCode: 200,
        body: cachedData,
      };
    }

    const heatmapResults = await getAllSuburbsForHeatmap();
    // Cache fetched data
    await writeBucket(
      `${GROUP_NAME}/cache/heatmapResults.json`,
      JSON.stringify(heatmapResults),
      DEFAULT_TTL
    ); // 24 hour ttl

    return {
      headers,
      statusCode: 200,
      body: JSON.stringify(heatmapResults),
    };
  } catch (err: any) {
    logger.error("Retrieve events for heatmap: an error has occurred: ", err);
    return {
      headers,
      statusCode: err.statusCode,
      body: JSON.stringify({ message: err.message }),
    };
  }
}

export async function handleMappingRetrieve(): Promise<APIGatewayProxyResult> {
  try {
    return {
      headers,
      statusCode: 200,
      body: await readBucket("SE3011-24-F14A-03/suburbsData/weather_mapping.json"),
    };
  } catch (err: any) {
    throw new ErrorWithStatus(
      `Unable to retrieve user mapping. Error: ${err.message}`,
      err.$response?.statusCode || 500
    );
  }
}

export function validateEnergyEndpoint(event: APIGatewayEvent) {
  if (!event.queryStringParameters) {
    throw new ErrorWithStatus("Required param 'userID' is missing.", 400);
  }
  const providedParams = Object.keys(event.queryStringParameters);
  if (!providedParams.includes("userID")) {
    throw new ErrorWithStatus("Required param 'userID' is missing.", 400);
  }
}

// Helper function
async function checkParametersAndGetSuburb(event: APIGatewayEvent): Promise<handleParameterReturn> {
  const requiredParams = ["startDate", "endDate"];
  const optionalParams = ["suburb", "address"];

  if (!event.queryStringParameters) {
    throw new ErrorWithStatus(
      "Required params ('suburb' or 'address'), 'startDate', and 'endDate' are missing.",
      400
    );
  }

  const providedParams = Object.keys(event.queryStringParameters);
  const missingParams = requiredParams.filter((param) => !providedParams.includes(param));

  if (optionalParams.every((s) => providedParams.includes(s))) {
    throw new ErrorWithStatus("Please provide either 'suburb' or 'address' only.", 400);
  } else if (!optionalParams.some((s) => providedParams.includes(s))) {
    throw new ErrorWithStatus("Please provide either 'suburb' or 'address'.", 400);
  } else if (missingParams.length > 0) {
    throw new ErrorWithStatus(
      // eslint-disable-next-line
      `Required param${missingParams.length > 1 ? "s" : ""} '${missingParams.join(", ")}' ${missingParams.length > 1 ? "are" : "is"} missing.`,
      400
    );
  }

  let suburb: string = event.queryStringParameters.suburb as string;
  const startDate: string = event.queryStringParameters.startDate as string;
  const endDate: string = event.queryStringParameters.endDate as string;
  const address: string = (event.queryStringParameters.address ?? "") as string;
  const attributes: string = (event.queryStringParameters.attributes ?? "") as string;

  if (address !== "") {
    suburb = await getSuburb(address);
    if (suburb === "") {
      throw new ErrorWithStatus(`No valid Sydney suburb found with address ${suburb}`, 400);
    }
  }

  const res = {
    suburb: suburb,
    startDate: startDate,
    endDate: endDate,
    attributes: attributes,
  };

  return res;
}
