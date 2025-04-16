"use client";
import React, { useState, useEffect } from "react";
import { useUserData } from "@/hooks/dashboardHooks";
import {
  SectionHeader,
  Card,
  LoadingSpinner,
} from "@/components/contents/DashboardUI";
import { FaMapMarkerAlt, FaSignOutAlt } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import axios from "axios";
import AddressManagement from "./AddressManagement";
import SignoutModal from "../auth/SignoutModal";

export const SettingsSection = ({ session }) => {
  const { userData, isLoading, isError } = useUserData();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("addresses");
  const [addresses, setAddresses] = useState([]);
  const [isAddressLoading, setIsAddressLoading] = useState(true);
  const [isSignoutModalOpen, setIsSignoutModalOpen] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setIsAddressLoading(true);
    try {
      const response = await axios.get("/api/user/address");
      setAddresses(response.data.addresses || []);
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
    } finally {
      setIsAddressLoading(false);
    }
  };

  const handleSignoutConfirm = () => {
    router.push("/api/auth/signout");
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-error mb-4">Failed to load user data</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-text-inverted rounded-lg hover:bg-primary-dark transition-colors duration-300"
        >
          Retry
        </button>
      </div>
    );
  }

  const tabs = [
    { id: "addresses", label: "Addresses", icon: FaMapMarkerAlt },
  ];

  return (
    <>
      <SectionHeader title="Account Settings" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="md:col-span-1 p-0 overflow-hidden">
          <div className="p-6 bg-background-secondary border-b border-border-primary">
            <div className="flex items-center">
              <div className="w-12 h-12 relative rounded-full overflow-hidden mr-4">
                <Image
                  src={userData?.avatar || "/images/avatar-placeholder.jpg"}
                  alt={userData?.name || "User"}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="font-medium text-text-primary">{userData?.name}</h3>
                <p className="text-sm text-text-secondary">{userData?.email}</p>
              </div>
            </div>
          </div>
          <nav className="p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center p-3 rounded-lg text-left mb-1 transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-white"
                    : "hover:bg-background-hover text-text-primary"
                }`}
              >
                <tab.icon className={`mr-3 ${activeTab === tab.id ? "text-white" : "text-text-secondary"}`} />
                {tab.label}
              </button>
            ))}
            <button
              onClick={() => setIsSignoutModalOpen(true)}
              className="w-full flex items-center p-3 rounded-lg text-left mb-1 text-error hover:bg-error/10 transition-colors"
            >
              <FaSignOutAlt className="mr-3" />
              Sign Out
            </button>
          </nav>
        </Card>

        {/* Content */}
        <Card className="md:col-span-3">
          {activeTab === "addresses" && (
            <div>
              {isAddressLoading ? (
                <LoadingSpinner />
              ) : (
                <AddressManagement addresses={addresses} onAddressChange={fetchAddresses} />
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Signout Modal */}
      <SignoutModal
        isOpen={isSignoutModalOpen}
        onClose={() => setIsSignoutModalOpen(false)}
        onConfirm={handleSignoutConfirm}
      />
    </>
  );
};

export default SettingsSection;