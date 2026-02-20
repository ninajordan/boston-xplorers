import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error(`MONGODB_URI not defined in Environment`);
}

let client;
let db;

export async function connectToDatabase() {
  if (db) {
    return db;
  }

  try {
    client = new MongoClient(uri);
    await client.connect();

    db = client.db("boston-xplorers");
    console.log(`Database Connection successful`);
    return db;
  } catch (error) {
    console.log(`Error in Connecting to DB: ${error}`);
    throw error;
  }
}

export function getDatabase() {
  if (!db) {
    throw new Error("Database not initialized. Connect to database first!");
  }
  return db;
}

export async function closeConnection() {
  if (client) {
    await client.close();
    db = null;
    client = null;
    console.log("Connection to Database aborted");
  }
}
