import dotenv from "dotenv";

// Environment Values
dotenv.config({ path: new URL("../../../.env", import.meta.url) });

// Read Environment
export function getEnvironmentValue(name, fallback = "") {
  const value = process.env[name];
  if (value) return value;
  return fallback;
}

// Validate Environment
export function validateEnvironment() {
  const mongoUri = getEnvironmentValue("MONGODB_URI");
  const sessionSecret = getEnvironmentValue("SESSION_SECRET");
  const clientOrigin = getEnvironmentValue("CLIENT_ORIGIN", "http://localhost:5173");

  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing. Set it in .env to a local MongoDB URI or MongoDB Atlas URI.");
  }
  if (!sessionSecret) {
    throw new Error("SESSION_SECRET is missing. Add a long random value to .env.");
  }
  if (process.env.NODE_ENV === "production" && sessionSecret.includes("replace-with")) {
    throw new Error("SESSION_SECRET is still a placeholder. Production requires a real secret.");
  }

  return { mongoUri, sessionSecret, clientOrigin };
}
