import { NextResponse } from "next/server";
import dbConnect from "@/backend/lib/mongodb";
import Category from "@/backend/models/Category";
import { getServerSession } from "next-auth/next";
import { options } from "@/app/api/auth/[...nextauth]/options";
import mongoose from "mongoose";

export async function GET(request, { params }) {
  const { id } = params;
  const session = await getServerSession(options);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    
    // Validate if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid category ID format" }, { status: 400 });
    }
    
    const category = await Category.findById(id).lean();
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    return NextResponse.json(category);
  } catch (error) {
    console.error("Failed to fetch category:", error);
    return NextResponse.json({ error: "Failed to fetch category" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { id } = params;
  const session = await getServerSession(options);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    
    // Validate if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid category ID format" }, { status: 400 });
    }
    
    const data = await request.json();
    const slug = data.slug || data.name.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
    
    const updatedCategory = {
      name: data.name,
      slug,
      description: data.description || "",
      image: data.image && data.image.url ? { url: data.image.url, public_id: data.image.public_id } : undefined,
      priority: data.priority || "normal",
      updatedBy: session.user.id,
      updatedAt: new Date()
    };

    // Check "main" priority limit for updates
    if (updatedCategory.priority === "main") {
      const existingCategory = await Category.findById(id);
      if (!existingCategory || existingCategory.priority !== "main") {
        const mainCount = await Category.countDocuments({ priority: "main" });
        if (mainCount >= 4) {
          return NextResponse.json(
            { error: "Cannot have more than 4 categories with 'main' priority" },
            { status: 400 }
          );
        }
      }
    }

    const category = await Category.findByIdAndUpdate(id, updatedCategory, { new: true });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json({ error: error.message || "Failed to update category" }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = params;
  const session = await getServerSession(options);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    
    // Validate if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid category ID format" }, { status: 400 });
    }
    
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: error.message || "Failed to delete category" }, { status: 400 });
  }
}
