import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";
import morgan from "morgan";
import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import budgetRoutes from "./routes/budgetRoutes.js";
import savingsRoutes from "./routes/savingsRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import { requireAuth } from "./middleware/auth.js";
import { validate } from "./middleware/validate.js";
import { exportTransactions } from "./controllers/exportController.js";
import { z } from "zod";
import { checkOrigin, isAllowedOrigin } from "./middleware/originCheck.js";

// Express Application
export function createApp(config) {
  const app = express();

  app.use(helmet());
  app.use(morgan("combined", { skip: function skipTestLogs() { return process.env.NODE_ENV === "test"; } }));
  app.use(cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true
  }));
  app.use(express.json({ limit: "100kb" }));
  app.use(checkOrigin);

  app.use(session({
    name: "spendwise.sid",
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: config.mongoUri }),
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000
    }
  }));

  app.use("/api", healthRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/profile", profileRoutes);
  app.use("/api/categories", categoryRoutes);
  app.get("/api/transactions/export", requireAuth, validate(z.object({ from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }), "query"), exportTransactions);
  app.use("/api/transactions", transactionRoutes);
  app.use("/api/budgets", budgetRoutes);
  app.use("/api/savings-goals", savingsRoutes);
  app.use("/api/analytics", analyticsRoutes);

  if (process.env.NODE_ENV === "production") {
    const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
    const clientDirectory = path.resolve(serverDirectory, "../../../client/dist");
    app.use(express.static(clientDirectory));
    app.use(function serveReactRouter(req, res) {
      res.sendFile(path.join(clientDirectory, "index.html"));
    });
  }

  app.use(function notFound(req, res) {
    res.status(404).json({ success: false, error: { message: "Route not found", fields: {} } });
  });

  app.use(function errorHandler(error, req, res, next) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Unexpected server error" : error.message;
    res.status(statusCode).json({ success: false, error: { message, fields: error.fields || {} } });
  });

  return app;
}
