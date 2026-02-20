import { connectToDatabase, closeConnection } from "./db.js";

async function setupDatabase() {
  console.log("Setting up BostonXplorers Database!");

  try {
    const db = await connectToDatabase();
    const collections = ["categories", "locations", "itineraries", "itinerarySlots"];

    for (const collName of collections) {
      const existingCollections = await db.listCollections({ name: collName }).toArray();

      if (existingCollections.length > 0) {
        console.log(`Collection ${collName} already exists`);
      } else {
        await db.createCollection(collName);
        console.log(`Collection ${collName} did not exist. Created Successfully`);
      }
    }

    console.log("Creating Indices...");

    await db.collection("categories").createIndex({ categoryID: 1 }, { unique: true });
    await db.collection("locations").createIndex({ locationID: 1 }, { unique: true });
    await db.collection("locations").createIndex({ category: 1 });
    await db.collection("locations").createIndex({ rating: -1 });
    await db.collection("itineraries").createIndex({ itineraryID: 1 }, { unique: true });
    await db
      .collection("itinerarySlots")
      .createIndex({ itineraryID: 1, slotID: 1 }, { unique: true });
    await db.collection("itinerarySlots").createIndex({ cardID: 1 });
  } catch (error) {
    console.error(`Error in setting up the database: ${error}`);
    throw error;
  } finally {
    await closeConnection();
  }
}

setupDatabase();
