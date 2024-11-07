import {
  InputObject,
  RawHeatmapData,
  RawHeatmapWeatherData,
  ReturnObject,
  TransformedHeatmapData,
} from "./customTypes/dataModel";

export const testJSON = (s: string): boolean => {
  if (typeof s !== "string") {
    return false;
  }
  try {
    JSON.parse(s);
    return true;
  } catch (error) {
    return false;
  }
};

/* testing helper function
 * checks if the param object is of type InputObject
 */
export const isInputObject = (obj: any): obj is InputObject => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "data_source" in obj &&
    "dataset_type" in obj &&
    "dataset_id" in obj &&
    "time_object" in obj &&
    "events" in obj
  );
};

/* testing helper function
 * checks if the param object is of type OutputObject
 */
export const isReturnObject = (obj: any): obj is ReturnObject => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "time_object" in obj &&
    "location" in obj &&
    "units" in obj &&
    "analytics" in obj
  );
};

/**
 * Function to transform the data from the heatmap retrieval for analytics, given a condition name
 * @param data - data to be transformed
 * @param condition - condition name
 * @returns - transformed data
 */
export const transformHeatmapData = (
  data: RawHeatmapData[],
  condition: string
): TransformedHeatmapData[] => {
  for (const suburb of data) {
    let res: number[] = [];

    for (const event of suburb.data) {
      res.push(event[condition as keyof RawHeatmapWeatherData] as number);
    }

    // put the transformed data back into the data object, where condition is the key
    suburb.data = { [condition]: res } as any;
    res = [];
  }

  return data as any;
};
