import { InvocationType } from "@aws-sdk/client-lambda";

export type SuburbData = {
  suburb: string;
  latitude: number;
  longitude: number;
};

export type HistoricalMetadata = {
  units: HistoricalDailyUnits;
  timezone: string;
  timezone_abbreviation: string;
};

export type CleanedHistoricalSuburbWeatherData = {
  suburb: string;
  latitude: number;
  longitude: number;
  elevation: number;
  daily: DailyConditions;
};

export type CleanedHistoricalFullWeatherData = {
  metadata: HistoricalMetadata;
  suburbs_data: CleanedHistoricalSuburbWeatherData[];
};

type RawWeatherHourlyUnitData = {
  time: string;
  temperature_2m: string;
  relative_humidity_2m: string;
  precipitation: string;
  precipitation_probability: string;
  cloud_cover: string;
  wind_speed_10m: string;
  wind_direction_10m: string;
  uv_index: string;
  shortwave_radiation: string;
  weather_code: string;
  wind_gusts_10m: string;
  surface_pressure: string;
  apparent_temperature: string;
  visibility: string;
};

export type HourlyConditions = {
  time: string[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  precipitation_probability: number[];
  precipitation: number[];
  cloud_cover: number[];
  wind_speed_10m: number[];
  wind_direction_10m: number[];
  uv_index: number[];
  shortwave_radiation: number[];
  weather_code: number[];
  wind_gusts_10m: number[];
  surface_pressure: number[];
  apparent_temperature: number[];
  visibility: number[];
};

export type DailyConditions = {
  time: string[];
  daylight_duration: number[];
  sunshine_duration: number[];
  temperature_2m: number[];
};

export type HistoricalHourlyConditions = {
  temperature_2m: number[];
  relative_humidity_2m: number[];
  cloud_cover: number[];
  surface_pressure: number[];
  apparent_temperature: number[];
  visibility: number[];
};

export type HistoricalDailyConditions = {
  time: string[];
  daylight_duration: number[];
  sunshine_duration: number[];
  uv_index_max: number[];
  precipitation_sum: number[];
  precipitation_probability_max: number[];
  wind_speed_10m_max: number[];
  wind_direction_10m_dominant: number[];
  shortwave_radiation_sum: number[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  cloud_cover: number[];
  weather_code: number[];
  wind_gusts_10m_max: number[];
  surface_pressure: number[];
  apparent_temperature: number[];
  visibility: number[];
};

export type HistoricalDailyUnits = {
  [key: string]: string;
};

export type HistoricalRawWeatherData = {
  latitude: number;
  longitude: number;
  generation_time_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  hourly_units: RawWeatherHourlyUnitData;
  hourly: HourlyConditions;
  daily_units: HistoricalDailyUnits;
  daily: HistoricalDailyConditions;
};

export type Payload = {
  httpMethod: string;
  path: string;
  body: any;
};

export type Params = {
  FunctionName: string;
  InvocationType: InvocationType;
  Payload: string;
};

export type ShortDailyConditions = {
  time: string[];
  daylight_duration: number[];
  sunshine_duration: number[];
  uv_index: number[];
  precipitation: number[];
  precipitation_probability: number[];
  wind_speed_10m: number[];
  wind_direction_10m: number[];
  shortwave_radiation: number[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  cloud_cover: number[];
  weather_code: number[];
  wind_gusts_10m: number[];
  visibility: number[];
  surface_pressure: number[];
  apparent_temperature: number[];
};
