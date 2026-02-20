import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectToDatabase } from "./src/db/db.js";

import itinerariesRoutes from "./src/features/itineraries/itineraries.routes.js";
import locationRoutes from "./src/features/locations/locations.routes.js";
import categoryRoutes from "./src/features/categories/categories.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("client")); // Serve static files

app.use("/api/itinerary", itinerariesRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/categories", categoryRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Boston Xplorers API is running",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.get("/", (req, res) => {
  res.send("Server running");
});

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectToDatabase();

    // Start listening
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
