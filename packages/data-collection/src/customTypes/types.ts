export type SuburbData = {
  suburb: string;
  latitude: number;
  longitude: number;
};

export type RawWeatherData = {
  latitude: number;
  longitude: number;
  generation_time_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  hourly_units: RawWeatherHourlyUnitData;
  hourly: HourlyConditions;
  daily_units: RawWeatherDailyUnitData;
  daily: DailyConditions;
};

export type Metadata = {
  units: CleanedWeatherUnitData;
  timezone: string;
  timezone_abbreviation: string;
};

export type CleanedSuburbWeatherData = {
  suburb: string;
  latitude: number;
  longitude: number;
  elevation: number;
  hourly: HourlyConditions;
  daily: DailyConditions;
};

export type CleanedFullWeatherData = {
  metadata: Metadata;
  suburbs_data: CleanedSuburbWeatherData[];
};

type RawWeatherHourlyUnitData = {
  time: string;
  temperature_2m: string;
  relative_humidity_2m: string;
  precipitation: string;
  precipitation_probability: string;
  apparent_temperature: string;
  surface_pressure: string;
  visibility: string;
  wind_gusts_10m: string;
  weather_code: string;
  cloud_cover: string;
  wind_speed_10m: string;
  wind_direction_10m: string;
  uv_index: string;
  shortwave_radiation: string;
};

type RawWeatherDailyUnitData = {
  time: string;
  daylight_duration: string;
  sunshine_duration: string;
};

type CleanedWeatherUnitData = RawWeatherHourlyUnitData & RawWeatherDailyUnitData;

export type HourlyConditions = {
  time: string[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  precipitation_probability: number[];
  precipitation: number[];
  cloud_cover: number[];
  apparent_temperature: number[];
  surface_pressure: number[];
  visibility: number[];
  wind_gusts_10m: number[];
  weather_code: number[];
  wind_speed_10m: number[];
  wind_direction_10m: number[];
  uv_index: number[];
  shortwave_radiation: number[];
};

export type DailyConditions = {
  time: string[];
  daylight_duration: number[];
  sunshine_duration: number[];
};
