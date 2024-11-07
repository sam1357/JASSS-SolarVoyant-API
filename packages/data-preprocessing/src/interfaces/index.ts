export interface ADAGEDataModel {
  data_source: string;
  dataset_type: string;
  dataset_id: string;
  time_object: MainTimeObject;
  events: Event[];
}

export interface Event {
  time_object: EventTimeObject;
  event_type: string;
  attributes: { [key: string]: any };
}

export interface LocationAttribute {
  suburb: string;
  latitude: number;
  longitude: number;
}

export interface UnitsAttribute {
  [key: string]: string;
}

interface MainTimeObject {
  timestamp: string;
  timezone: string;
}

export interface EventTimeObject extends MainTimeObject {
  duration: number;
  duration_unit: string;
}

// Data structure coming from data-collection
export interface CleanedFullWeatherData {
  metadata: Metadata;
  suburbs_data: CleanedSuburbWeatherData[];
}

export interface Metadata {
  units: UnitsAttribute;
  timezone: string;
  timezone_abbreviation: string;
}

export interface CleanedSuburbWeatherData {
  suburb: string;
  latitude: number;
  longitude: number;
  elevation: number;
  hourly?: Conditions;
  daily: Conditions;
}

export interface Conditions {
  time: string[];
  [key: string]: number[] | string[];
}
