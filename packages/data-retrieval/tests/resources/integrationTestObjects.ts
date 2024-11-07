export const retrieveHistoricalRes = {
  "data_source": "Weather API",
  "dataset_type": "Weather/Climate Data",
  "dataset_id":
    "https://s3.console.aws.amazon.com/s3/buckets/seng3011-student?region=ap-southeast-2&bucketType=general&prefix=SE3011-24-F14A-03/&showversions=false",
  "time_object": {
    "timestamp": expect.any(String),
    "timezone": "Australia/Sydney",
  },
  "events": [
    {
      "time_object": {
        "timestamp": "2024-03-06T00:00:00+11:00",
        "duration": 24,
        "duration_unit": "hr",
        "timezone": "Australia/Sydney",
      },
      "event_type": "historical",
      "attributes": {
        "location": {
          "suburb": "Prestons",
          "latitude": -34,
          "longitude": 150.875,
        },
        "units": {
          "time": "iso8601",
          "temperature_2m": "°C",
          "relative_humidity_2m": "%",
        },
        "temperature_2m": expect.any(Number),
        "relative_humidity_2m": expect.any(Number),
      },
    },
    {
      "time_object": {
        "timestamp": "2024-03-07T00:00:00+11:00",
        "duration": 24,
        "duration_unit": "hr",
        "timezone": "Australia/Sydney",
      },
      "event_type": "historical",
      "attributes": {
        "location": {
          "suburb": "Prestons",
          "latitude": -34,
          "longitude": 150.875,
        },
        "units": {
          "time": "iso8601",
          "temperature_2m": "°C",
          "relative_humidity_2m": "%",
        },
        "temperature_2m": expect.any(Number),
        "relative_humidity_2m": expect.any(Number),
      },
    },
  ],
};
