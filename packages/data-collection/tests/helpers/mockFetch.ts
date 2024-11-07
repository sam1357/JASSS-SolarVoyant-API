export const mockFetch = async () => {
  return {
    status: 200,
    json: async () => ({
      "metadata": {
        "units": {
          "time": "iso8601",
          "daylight_duration": "s",
          "sunshine_duration": "s",
          "uv_index": "",
          "precipitation": "mm",
          "precipitation_probability": "%",
          "wind_speed_10m": "km/h",
          "wind_direction_10m": "°",
          "shortwave_radiation": "MJ/m²",
          "temperature_2m": "°C",
          "relative_humidity_2m": "%",
          "cloud_cover": "%",
        },
        "timezone": "Australia/Sydney",
        "timezone_abbreviation": "AEDT",
      },
      "suburbs_data": [
        {
          "suburb": "Test",
          "latitude": -33.875,
          "longitude": 150.875,
          "elevation": 63,
          "daily": {
            "time": ["2024-03-18", "2024-03-19", "2024-03-20"],
            "daylight_duration": [43952.51, 43824.62, 43696.54],
            "sunshine_duration": [23904.96, 39053.14, 13423.22],
            "uv_index": [7.1, 7.2, 6.05],
            "precipitation": [1.3, 0.5, 2.5],
            "precipitation_probability": [71, 23, 81],
            "wind_speed_10m": [10.7, 15.5, 20.7],
            "wind_direction_10m": [106, 45, 161],
            "shortwave_radiation": [11.36, 19.21, 8.36],
            "temperature_2m": [20.37, 23.1, 21.29],
            "relative_humidity_2m": [80.13, 76.83, 81.25],
            "cloud_cover": [93.75, 51.67, 74.63],
          },
        },
      ],
    }),
  } as Response;
};
