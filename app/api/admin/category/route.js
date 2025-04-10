import { NextResponse } from "next/server";
import dbConnect from "@/backend/lib/mongodb";
import Category from "@/backend/models/Category";
import { getServerSession } from "next-auth/next";
import { options } from "@/app/api/auth/[...nextauth]/options";

const verifyAdminSession = async () => {
  const session = await getServerSession(options);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
};

export async function POST(request) {
  const session = await verifyAdminSession();
  if (session instanceof NextResponse) return session;

  try {
    await dbConnect();
    const data = await request.json();

    const slug = data.slug || data.name.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
    const categoryData = {
      name: data.name,
      slug,
      description: data.description || "",
      image: data.image && data.image.url ? { url: data.image.url, public_id: data.image.public_id } : undefined,
      priority: data.priority || "normal",
      createdBy: session.user.id,
    };

    // Check "main" priority limit before saving
    if (categoryData.priority === "main") {
      const mainCount = await Category.countDocuments({ priority: "main" });
      if (mainCount >= 4) {
        return NextResponse.json(
          { error: "Cannot add more than 4 categories with 'main' priority" },
          { status: 400 }
        );
      }
    }

    const category = new Category(categoryData);
    await category.save();

    if (request.socket?.server?.io) {
      request.socket.server.io.emit("category_added", category);
    }

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error adding category:", error);
    return NextResponse.json({ error: error.message || "Failed to add category" }, { status: 400 });
  }
}

export async function PUT(request) {
  const session = await verifyAdminSession();
  if (session instanceof NextResponse) return session;

  try {
    await dbConnect();
    const data = await request.json();

    const slug = data.slug || data.name.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
    const updatedCategory = {
      name: data.name,
      slug,
      description: data.description || "",
      image: data.image && data.image.url ? { url: data.image.url, public_id: data.image.public_id } : undefined,
      priority: data.priority || "normal",
      updatedBy: session.user.id,
    };

    // Check "main" priority limit for updates
    if (updatedCategory.priority === "main") {
      const existingCategory = await Category.findOne({ slug: data.slug });
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

    const category = await Category.findOneAndUpdate({ slug: data.slug }, updatedCategory, { new: true });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    if (request.socket?.server?.io) {
      request.socket.server.io.emit("category_updated", category);
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json({ error: error.message || "Failed to update category" }, { status: 400 });
  }
}

export async function DELETE(request) {
  const session = await verifyAdminSession();
  if (session instanceof NextResponse) return session;

  try {
    await dbConnect();
    const { slug } = await request.json();
    const category = await Category.findOneAndDelete({ slug });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    if (request.socket?.server?.io) {
      request.socket.server.io.emit("category_deleted", slug);
    }

    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: error.message || "Failed to delete category" }, { status: 400 });
  }
}