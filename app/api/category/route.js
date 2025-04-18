import { NextResponse } from "next/server";
import dbConnect from "@/backend/lib/mongodb";
import Category from "@/backend/models/Category";

export async function GET() {
  try {
    await dbConnect();
    
    // Sort categories by priority first (main before normal), then by name
    const categories = await Category.find().sort({ priority: 1, name: 1 }).lean();
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
