// scripts/dropIndex.js
import mongoose from "mongoose";
import dbConnect from "@/backend/lib/mongodb.js";

async function dropIndex() {
  try {
    await dbConnect();
    await mongoose.connection.collection("users").dropIndex("orders.orderId_1");
    console.log("✅ Successfully dropped orders.orderId_1 index");
  } catch (error) {
    console.error("❌ Error dropping index:", error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

dropIndex();