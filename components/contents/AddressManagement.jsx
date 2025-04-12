"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaPlus, FaEdit, FaTrash, FaHome, FaBuilding, FaMapMarkerAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import axios from "axios";

const AddressManagement = ({ addresses = [], onAddressChange }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [formData, setFormData] = useState({
    recipientName: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    phone: "",
    isDefault: false,
    type: "home"
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const resetForm = () => {
    setFormData({
      recipientName: "",
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      phone: "",
      isDefault: false,
      type: "home"
    });
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("/api/user/address", formData);
      toast.success("Address added successfully");
      setIsAddModalOpen(false);
      resetForm();
      if (onAddressChange) onAddressChange();
    } catch (error) {
      console.error("Failed to add address:", error);
      toast.error(error.response?.data?.message || "Failed to add address");
    }
  };

  const handleEditAddress = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`/api/user/address/${selectedAddress._id}`, formData);
      toast.success("Address updated successfully");
      setIsEditModalOpen(false);
      if (onAddressChange) onAddressChange();
    } catch (error) {
      console.error("Failed to update address:", error);
      toast.error(error.response?.data?.message || "Failed to update address");
    }
  };

  const handleDeleteAddress = async () => {
    try {
      await axios.delete(`/api/user/address/${selectedAddress._id}`);
      toast.success("Address deleted successfully");
      setIsDeleteModalOpen(false);
      if (onAddressChange) onAddressChange();
    } catch (error) {
      console.error("Failed to delete address:", error);
      toast.error(error.response?.data?.message || "Failed to delete address");
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      await axios.put(`/api/user/address/${addressId}/default`);
      toast.success("Default address updated");
      if (onAddressChange) onAddressChange();
    } catch (error) {
      console.error("Failed to set default address:", error);
      toast.error(error.response?.data?.message || "Failed to set default address");
    }
  };

  const openEditModal = (address) => {
    setSelectedAddress(address);
    setFormData({
      recipientName: address.recipientName,
      street: address.street,
      city: address.city,
      state: address.state || "",
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone || "",
      isDefault: address.isDefault,
      type: address.type || "home"
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (address) => {
    setSelectedAddress(address);
    setIsDeleteModalOpen(true);
  };

  const getAddressTypeIcon = (type) => {
    switch (type) {
      case "home":
        return <FaHome className="text-primary" />;
      case "work":
        return <FaBuilding className="text-blue-500" />;
      default:
        return <FaMapMarkerAlt className="text-purple-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Your Addresses</h2>
        <button
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover flex items-center"
        >
          <FaPlus className="mr-2" /> Add New Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="bg-surface-card p-6 rounded-xl border border-border-primary text-center">
          <FaMapMarkerAlt className="mx-auto text-4xl text-text-muted mb-4" />
          <h3 className="text-lg font-medium mb-2">No Addresses Found</h3>
          <p className="text-text-secondary mb-4">
            You haven't added any shipping addresses yet. Add an address to make checkout faster.
          </p>
          <button
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover inline-flex items-center"
          >
            <FaPlus className="mr-2" /> Add New Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div
              key={address._id}
              className={`bg-surface-card p-4 rounded-xl border ${
                address.isDefault ? "border-primary" : "border-border-primary"
              } relative`}
            >
              {address.isDefault && (
                <span className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                  Default
                </span>
              )}
              <div className="flex items-start mb-3">
                <div className="p-2 bg-background-secondary rounded-full mr-3">
                  {getAddressTypeIcon(address.type)}
                </div>
                <div>
                  <h3 className="font-medium">{address.recipientName}</h3>
                  <p className="text-sm text-text-secondary capitalize">{address.type} Address</p>
                </div>
              </div>
              <div className="text-sm text-text-secondary mb-4">
                <p>{address.street}</p>
                <p>
                  {address.city}, {address.state} {address.postalCode}
                </p>
                <p>{address.country}</p>
                {address.phone && <p className="mt-1">Phone: {address.phone}</p>}
              </div>
              <div className="flex justify-between">
                <div className="space-x-2">
                  <button
                    onClick={() => openEditModal(address)}
                    className="text-primary hover:text-primary-hover text-sm"
                  >
                    <FaEdit className="inline mr-1" /> Edit
                  </button>
                  <button
                    onClick={() => openDeleteModal(address)}
                    className="text-error hover:text-red-700 text-sm"
                  >
                    <FaTrash className="inline mr-1" /> Delete
                  </button>
                </div>
                {!address.isDefault && (
                  <button
                    onClick={() => handleSetDefault(address._id)}
                    className="text-sm text-text-secondary hover:text-primary"
                  >
                    Set as Default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Address Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background rounded-lg p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-bold mb-4">Add New Address</h3>
            <form onSubmit={handleAddAddress}>
              <div className="space-y-4">
                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-1">
                    Recipient Name*
                  </label>
                  <input
                    type="text"
                    name="recipientName"
                    value={formData.recipientName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md bg-background text-text-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-1">
                    Street Address*
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md bg-background text-text-primary"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-text-secondary text-sm font-medium mb-1">
                      City*
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-md bg-background text-text-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-text-secondary text-sm font-medium mb-1">
                      State/Province
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-md bg-background text-text-primary"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-text-secondary text-sm font-medium mb-1">
                      Postal Code*
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-md bg-background text-text-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-text-secondary text-sm font-medium mb-1">
                      Country*
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-md bg-background text-text-primary"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md bg-background text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-1">
                    Address Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md bg-background text-text-primary"
                  >
                    <option value="home">Home</option>
                    <option value="work">Work</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isDefault"
                    name="isDefault"
                    checked={formData.isDefault}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <label htmlFor="isDefault" className="text-text-secondary text-sm">
                    Set as default address
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-border-primary rounded-md hover:bg-background-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
                >
                  Add Address
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Address Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background rounded-lg p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-bold mb-4">Edit Address</h3>
            <form onSubmit={handleEditAddress}>
              <div className="space-y-4">
                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-1">
                    Recipient Name*
                  </label>
                  <input
                    type="text"
                    name="recipientName"
                    value={formData.recipientName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md bg-background text-text-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-1">
                    Street Address*
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md bg-background text-text-primary"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-text-secondary text-sm font-medium mb-1">
                      City*
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-md bg-background text-text-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-text-secondary text-sm font-medium mb-1">
                      State/Province
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-md bg-background text-text-primary"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-text-secondary text-sm font-medium mb-1">
                      Postal Code*
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-md bg-background text-text-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-text-secondary text-sm font-medium mb-1">
                      Country*
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-md bg-background text-text-primary"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md bg-background text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-1">
                    Address Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md bg-background text-text-primary"
                  >
                    <option value="home">Home</option>
                    <option value="work">Work</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isDefaultEdit"
                    name="isDefault"
                    checked={formData.isDefault}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <label htmlFor="isDefaultEdit" className="text-text-secondary text-sm">
                    Set as default address
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-border-primary rounded-md hover:bg-background-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background rounded-lg p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-bold mb-4">Delete Address</h3>
            <p className="mb-6">Are you sure you want to delete this address? This action cannot be undone.</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-border-primary rounded-md hover:bg-background-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAddress}
                className="px-4 py-2 bg-error text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AddressManagement;
