"use client";
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoose";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

// PUT /api/user/address/[id] - Update an address
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
    
    const addressData = await req.json();
    
    // Validate required fields
    const requiredFields = ['recipientName', 'street', 'city', 'postalCode', 'country'];
    for (const field of requiredFields) {
      if (!addressData[field]) {
        return NextResponse.json({ message: `${field} is required` }, { status: 400 });
      }
    }
    
    // If making this address default, remove default from other addresses
    if (addressData.isDefault && !user.addresses[addressIndex].isDefault) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }
    
    // Update the address
    Object.keys(addressData).forEach(key => {
      user.addresses[addressIndex][key] = addressData[key];
    });
    
    await user.save();
    
    return NextResponse.json({ 
      message: "Address updated successfully", 
      address: user.addresses[addressIndex]
    });
  } catch (error) {
    console.error("Error updating address:", error);
    return NextResponse.json({ message: "Failed to update address" }, { status: 500 });
  }
}

// DELETE /api/user/address/[id] - Delete an address
export async function DELETE(req, { params }) {
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
    
    const wasDefault = user.addresses[addressIndex].isDefault;
    
    // Remove the address
    user.addresses.splice(addressIndex, 1);
    
    // If the deleted address was the default and there are other addresses,
    // make the first one the default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }
    
    await user.save();
    
    return NextResponse.json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json({ message: "Failed to delete address" }, { status: 500 });
  }
}
