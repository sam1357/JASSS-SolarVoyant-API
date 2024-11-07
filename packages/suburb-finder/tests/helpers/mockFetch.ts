export const mockFetch = async (input: string | URL | Request) => {
  if ((input as string).includes("Shinjuku")) {
    return {
      status: 200,
      json: async () => {
        return {
          candidates: [{ formatted_address: "3 Chome-38-1 Shinjuku, Shinjuku City" }],
        };
      },
    } as Response;
  } else {
    return {
      status: 200,
      json: async () => {
        return {
          candidates: [{ formatted_address: "21 Hineoma Street, The Rocks NSW" }],
        };
      },
    } as Response;
  }
};
