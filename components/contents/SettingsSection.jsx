"use client";
import React, { useState, useEffect } from "react";
import { useUserData } from "@/hooks/dashboardHooks";
import {
  SectionHeader,
  Card,
  LoadingSpinner,
} from "@/components/contents/DashboardUI";
import { FaUser, FaLock, FaMapMarkerAlt, FaBell, FaShieldAlt, FaSignOutAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import axios from "axios";
import AddressManagement from "./AddressManagement";

export const SettingsSection = ({ session }) => {
  const { userData, isLoading, isError, mutate } = useUserData();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  const [addresses, setAddresses] = useState([]);
  const [isAddressLoading, setIsAddressLoading] = useState(true);

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
      toast.error("Failed to load addresses");
    } finally {
      setIsAddressLoading(false);
    }
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
    //{ id: "profile", label: "Profile", icon: FaUser },
    { id: "addresses", label: "Addresses", icon: FaMapMarkerAlt },
    { id: "notifications", label: "Notifications", icon: FaBell },
    //{ id: "privacy", label: "Privacy", icon: FaShieldAlt },
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
              onClick={() => {
                // Handle logout
                router.push("/api/auth/signout");
              }}
              className="w-full flex items-center p-3 rounded-lg text-left mb-1 text-error hover:bg-error/10 transition-colors"
            >
              <FaSignOutAlt className="mr-3" />
              Sign Out
            </button>
          </nav>
        </Card>

        {/* Content */}
        <Card className="md:col-span-3">
          {activeTab === "profile" && (
            <div>
              <h2 className="text-xl font-bold mb-6">Profile Information</h2>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-text-secondary text-sm font-medium mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      defaultValue={userData?.name}
                      className="w-full px-4 py-2 border border-border-primary rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-text-secondary text-sm font-medium mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      defaultValue={userData?.email}
                      disabled
                      className="w-full px-4 py-2 border border-border-primary rounded-lg bg-background-secondary text-text-muted cursor-not-allowed"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-2">
                    Profile Picture
                  </label>
                  <div className="flex items-center">
                    <div className="w-16 h-16 relative rounded-full overflow-hidden mr-4">
                      <Image
                        src={userData?.avatar || "/images/avatar-placeholder.jpg"}
                        alt={userData?.name || "User"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      className="px-4 py-2 bg-background border border-border-primary rounded-lg hover:bg-background-secondary transition-colors duration-300"
                    >
                      Change Picture
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-2">
                    Bio
                  </label>
                  <textarea
                    rows={4}
                    defaultValue={userData?.bio || ""}
                    className="w-full px-4 py-2 border border-border-primary rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    placeholder="Tell us a bit about yourself..."
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors duration-300"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "addresses" && (
            <div>
              {isAddressLoading ? (
                <LoadingSpinner />
              ) : (
                <AddressManagement addresses={addresses} onAddressChange={fetchAddresses} />
              )}
            </div>
          )}

          {activeTab === "notifications" && (
            <div>
              <h2 className="text-xl font-bold mb-6">Notification Preferences</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border border-border-primary rounded-lg">
                  <div>
                    <p className="font-medium text-text-primary">Order Updates</p>
                    <p className="text-sm text-text-secondary">
                      Receive notifications about your order status
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-background-secondary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 border border-border-primary rounded-lg">
                  <div>
                    <p className="font-medium text-text-primary">Promotions & Discounts</p>
                    <p className="text-sm text-text-secondary">
                      Receive notifications about special offers and discounts
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-background-secondary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 border border-border-primary rounded-lg">
                  <div>
                    <p className="font-medium text-text-primary">Account Activity</p>
                    <p className="text-sm text-text-secondary">
                      Receive notifications about login attempts and account changes
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-background-secondary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors duration-300"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "privacy" && (
            <div>
              <h2 className="text-xl font-bold mb-6">Privacy Settings</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border border-border-primary rounded-lg">
                  <div>
                    <p className="font-medium text-text-primary">Profile Visibility</p>
                    <p className="text-sm text-text-secondary">
                      Control who can see your profile information
                    </p>
                  </div>
                  <select className="px-3 py-2 border border-border-primary rounded-md bg-background text-text-primary">
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <div className="flex items-center justify-between p-4 border border-border-primary rounded-lg">
                  <div>
                    <p className="font-medium text-text-primary">Data Collection</p>
                    <p className="text-sm text-text-secondary">
                      Allow us to collect usage data to improve your experience
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-background-secondary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 border border-border-primary rounded-lg">
                  <div>
                    <p className="font-medium text-text-primary">Marketing Cookies</p>
                    <p className="text-sm text-text-secondary">
                      Allow third-party cookies for personalized marketing
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-background-secondary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <div>
                  <button
                    type="button"
                    className="px-6 py-2 bg-error text-white rounded-lg hover:bg-red-700 transition-colors duration-300"
                  >
                    Delete Account
                  </button>
                  <p className="text-xs text-text-muted mt-2">
                    This action is permanent and cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  );
};

export default SettingsSection;
