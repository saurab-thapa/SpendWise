import mongoose from "mongoose";

// Connect Database
export async function connectDatabase(mongoUri) {
  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed. Configure MONGODB_URI in .env using local MongoDB or MongoDB Atlas.");
    throw error;
  }
}

// Disconnect Database
export async function disconnectDatabase() {
  await mongoose.disconnect();
}
