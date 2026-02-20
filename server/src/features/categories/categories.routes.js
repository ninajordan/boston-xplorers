import express from "express";
import * as categoriesController from "./categories.controller.js";
import { validateCategoryCreation } from "./categories.validation.js";

const router = express.Router();

// Categories will have two APIs only - GET all categories which would be used for filter facets and POST propose-category which
// we can use to add new categories on the go.

// GET /api/categories/list-categories
router.get("/list-categories", categoriesController.listCategories);

// POST /api/categories/propose-categories
router.post("/propose-categories", validateCategoryCreation, categoriesController.addCategory);

export default router;
