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
  [key: string]: any;
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
