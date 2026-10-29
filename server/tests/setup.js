import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: new URL("../../.env", import.meta.url) });

const testDatabaseUri = process.env.MONGODB_URI_TEST;

// Test Database Guard
export function validateTestDatabase() {
  if (!testDatabaseUri) throw new Error("MONGODB_URI_TEST is required");
  const databaseName = testDatabaseUri.split("/").pop().split("?")[0];
  if (!databaseName.endsWith("_test")) throw new Error("Tests require a database name ending in _test");
}

// Connect Test Database
export async function connectTestDatabase() {
  validateTestDatabase();
  await mongoose.connect(testDatabaseUri);
}

// Clear Test Database
export async function clearTestDatabase() {
  const collections = mongoose.connection.collections;
  for (const collectionName in collections) {
    await collections[collectionName].deleteMany({});
  }
}

// Disconnect Test Database
export async function disconnectTestDatabase() {
  await mongoose.disconnect();
}
