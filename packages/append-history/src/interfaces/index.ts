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
  attributes: { [key: string]: LocationAttribute | UnitsAttribute | number };
}

export interface WeatherConditions {
  [key: string]: number;
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

// Data analytics objects
interface AnalyticsTimeObject {
  start_timestamp: string;
  end_timestamp: string;
  timezone: string;
  units: string;
}

export interface AnalyticsResult {
  time_object: AnalyticsTimeObject;
  location: LocationAttribute;
  units: UnitsAttribute;
  analytics: AnalyticsAttribute;
}

export interface AnalyticsAttribute {
  [key: string]: AnalyticObject;
}

interface AnalyticObject {
  [key: string]: number;
}
