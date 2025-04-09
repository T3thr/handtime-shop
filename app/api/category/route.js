import { NextResponse } from "next/server";
import dbConnect from "@/backend/lib/mongodb";
import Category from "@/backend/models/Category";

export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const priority = searchParams.get('priority');
    
    const query = {};
    if (priority) {
      query.priority = priority;
    }
    
    const categories = await Category.find(query)
      .sort({ 
        priority: -1, // Main categories first
        name: 1 
      })
      .lean();
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' }, 
      { status: 500 }
    );
  }
}