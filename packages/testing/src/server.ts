import app from "./app";

export const PORT: number = 8080;
export const HOST: string = process.env.IP || "localhost";

const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT} at ${HOST}`);
});

process.on("SIGINT", () => {
  server.close(() => console.log("Shutting down server"));
});
