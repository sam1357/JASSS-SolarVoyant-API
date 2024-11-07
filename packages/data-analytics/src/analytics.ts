import {
  TimeRange,
  Location,
  Units,
  AnalyticsData,
  InputObject,
  ReturnObject,
  AnalysisStrategy,
  Query,
} from "./customTypes/dataModel";
import { AnalysisContext, MeanStrategy, getSelectedStrategies } from "./analyticsCalculations";
import { ErrorWithStatus } from "./customTypes/errorWithStatus";
import { DEFAULT_AGGREGATES } from "./constants";

/* helper method
 * takes a string of aggregates and puts them into an array
 * @optional param - aggregate: string of aggregates separated by commas
 * @output - aggregates arranged in an array
 */
export function parseAggregateArray(aggregate: string | null): string[] {
  // If no aggregates are provided, provide all aggregates in response
  if (!aggregate) {
    return DEFAULT_AGGREGATES;
  }

  const userAggregates = aggregate.split(",").map((value) => value.trim());

  // Check if all mapped values are from the default aggregates
  const isValid = userAggregates.every((value) => DEFAULT_AGGREGATES.includes(value));

  if (isValid) {
    return userAggregates;
  } else {
    // Handle invalid aggregates
    throw new ErrorWithStatus("Invalid aggregate values provided", 400);
  }
}

/* Weather data filtering method
 * @required param - json: weather data
 * @output - data: collects values for an attribute from all events in arrays in data
 * @output - attributes: makes a query record and maps attributes with empty
 *            aggregate arrays for the time being
 * @output - timeObject: collects the minimum and maximum timestamp from all events in timeObject
 * @output - location: collects location
 * @output - units: collects all the units
 */
export const getData = (
  json: InputObject
): {
  data: Record<string, number[]>; // Maps attribute to data
  attributesSet: string[]; // Set of all attributes
  timeObject: TimeRange; // Time range object
  location: Location; // Location object
  units: Units; // Units object
} => {
  // Initialize data structures
  const data: Record<string, number[]> = {};
  const timeObject: TimeRange = {
    start_timestamp: "",
    end_timestamp: "",
    timezone: "Australia/Sydney",
    units: "iso8601",
  };
  let location: Location = {
    suburb: "",
    latitude: 0,
    longitude: 0,
  };
  const units: Units = {};
  let input: InputObject;
  try {
    input = JSON.parse(json as unknown as string);
  } catch (error) {
    input = json;
  }

  // Error condition: Ensure events array is not empty
  if (input.events.length === 0) {
    throw new ErrorWithStatus("Events array cannot be empty", 400);
  }

  // Extract common properties from the first event
  const firstEvent = input.events[0];
  const firstEventTimestamp = firstEvent.time_object.timestamp;
  timeObject.start_timestamp = firstEventTimestamp;
  timeObject.end_timestamp = firstEventTimestamp;
  location = firstEvent.attributes.location;

  // Extract attribute names and units
  const attributesSet: string[] = [];
  input.events.forEach((event) => {
    const eventUnits = event.attributes.units;
    Object.keys(eventUnits).forEach((key) => {
      if (!attributesSet.includes(key) && key !== "time") {
        units[key] = eventUnits[key];
        attributesSet.push(key);
        data[key] = [];
      }
    });
  });

  // Extract data for each attribute
  attributesSet.forEach((attribute) => {
    input.events.forEach((event) => {
      const value = event.attributes[attribute];
      if (value !== undefined && typeof value === "number") {
        data[attribute].push(value);
      }

      // Update time range
      const eventTimestamp = event.time_object.timestamp;
      if (eventTimestamp < timeObject.start_timestamp) {
        timeObject.start_timestamp = eventTimestamp;
      }
      if (eventTimestamp > timeObject.end_timestamp) {
        timeObject.end_timestamp = eventTimestamp;
      }
    });
  });

  // Return extracted data
  return { data, attributesSet, timeObject, location, units };
};

/* Attribute to aggregate mapping method
 * @required param: attributeSet
 * @optional param: query containing user request of aggregates for each attribute
 * @optional param: user request for aggregates for all attributes
 * @output: map the attributes with the requested aggregates
 */
export const filterQuery = (
  attributesSet: string[],
  query: Query | null,
  aggregates: string | null
): Record<string, string[]> => {
  const filteredQuery: Record<string, string[]> = {};

  // If query is null, simply apply all requested aggregates to the requested attributes
  if (query === null) {
    // this means we have a single aggregate string that we need to apply to all attributes
    const aggregateArray: string[] = parseAggregateArray(aggregates);
    attributesSet.forEach((attribute) => {
      filteredQuery[attribute] = aggregateArray;
    });
    // Otherwise, map each attribute with the aggregates specifically requested for it
  } else {
    for (const attribute in query) {
      const aggregateArray: string[] = parseAggregateArray(query[attribute]);
      filteredQuery[attribute] = aggregateArray;
    }
  }
  return filteredQuery;
};

/* Performing analysis calculations method
 * @required param: data - mapping of attributes and their respective data from all events
 * @required param: filteredQuery - mapping of attributes with their requested aggregates
 * @required param: all units received
 * @output: analytics - analysis data
 * @output: filteredUnits - filtered units based on user request
 */
export const analysis = (
  data: Record<string, number[]>,
  filteredQuery: Record<string, string[]>,
  units: Units
): { analytics: AnalyticsData; filteredUnits: Units } => {
  const analytics: AnalyticsData = {};
  const filteredUnits: Units = {};
  for (const weatherAttribute in data) {
    // If an attribute from the provided data was not requested by the query, move on
    if (!(weatherAttribute in filteredQuery)) {
      continue;
    }

    // Now for the requested attributes
    // Enter its unit in filteredUnits
    filteredUnits[weatherAttribute] = units[weatherAttribute];
    analytics[weatherAttribute] = {};
    const analysisContext = new AnalysisContext(new MeanStrategy());

    // Get strategies based on requested aggregates
    const selectedStrategies: AnalysisStrategy[] = getSelectedStrategies(
      filteredQuery[weatherAttribute]
    );

    // Apply these strategies for each attribute
    for (const strategy of selectedStrategies) {
      analysisContext.setStrategy(strategy);
      const weatherAttributeValues = data[weatherAttribute];
      const result: number | number[] = analysisContext.executeStrategy(weatherAttributeValues);
      // arrange in result structure
      analytics[weatherAttribute][strategy.name] = result;
    }
  }
  return { analytics, filteredUnits };
};

/* main analytics function
 * requests data from other helper functions and formats according to output object
 * @required param - json: weather data
 * @optional param - query containing weather attributes and required aggregates
 * @optional param - string of aggregates applying for all weather attributes
 * @output - analysis formatted as output object
 */
export const getAnalytics = (
  json: InputObject,
  query: Query | null,
  aggregates: string | null
): ReturnObject => {
  const data = getData(json);
  // Get a list of attributes and the requested aggregates for each
  const filteredQuery: Record<string, string[]> = filterQuery(
    data.attributesSet,
    query,
    aggregates
  );

  // Analyse the weather data in relation to the requested aggregates
  // Filter out units not requried in the response object
  const analysedData = analysis(data.data, filteredQuery, data.units);
  const result: ReturnObject = {
    data_source: json.data_source,
    dataset_type: json.dataset_type,
    dataset_id: json.dataset_id,
    time_object: data.timeObject,
    location: data.location,
    units: analysedData.filteredUnits,
    analytics: analysedData.analytics,
  };
  return result;
};
