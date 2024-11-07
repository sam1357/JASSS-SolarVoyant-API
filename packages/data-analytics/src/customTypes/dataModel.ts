/* Selective request */
/* analyse - selective and summarise endpoints */
export interface SummariseInput {
  query: Query;
  weather: InputObject;
}

/* Query Input */
export interface Query {
  [key: string]: string;
}

/* Weather Input */
export interface InputObject {
  data_source: string;
  dataset_type: string;
  dataset_id: string;
  time_object: MainTimeStamp;
  events: InputEvent[];
}

export interface InputEvent {
  time_object: TimeObject;
  event_type: string;
  attributes: InputAttributes;
}

export interface MainTimeStamp {
  timestamp: string;
  timezone: string;
}

export interface TimeObject {
  timestamp: string;
  duration: number;
  duration_unit: string;
}

export interface InputAttributes {
  location: Location;
  units: Units;
  [key: string]: Location | Units | number | undefined;
}

/* Analytics Output */
export interface ReturnObject {
  data_source: string;
  dataset_type: string;
  dataset_id: string;
  time_object: TimeRange;
  location: Location;
  units: Units;
  analytics: AnalyticsData;
}

export interface TimeRange {
  start_timestamp: string;
  end_timestamp: string;
  timezone: string;
  units: string;
}

export interface AnalyticsData {
  [key: string]: {
    [key: string]: number | number[];
  };
}

/* eslint-disable no-unused-vars */
export interface AnalysisStrategy {
  name: string;
  calculate(values: number[]): number | number[];
}
/* eslint-disable no-unused-vars */

/* Common */
export interface Location {
  suburb: string;
  latitude: number;
  longitude: number;
}

// generalising units and input attributes since we don't know which ones we'll get
export interface Units {
  [key: string]: string | undefined;
}

export interface TransformedHeatmapData {
  suburb: string;
  placeId: string;
  data: {
    shortwave_radiation?: number[];
    temperature_2m?: number[];
    cloud_cover?: number[];
    sunshine_duration?: number[];
  };
}

export interface RawHeatmapData {
  suburb: string;
  placeId: string;
  data: RawHeatmapWeatherData[];
}

export interface RawHeatmapWeatherData {
  timestamp: string;
  shortwave_radiation?: number;
  temperature_2m?: number;
  sunshine_duration?: number;
  cloud_cover?: number;
}
