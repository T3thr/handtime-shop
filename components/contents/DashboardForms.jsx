"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { FaTimes, FaUpload, FaTrash, FaPlus, FaCheck, FaExclamationTriangle, FaTag, FaBoxOpen, FaStar } from "react-icons/fa";
import { addProduct, updateProduct, addCategory, updateCategory } from "@/backend/lib/dashboardAction";

export const ProductFormModal = ({ isOpen, onClose, product = null, categories = [] }) => {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    compareAtPrice: "",
    costPerItem: "",
    trackQuantity: true,
    quantity: "0",
    continueSellingWhenOutOfStock: false,
    sku: "",
    barcode: "",
    weight: "",
    weightUnit: "g",
    categories: [],
    tags: [],
    status: "active",
    images: [],
    seoTitle: "",
    seoDescription: "",
    shortDescription: "",
    type: "",
    vendor: ""
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const initialFormDataRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (product) {
      const initialData = {
        name: product.name || "",
        slug: product.slug || "",
        description: product.description || "",
        price: product.price?.toString() || "",
        compareAtPrice: product.compareAtPrice?.toString() || "",
        costPerItem: product.costPerItem?.toString() || "",
        trackQuantity: product.trackQuantity !== undefined ? product.trackQuantity : true,
        quantity: product.quantity?.toString() || "0",
        continueSellingWhenOutOfStock: product.continueSellingWhenOutOfStock || false,
        sku: product.sku || "",
        barcode: product.barcode || "",
        weight: product.weight?.toString() || "",
        weightUnit: product.weightUnit || "g",
        categories: product.categories || [],
        tags: product.tags || [],
        status: product.status || "active",
        images: product.images || [],
        seoTitle: product.seoTitle || "",
        seoDescription: product.seoDescription || "",
        shortDescription: product.shortDescription || "",
        type: product.type || "",
        vendor: product.vendor || ""
      };
      
      setFormData(initialData);
      initialFormDataRef.current = JSON.stringify(initialData);
      if (product.images && product.images.length > 0) {
        setImagePreviewUrls(product.images.map(img => img.url));
      }
    } else {
      const initialData = {
        name: "",
        slug: "",
        description: "",
        price: "",
        compareAtPrice: "",
        costPerItem: "",
        trackQuantity: true,
        quantity: "0",
        continueSellingWhenOutOfStock: false,
        sku: "",
        barcode: "",
        weight: "",
        weightUnit: "g",
        categories: [],
        tags: [],
        status: "active",
        images: [],
        seoTitle: "",
        seoDescription: "",
        shortDescription: "",
        type: "",
        vendor: ""
      };
      
      setFormData(initialData);
      initialFormDataRef.current = JSON.stringify(initialData);
      setImageFiles([]);
      setImagePreviewUrls([]);
    }
    
    setHasUnsavedChanges(false);
  }, [product, isOpen]);

  useEffect(() => {
    if (!product && formData.name && !formData.slug) {
      const slug = formData.name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.name, product]);

  useEffect(() => {
    if (initialFormDataRef.current) {
      const currentFormData = JSON.stringify(formData);
      setHasUnsavedChanges(currentFormData !== initialFormDataRef.current);
    }
  }, [formData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleCategoryChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      categories: checked ? [...prev.categories, value] : prev.categories.filter(cat => cat !== value)
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const uploadImageToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload image");
      }
      const data = await response.json();
      return { url: data.url, public_id: data.public_id };
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error(`Failed to upload image: ${error.message}`);
      throw error;
    }
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newImageFiles = [...imageFiles, ...files];
    setImageFiles(newImageFiles);
    const newPreviewUrls = [...imagePreviewUrls];
    const newImages = [...formData.images];

    for (const file of files) {
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviewUrls.push(reader.result);
          setImagePreviewUrls([...newPreviewUrls]);
        };
        reader.readAsDataURL(file);

        const uploadedImage = await uploadImageToCloudinary(file);
        newImages.push(uploadedImage);
        setFormData(prev => ({ ...prev, images: newImages }));
      } catch (error) {
        continue;
      }
    }
  };

  const handleRemoveImage = (index) => {
    const newImages = [...formData.images];
    const newPreviewUrls = [...imagePreviewUrls];
    const newImageFiles = [...imageFiles];

    if (index < newImages.length) {
      newImages.splice(index, 1);
      setFormData(prev => ({ ...prev, images: newImages }));
    }

    newPreviewUrls.splice(index, 1);
    setImagePreviewUrls(newPreviewUrls);

    if (index >= formData.images.length && newImageFiles.length > 0) {
      const fileIndex = index - formData.images.length;
      newImageFiles.splice(fileIndex, 1);
      setImageFiles(newImageFiles);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.slug.trim()) newErrors.slug = "Slug is required";
    if (!formData.price.trim()) newErrors.price = "Price is required";
    if (isNaN(parseFloat(formData.price))) newErrors.price = "Price must be a number";
    if (formData.compareAtPrice && isNaN(parseFloat(formData.compareAtPrice))) {
      newErrors.compareAtPrice = "Compare at price must be a number";
    }
    if (formData.costPerItem && isNaN(parseFloat(formData.costPerItem))) {
      newErrors.costPerItem = "Cost per item must be a number";
    }
    if (formData.trackQuantity && isNaN(parseInt(formData.quantity))) {
      newErrors.quantity = "Quantity must be a number";
    }
    if (formData.weight && isNaN(parseFloat(formData.weight))) {
      newErrors.weight = "Weight must be a number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
        costPerItem: formData.costPerItem ? parseFloat(formData.costPerItem) : null,
        quantity: formData.trackQuantity ? parseInt(formData.quantity) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
      };

      if (product) {
        await updateProduct(product._id, productData);
      } else {
        await addProduct(productData);
      }

      setHasUnsavedChanges(false);
      localStorage.removeItem('productFormAutoSave');
      onClose();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      localStorage.setItem('productFormAutoSave', JSON.stringify(formData));
      toast.info("Your changes have been auto-saved. They will be restored when you return.");
    }
    onClose();
  };

  const modalVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 500 } },
    exit: { opacity: 0, y: 50, transition: { duration: 0.2 } }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <motion.div
          ref={modalRef}
          className="bg-surface-card rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-6 border-b border-border-primary">
            <h2 className="text-xl font-semibold text-text-primary">
              {product ? "Edit Product" : "Add New Product"}
            </h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-background-secondary text-text-muted hover:text-text-primary transition-colors duration-200"
            >
              <FaTimes className="w-5 h-5" />
            </motion.button>
          </div>

          <div className="overflow-y-auto p-6 max-h-[calc(90vh-80px)]">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <h3 className="text-lg font-medium text-text-primary mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-text-secondary mb-1">Product Name*</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter product name"
                        className={`w-full px-4 py-2 rounded-lg border ${errors.name ? 'border-error' : 'border-border-primary'} bg-background focus:outline-none focus:ring-2 focus:ring-primary/50`}
                      />
                      {errors.name && <p className="mt-1 text-sm text-error">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-text-secondary mb-1">Slug*</label>
                      <input
                        type="text"
                        name="slug"
                        value={formData.slug}
                        onChange={handleChange}
                        placeholder="product-url-slug"
                        className={`w-full px-4 py-2 rounded-lg border ${errors.slug ? 'border-error' : 'border-border-primary'} bg-background focus:outline-none focus:ring-2 focus:ring-primary/50`}
                      />
                      {errors.slug && <p className="mt-1 text-sm text-error">{errors.slug}</p>}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-text-secondary mb-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Detailed product description"
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border border-border-primary bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-text-secondary mb-1">Short Description</label>
                  <textarea
                    name="shortDescription"
                    value={formData.shortDescription}
                    onChange={handleChange}
                    placeholder="Brief product summary"
                    rows={2}
                    className="w-full px-4 py-2 rounded-lg border border-border-primary bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="md:col-span-2">
                  <h3 className="text-lg font-medium text-text-primary mb-4">Pricing</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-text-secondary mb-1">Price*</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted">฿</span>
                        <input
                          type="text"
                          name="price"
                          value={formData.price}
                          onChange={handleChange}
                          placeholder="0.00"
                          className={`w-full pl-8 pr-4 py-2 rounded-lg border ${errors.price ? 'border-error' : 'border-border-primary'} bg-background focus:outline-none focus:ring-2 focus:ring-primary/50`}
                        />
                      </div>
                      {errors.price && <p className="mt-1 text-sm text-error">{errors.price}</p>}
                    </div>
                    <div>
                      <label className="block text-text-secondary mb-1">Compare at Price</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted">฿</span>
                        <input
                          type="text"
                          name="compareAtPrice"
                          value={formData.compareAtPrice}
                          onChange={handleChange}
                          placeholder="0.00"
                          className={`w-full pl-8 pr-4 py-2 rounded-lg border ${errors.compareAtPrice ? 'border-error' : 'border-border-primary'} bg-background focus:outline-none focus:ring-2 focus:ring-primary/50`}
                        />
                      </div>
                      {errors.compareAtPrice && <p className="mt-1 text-sm text-error">{errors.compareAtPrice}</p>}
                    </div>
                    <div>
                      <label className="block text-text-secondary mb-1">Cost per Item</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted">฿</span>
                        <input
                          type="text"
                          name="costPerItem"
                          value={formData.costPerItem}
                          onChange={handleChange}
                          placeholder="0.00"
                          className={`w-full pl-8 pr-4 py-2 rounded-lg border ${errors.costPerItem ? 'border-error' : 'border-border-primary'} bg-background focus:outline-none focus:ring-2 focus:ring-primary/50`}
                        />
                      </div>
                      {errors.costPerItem && <p className="mt-1 text-sm text-error">{errors.costPerItem}</p>}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h3 className="text-lg font-medium text-text-primary mb-4">Inventory</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center mb-4">
                        <input
                          type="checkbox"
                          id="trackQuantity"
                          name="trackQuantity"
                          checked={formData.trackQuantity}
                          onChange={handleChange}
                          className="w-4 h-4 text-primary bg-background border-border-primary rounded focus:ring-primary"
                        />
                        <label htmlFor="trackQuantity" className="ml-2 text-text-secondary">Track quantity</label>
                      </div>
                      {formData.trackQuantity && (
                        <div>
                          <label className="block text-text-secondary mb-1">Quantity</label>
                          <input
                            type="text"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleChange}
                            placeholder="0"
                            className={`w-full px-4 py-2 rounded-lg border ${errors.quantity ? 'border-error' : 'border-border-primary'} bg-background focus:outline-none focus:ring-2 focus:ring-primary/50`}
                          />
                          {errors.quantity && <p className="mt-1 text-sm text-error">{errors.quantity}</p>}
                        </div>
                      )}
                      {formData.trackQuantity && (
                        <div className="mt-4">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="continueSellingWhenOutOfStock"
                              name="continueSellingWhenOutOfStock"
                              checked={formData.continueSellingWhenOutOfStock}
                              onChange={handleChange}
                              className="w-4 h-4 text-primary bg-background border-border-primary rounded focus:ring-primary"
                            />
                            <label htmlFor="continueSellingWhenOutOfStock" className="ml-2 text-text-secondary">Continue selling when out of stock</label>
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-text-secondary mb-1">SKU</label>
                          <input
                            type="text"
                            name="sku"
                            value={formData.sku}
                            onChange={handleChange}
                            placeholder="SKU-12345"
                            className="w-full px-4 py-2 rounded-lg border border-border-primary bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                        </div>
                        <div>
                          <label className="block text-text-secondary mb-1">Barcode</label>
                          <input
                            type="text"
                            name="barcode"
                            value={formData.barcode}
                            onChange={handleChange}
                            placeholder="123456789012"
                            className="w-full px-4 py-2 rounded-lg border border-border-primary bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-text-secondary mb-1">Weight</label>
                          <input
                            type="text"
                            name="weight"
                            value={formData.weight}
                            onChange={handleChange}
                            placeholder="0.0"
                            className={`w-full px-4 py-2 rounded-lg border ${errors.weight ? 'border-error' : 'border-border-primary'} bg-background focus:outline-none focus:ring-2 focus:ring-primary/50`}
                          />
                          {errors.weight && <p className="mt-1 text-sm text-error">{errors.weight}</p>}
                        </div>
                        <div>
                          <label className="block text-text-secondary mb-1">Weight Unit</label>
                          <select
                            name="weightUnit"
                            value={formData.weightUnit}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-lg border border-border-primary bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                          >
                            <option value="g">g</option>
                            <option value="kg">kg</option>
                            <option value="lb">lb</option>
                            <option value="oz">oz</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-text-primary mb-4">Categories</h3>
                  <div className="max-h-60 overflow-y-auto p-4 border border-border-primary rounded-lg bg-background">
                    {categories.length > 0 ? (
                      categories.map((category) => (
                        <div key={category._id} className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            id={`category-${category._id}`}
                            value={category.name}
                            checked={formData.categories.includes(category.name)}
                            onChange={handleCategoryChange}
                            className="w-4 h-4 text-primary bg-background border-border-primary rounded focus:ring-primary"
                          />
                          <label htmlFor={`category-${category._id}`} className="ml-2 text-text-secondary">{category.name}</label>
                        </div>
                      ))
                    ) : (
                      <p className="text-text-muted">No categories available</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-text-primary mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {formData.tags.map((tag, index) => (
                      <div key={index} className="flex items-center bg-background-secondary px-3 py-1 rounded-full">
                        <span className="text-text-secondary mr-2">{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-text-muted hover:text-error transition-colors duration-200"
                        >
                          <FaTimes className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag"
                      className="flex-1 px-4 py-2 rounded-l-lg border border-border-primary bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-primary text-text-inverted rounded-r-lg hover:bg-primary-dark transition-colors duration-300"
                    >
                      <FaPlus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h3 className="text-lg font-medium text-text-primary mb-4">Images</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                    {imagePreviewUrls.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border-primary bg-background-secondary">
                        <Image
                          src={url}
                          alt={`Product image ${index + 1}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 p-1 bg-error text-white rounded-full hover:bg-error-dark transition-colors duration-200"
                        >
                          <FaTrash className="w-3 h-3" />
                        </button>
                        {index === 0 && (
                          <div className="absolute bottom-0 left-0 right-0 bg-primary text-text-inverted text-xs py-1 text-center">
                            Primary
                          </div>
                        )}
                      </div>
                    ))}
                    <label className="relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-border-primary bg-background hover:bg-background-secondary transition-colors duration-200 flex flex-col items-center justify-center cursor-pointer">
                      <FaUpload className="w-8 h-8 text-text-muted mb-2" />
                      <span className="text-text-muted text-sm">Upload Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        multiple
                      />
                    </label>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h3 className="text-lg font-medium text-text-primary mb-4">Status</h3>
                  <div className="flex space-x-4">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="status-active"
                        name="status"
                        value="active"
                        checked={formData.status === "active"}
                        onChange={handleChange}
                        className="w-4 h-4 text-primary bg-background border-border-primary focus:ring-primary"
                      />
                      <label htmlFor="status-active" className="ml-2 text-text-secondary">Active</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="status-draft"
                        name="status"
                        value="draft"
                        checked={formData.status === "draft"}
                        onChange={handleChange}
                        className="w-4 h-4 text-primary bg-background border-border-primary focus:ring-primary"
                      />
                      <label htmlFor="status-draft" className="ml-2 text-text-secondary">Draft</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="status-archived"
                        name="status"
                        value="archived"
                        checked={formData.status === "archived"}
                        onChange={handleChange}
                        className="w-4 h-4 text-primary bg-background border-border-primary focus:ring-primary"
                      />
                      <label htmlFor="status-archived" className="ml-2 text-text-secondary">Archived</label>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h3 className="text-lg font-medium text-text-primary mb-4">Additional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-text-secondary mb-1">Product Type</label>
                      <input
                        type="text"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        placeholder="e.g., Electronics, Clothing"
                        className="w-full px-4 py-2 rounded-lg border border-border-primary bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div>
                      <label className="block text-text-secondary mb-1">Vendor</label>
                      <input
                        type="text"
                        name="vendor"
                        value={formData.vendor}
                        onChange={handleChange}
                        placeholder="e.g., Apple, Nike"
                        className="w-full px-4 py-2 rounded-lg border border-border-primary bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h3 className="text-lg font-medium text-text-primary mb-4">SEO</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-text-secondary mb-1">SEO Title</label>
                      <input
                        type="text"
                        name="seoTitle"
                        value={formData.seoTitle}
                        onChange={handleChange}
                        placeholder="SEO optimized title (appears in search results)"
                        className="w-full px-4 py-2 rounded-lg border border-border-primary bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div>
                      <label className="block text-text-secondary mb-1">SEO Description</label>
                      <textarea
                        name="seoDescription"
                        value={formData.seoDescription}
                        onChange={handleChange}
                        placeholder="Brief description for search engines"
                        rows={2}
                        className="w-full px-4 py-2 rounded-lg border border-border-primary bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2 border border-border-primary text-text-primary rounded-lg hover:bg-background-secondary transition-colors duration-300"
                  disabled={isSubmitting}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="px-6 py-2 bg-primary text-text-inverted rounded-lg hover:bg-primary-dark transition-colors duration-300 flex items-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-text-inverted border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaCheck className="mr-2" />
                      {product ? "Update Product" : "Add Product"}
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export const CategoryFormModal = ({ isOpen, onClose, category = null }) => {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    image: { url: "", public_id: "" },
    priority: "normal"
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [mainCategoriesCount, setMainCategoriesCount] = useState(0);
  const initialFormDataRef = useRef(null);
  const modalRef = useRef(null);

  // Fetch existing main categories count
  useEffect(() => {
    const fetchMainCategories = async () => {
      try {
        const response = await fetch("/api/category");
        const categories = await response.json();
        const mainCount = categories.filter(cat => cat.priority === "main").length;
        setMainCategoriesCount(mainCount);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to load category data.");
      }
    };
    if (isOpen) fetchMainCategories();
  }, [isOpen]);

  useEffect(() => {
    if (category) {
      const initialData = {
        name: category.name || "",
        slug: category.slug || "",
        description: category.description || "",
        image: category.image || { url: "", public_id: "" },
        priority: category.priority || "normal"
      };
      setFormData(initialData);
      initialFormDataRef.current = JSON.stringify(initialData);
      setImagePreview(category.image?.url || "");
    } else {
      const initialData = {
        name: "",
        slug: "",
        description: "",
        image: { url: "", public_id: "" },
        priority: "normal"
      };
      setFormData(initialData);
      initialFormDataRef.current = JSON.stringify(initialData);
      setImagePreview("");
    }
    setHasUnsavedChanges(false);
  }, [category, isOpen]);

  useEffect(() => {
    if (!category && formData.name && !formData.slug) {
      const slug = formData.name.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.name, category]);

  useEffect(() => {
    if (initialFormDataRef.current) {
      const currentFormData = JSON.stringify(formData);
      setHasUnsavedChanges(currentFormData !== initialFormDataRef.current);
    }
  }, [formData]);

  useEffect(() => {
    if (!category && isOpen) {
      const savedData = localStorage.getItem('categoryFormAutoSave');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          setFormData(parsedData);
          setImagePreview(parsedData.image?.url || "");
          toast.info("Restored your unsaved changes.");
          localStorage.removeItem('categoryFormAutoSave');
        } catch (error) {
          console.error("Error restoring auto-saved data:", error);
        }
      }
    }
  }, [isOpen, category]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const uploadImageToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload image");
      }
      const data = await response.json();
      return { url: data.url, public_id: data.public_id };
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error(`Failed to upload image: ${error.message}`);
      throw error;
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);

    try {
      const uploadedImage = await uploadImageToCloudinary(file);
      setFormData(prev => ({ ...prev, image: uploadedImage }));
    } catch (error) {
      setImagePreview(formData.image.url || "");
    }
  };

  const handleRemoveImage = () => {
    setImagePreview("");
    setFormData(prev => ({ ...prev, image: { url: "", public_id: "" } }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.slug.trim()) newErrors.slug = "Slug is required";
    if (
      formData.priority === "main" &&
      mainCategoriesCount >= 4 &&
      (!category || category.priority !== "main")
    ) {
      newErrors.priority = "Cannot add more than 4 'Main' categories";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const categoryData = {
        ...formData,
        image: formData.image.url ? formData.image : null
      };

      if (category) {
        await updateCategory(categoryData);
      } else {
        await addCategory(categoryData);
        setImagePreview("");
        setFormData({
          name: "",
          slug: "",
          description: "",
          image: { url: "", public_id: "" },
          priority: "normal"
        });
      }

      setHasUnsavedChanges(false);
      localStorage.removeItem('categoryFormAutoSave');
      onClose();
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error(error.message || "Failed to save category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      localStorage.setItem('categoryFormAutoSave', JSON.stringify(formData));
      toast.info("Your changes have been auto-saved. They will be restored when you return.");
    }
    onClose();
  };

  const modalVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 500 } },
    exit: { opacity: 0, y: 50 }
  };
  const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <motion.div
          ref={modalRef}
          className="bg-surface-card rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-6 border-b border-border-primary">
            <h2 className="text-xl font-semibold text-text-primary">
              {category ? "Edit Category" : "Add New Category"}
            </h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-background-secondary text-text-muted"
            >
              <FaTimes className="w-5 h-5" />
            </motion.button>
          </div>

          <div className="overflow-y-auto p-6 max-h-[calc(90vh-80px)]">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label className="block text-text-secondary mb-1">Category Name*</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter category name"
                    className={`w-full px-4 py-2 rounded-lg border ${errors.name ? "border-error" : "border-border-primary"} bg-background focus:outline-none focus:ring-2 focus:ring-primary/50`}
                  />
                  {errors.name && <p className="mt-1 text-sm text-error">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-text-secondary mb-1">Slug*</label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="category-url-slug"
                    className={`w-full px-4 py-2 rounded-lg border ${errors.slug ? "border-error" : "border-border-primary"} bg-background focus:outline-none focus:ring-2 focus:ring-primary/50`}
                  />
                  {errors.slug && <p className="mt-1 text-sm text-error">{errors.slug}</p>}
                </div>
                <div>
                  <label className="block text-text-secondary mb-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Category description"
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-border-primary bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary mb-1">Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border ${errors.priority ? "border-error" : "border-border-primary"} bg-background focus:outline-none focus:ring-2 focus:ring-primary/50`}
                  >
                    <option value="main">Main (Featured on homepage)</option>
                    <option value="normal">Normal</option>
                  </select>
                  <p className="mt-1 text-xs text-text-muted">
                    Main categories are limited to 4 and displayed on the homepage. Current count: {mainCategoriesCount}/4
                  </p>
                  {errors.priority && <p className="mt-1 text-sm text-error">{errors.priority}</p>}
                </div>
                <div>
                  <label className="block text-text-secondary mb-2">Category Image</label>
                  {imagePreview ? (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-border-primary mb-4">
                      <Image
                        src={imagePreview}
                        alt="Category image"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 p-1 bg-error text-white rounded-full hover:bg-error-dark"
                      >
                        <FaTrash className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="block w-32 h-32 rounded-lg border-2 border-dashed border-border-primary bg-background hover:bg-background-secondary flex flex-col items-center justify-center cursor-pointer mb-4">
                      <FaUpload className="w-8 h-8 text-text-muted mb-2" />
                      <span className="text-text-muted text-sm text-center">Upload Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2 border border-border-primary text-text-primary rounded-lg hover:bg-background-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="px-6 py-2 bg-primary text-text-inverted rounded-lg hover:bg-primary-dark flex items-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-text-inverted border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaCheck className="mr-2" />
                      {category ? "Update Category" : "Add Category"}
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemType, itemName }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const modalRef = useRef(null);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error(`Error deleting ${itemType.toLowerCase()}:`, error);
      toast.error(`Failed to delete ${itemType.toLowerCase()}. Please try again.`);
    } finally {
      setIsDeleting(false);
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { type: "spring", damping: 25, stiffness: 500 } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <motion.div
          ref={modalRef}
          className="bg-surface-card rounded-xl shadow-xl w-full max-w-md overflow-hidden"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
                <FaExclamationTriangle className="w-8 h-8 text-error" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-text-primary text-center mb-2">
              Delete {itemType}
            </h2>
            <p className="text-text-secondary text-center mb-6">
              Are you sure you want to delete {itemType.toLowerCase()} "{itemName}"? This action cannot be undone.
            </p>
            <div className="flex justify-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-border-primary text-text-primary rounded-lg hover:bg-background-secondary transition-colors duration-300"
                disabled={isDeleting}
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={handleConfirm}
                className="px-6 py-2 bg-error text-white rounded-lg hover:bg-error-dark transition-colors duration-300 flex items-center"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <FaTrash className="mr-2" />
                    Delete {itemType}
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};