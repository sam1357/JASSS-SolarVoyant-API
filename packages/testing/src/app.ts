import express, { json, Express } from "express";
import cors from "cors";

import endpoints from "./routes";
import dotenv from "dotenv";

dotenv.config();

const app: Express = express();
app.use(json());
app.use(cors());

app.use("/testing", endpoints);

export default app;
