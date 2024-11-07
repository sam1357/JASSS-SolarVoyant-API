import express, { Request, Response, NextFunction } from "express";
import { RunTestsHandler, ListReportsHandler, FetchReportHandler } from "./handlers";
import logger from "./logger";

const router = express.Router();

// Middleware function for logging requests
router.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`Received request: ${req.method} ${req.originalUrl}`);
  next();
});

// Health check route
router.get("/health-check", (req: Request, res: Response) => {
  const object = {
    hello: "world!",
  };
  return res.json(object);
});

// Route for running tests
router.get("/run-tests", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await RunTestsHandler();
    res.json(result);
  } catch (error: any) {
    next(error);
  }
});

// Route for listing reports
router.get("/list-reports", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await ListReportsHandler();
    res.json(JSON.parse(result));
  } catch (error: any) {
    next(error);
  }
});

// Route for fetching a report
router.get("/fetch-report", async (req: Request, res: Response, next: NextFunction) => {
  const reportKey = req.query?.reportKey as string;
  if (!reportKey) {
    return res.status(400).json({ message: "Please provide a report key." });
  }

  try {
    const result = await FetchReportHandler(reportKey);
    res.send(result);
  } catch (error: any) {
    next(error);
  }
});

// Catch-all route for unknown routes
router.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handling middleware
router.use((error: any, req: Request, res: Response) => {
  logger.error(`An error occurred: ${error.message}`);
  res
    .status(error.statusCode || 500)
    .json({ message: `An error occurred. Error: ${error.message}` });
});

export default router;
