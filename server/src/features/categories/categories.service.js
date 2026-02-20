// CRUD operations on the catergories collection
import { getDatabase } from "../../db/db.js";

async function getNextCategoryId() {
  const db = getDatabase();

  const lastItinerary = await db
    .collection("categories")
    .find({})
    .sort({ categoryID: -1 })
    .limit(1)
    .toArray();
  if (lastItinerary.length === 0) {
    return "001"; // Create first itinerary if no itineraries exist
  }

  const lastIdNumber = parseInt(lastItinerary[0].categoryID, 10);
  const incrementedId = lastIdNumber + 1;

  return incrementedId.toString().padStart(3, "0");
}

export async function listCategories() {
  try {
    const db = getDatabase();
    const categories = await db.collection("categories").find({}).toArray();

    categories.forEach((cat) => {
      console.log(cat);
    });

    return categories;
  } catch (error) {
    console.log(`Error occurred in fetching categories: ${error}`);
    return [];
  }
}

export async function addCategory(categoryName) {
  try {
    console.log(`Category Name: ${categoryName}`);
    const db = getDatabase();
    const categoryID = await getNextCategoryId();
    const category = {
      categoryID: categoryID,
      categoryName: categoryName,
    };

    const added = await db.collection("categories").insertOne(category);

    return {
      status: 201,
      category: category,
    };
  } catch (error) {
    return {
      status: 500,
      message: `Error occured in creating category: ${error}`,
    };
  }
}
