"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaMapMarkerAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import axios from "axios";
import { SectionHeader, Card, LoadingSpinner } from "@/components/contents/DashboardUI";
import AddressManagement from "./AddressManagement";

export const SettingsSection = ({ session }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [userData, setUserData] = useState({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
    role: session?.user?.role || "user",
    avatar: session?.user?.image || "/images/avatar-placeholder.jpg"
  });

  // Fetch addresses and user data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch addresses
        const addressResponse = await axios.get("/api/user/address");
        setAddresses(addressResponse.data.addresses || []);
        
        // Fetch user data
        const userResponse = await axios.get("/api/user");
        if (userResponse.data) {
          setUserData({
            name: userResponse.data.name || userData.name,
            email: userResponse.data.email || userData.email,
            role: userResponse.data.role || userData.role,
            avatar: userResponse.data.avatar || userData.avatar
          });
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Failed to load user data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [session]);

  const handleAddressChange = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/user/address");
      setAddresses(response.data.addresses || []);
    } catch (error) {
      console.error("Failed to refresh addresses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SectionHeader title="Address Management" subtitle="Manage your shipping addresses" />
      
      {/* User Profile Card */}
      <div className="mb-6">
        <Card>
          <div className="flex items-center p-4">
            <div className="relative w-16 h-16 rounded-full overflow-hidden mr-4 border-2 border-primary">
              <img 
                src={userData.avatar} 
                alt={userData.name} 
                className="object-cover w-full h-full"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">{userData.name}</h2>
              <p className="text-text-secondary">{userData.email}</p>
              <div className="mt-1">
                <span className="inline-block px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                  {userData.role === "admin" ? "Administrator" : "Customer"}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Address Management Section */}
      <Card>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="p-4"
          >
            <div className="flex items-center mb-4">
              <FaMapMarkerAlt className="text-primary mr-2 text-xl" />
              <h2 className="text-xl font-bold">Your Addresses</h2>
            </div>
            
            <AddressManagement 
              addresses={addresses} 
              onAddressChange={handleAddressChange} 
            />
          </motion.div>
        )}
      </Card>
    </>
  );
};
