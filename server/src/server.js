import { createApp } from "./app.js";
import { validateEnvironment } from "./config/env.js";
import { connectDatabase } from "./config/db.js";

async function startServer() {
  try {
    const config = validateEnvironment();
    await connectDatabase(config.mongoUri);
    const app = createApp(config);
    const port = getEnvironmentValueNumber("PORT", 5000);
    app.listen(port, function serverListening() {
      console.log(`SpendWise server running on port ${port}`);
    });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

function getEnvironmentValueNumber(name, fallback) {
  const value = Number(process.env[name]);
  if (Number.isFinite(value) && value > 0) return value;
  return fallback;
}

startServer();
