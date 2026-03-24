import dotenv from "dotenv";
dotenv.config({ path: ".env" });
import setupTestDB from "./initialize_database.js";

export default async function LoadTest() {
  console.log("Initializing test database...");
  if (process.env.DB_CONNECTION_STRING_BOT) {
    await setupTestDB();
    console.log("Test database setup completed.");
  } else console.log("DB is not specified.");
}
