import { utcToZonedTime, format } from "date-fns-tz";

const formatTimeWithOffset = (time: Date): string => {
  const date = utcToZonedTime(time, "Australia/Sydney");
  return format(date, "yyyy-MM-dd'T'HH:mm:ssXXX");
};

const event1 = new Date();
event1.setHours(event1.getHours() + 1);

const event2 = new Date();
event2.setHours(event1.getHours() + 24);

export const forecastTest = {
  "data_source": "Weather API",
  "dataset_type": "Weather/Climate data",
  "dataset_id":
    "https://seng3011-student.s3.ap-southeast-2.amazonaws.com/SE3011-24-F11A-03/data.json",
  "time_object": {
    "timestamp": "2024-03-08T07:52:02+11:00",
    "timezone": "Australia/Sydney",
  },
  "events": [
    {
      "time_object": {
        "timestamp": formatTimeWithOffset(new Date()),
        "duration": 4,
        "duration_unit": "hr",
        "timezone": "Australia/Sydney",
      },
      "event_type": "hourly",
      "attributes": {
        "location": {
          "suburb": "Test",
          "latitude": -33.92578,
          "longitude": 150.9082,
        },
        "units": {
          "time": "iso8601",
          "temperature_2m": "°C",
          "relative_humidity_2m": "%",
          "precipitation_probability": "%",
          "precipitation": "mm",
          "cloud_cover": "%",
          "wind_speed_10m": "km/h",
          "wind_direction_10m": "°",
          "uv_index": "",
          "shortwave_radiation": "W/m²",
        },
        "temperature_2m": 30,
        "relative_humidity_2m": 20,
        "precipitation_probability": 10,
        "precipitation": 0,
        "cloud_cover": 30,
        "wind_speed_10m": 60,
        "wind_direction_10m": 80,
        "uv_index": 7,
        "shortwave_radiation": 282,
      },
    },
    {
      "time_object": {
        "timestamp": formatTimeWithOffset(event1),
        "duration": 24,
        "duration_unit": "hr",
        "timezone": "Australia/Sydney",
      },
      "event_type": "daily",
      "attributes": {
        "location": {
          "suburb": "Test",
          "latitude": -33.92578,
          "longitude": 150.9082,
        },
        "units": {
          "time": "iso8601",
          "daylight_duration": "s",
          "sunshine_duration": "s",
        },
        "daylight_duration": 10,
        "sunshine_duration": 9,
      },
    },
    {
      "time_object": {
        "timestamp": formatTimeWithOffset(event2),
        "duration": 4,
        "duration_unit": "hr",
        "timezone": "Australia/Sydney",
      },
      "event_type": "hourly",
      "attributes": {
        "location": {
          "suburb": "Test",
          "latitude": -33.92578,
          "longitude": 150.9082,
        },
        "units": {
          "time": "iso8601",
          "temperature_2m": "°C",
          "relative_humidity_2m": "%",
          "precipitation_probability": "%",
          "precipitation": "mm",
          "cloud_cover": "%",
          "wind_speed_10m": "km/h",
          "wind_direction_10m": "°",
          "uv_index": "",
          "shortwave_radiation": "W/m²",
        },
        "temperature_2m": 30,
        "relative_humidity_2m": 20,
        "precipitation_probability": 10,
        "precipitation": 0,
        "cloud_cover": 30,
        "wind_speed_10m": 60,
        "wind_direction_10m": 80,
        "uv_index": 7,
        "shortwave_radiation": 282,
      },
    },
  ],
};
