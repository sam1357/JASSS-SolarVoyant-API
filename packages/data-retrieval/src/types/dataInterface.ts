export interface JSONData {
  data_source: string;
  dataset_type: string;
  dataset_id: string;
  time_object: TimeObject;
  events: Event[];
}

export interface TimeObject {
  timestamp: string;
  timezone: string;
}

export interface Event {
  time_object: EventTimeObject;
  event_type: string;
  attributes: Attributes;
}

export interface EventTimeObject {
  timestamp: string;
  duration: number;
  duration_unit: string;
  timezone: string;
}

export interface Attributes {
  location: Location;
  units: Units;
  [key: string]: Location | Units | number | undefined;
}

export interface Location {
  suburb: string;
  latitude: number;
  longitude: number;
}

export interface Units {
  time: string;
  [key: string]: string | number | undefined;
}

export interface SuburbData {
  suburb: string;
  latitude: number;
  longitude: number;
  placeId: string;
}

export interface HeatmapRawData {
  suburb: string;
  placeId: string;
  data: JSONData;
}

export interface HeatmapTransformedData {
  suburb: string;
  placeId: string;
  data: HeatmapData[];
}

interface HeatmapData {
  timestamp: string;
  shortwave_radiation: number;
  sunshine_duration: number;
  cloud_cover: number;
  temperature_2m: number;
}
