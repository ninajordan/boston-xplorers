import * as categoriesService from "./categories.service.js";

/**
 * GET /api/categories/list-categories
 * Lists down all categories. Will be used in filter facets
 */

export async function listCategories(req, res) {
  try {
    const categories = await categoriesService.listCategories();

    const catNames = [];
    categories.forEach((cat) => {
      catNames.push(cat.categoryName);
    });

    res.status(200).json({
      error: false,
      message: "fetched categories successfully",
      categories: catNames,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: `error occurred in fetching categories: ${error}`,
      categories: [],
    });
  }
}

export async function addCategory(req, res) {
  try {
    const { categoryName } = req.body;
    console.log(`[CONTROLLER] CATEGORY: ${categoryName}`);
    const addedCategory = await categoriesService.addCategory(categoryName);

    if (addedCategory.status == 500) {
      return res.status(500).json({
        error: true,
        message: `Error in adding category: ${addedCategory.message}`,
      });
    }

    res.status(201).json({
      error: false,
      message: "Successfully added category",
      category: addedCategory,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: `Error in adding category: ${error}`,
    });
  }
}
