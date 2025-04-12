"use client";
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoose";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

// PUT /api/user/address/[id]/default - Set an address as default
export async function PUT(req, { params }) {
  try {
    await connectToDB();
    
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const addressId = params.id;
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return NextResponse.json({ message: "Invalid address ID" }, { status: 400 });
    }
    
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    
    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      return NextResponse.json({ message: "Address not found" }, { status: 404 });
    }
    
    // Set all addresses to non-default
    user.addresses.forEach(addr => {
      addr.isDefault = false;
    });
    
    // Set the selected address as default
    user.addresses[addressIndex].isDefault = true;
    
    await user.save();
    
    return NextResponse.json({ 
      message: "Default address updated successfully", 
      address: user.addresses[addressIndex]
    });
  } catch (error) {
    console.error("Error updating default address:", error);
    return NextResponse.json({ message: "Failed to update default address" }, { status: 500 });
  }
}
