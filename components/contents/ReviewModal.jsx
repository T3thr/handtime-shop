'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaRegStar, FaUpload, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { submitReview } from '@/hooks/reviewHooks';
import Image from 'next/image';

const ReviewModal = ({ isOpen, onClose, product, orderId }) => {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState([]);
  const [imagePublicIds, setImagePublicIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(new Set());

  // Validate props
  if (!isOpen) return null;
  if (!product?._id || !orderId) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-background rounded-lg p-6 w-full max-w-lg"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Error</h3>
            <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
              <FaTimes />
            </button>
          </div>
          <p className="text-red-500">
            Cannot load review form: Invalid product or order information.
          </p>
        </motion.div>
      </div>
    );
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (images.length + files.length > 3) {
      toast.error('Maximum 3 images allowed');
      return;
    }

    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith('image/');
      const isUnderSize = file.size <= 5 * 1024 * 1024;
      if (!isImage) toast.error(`${file.name} is not an image`);
      if (!isUnderSize) toast.error(`${file.name} exceeds 5MB`);
      return isImage && isUnderSize;
    });

    if (validFiles.length === 0) return;

    setUploadingImages(new Set(validFiles.map((_, i) => i)));

    try {
      const uploadPromises = validFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to upload image');
        }

        const data = await response.json();
        return { url: data.url, publicId: data.public_id };
      });

      const uploadedImages = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...uploadedImages.map((img) => img.url)]);
      setImagePublicIds((prev) => [...prev, ...uploadedImages.map((img) => img.publicId)]);
      toast.success('Images uploaded successfully!');
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error(error.message || 'Failed to upload images');
    } finally {
      setUploadingImages(new Set());
    }
  };

  const handleRemoveImage = async (index) => {
    const publicId = imagePublicIds[index];
    if (publicId) {
      try {
        const response = await fetch('/api/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete image');
        }
      } catch (error) {
        console.error('Error deleting image:', error);
        toast.error('Failed to delete image');
      }
    }
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePublicIds((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!rating || rating < 1 || rating > 5) {
      toast.error('Please select a rating between 1 and 5');
      return;
    }

    if (title.trim().length < 5) {
      toast.error('Title must be at least 5 characters');
      return;
    }

    const reviewData = {
      productId: product._id,
      orderId,
      rating,
      title: title.trim(),
      comment: comment.trim(),
      images,
    };

    // Debug log
    console.log('Submitting review data:', reviewData);

    // Client-side validation
    if (!reviewData.productId) {
      toast.error('Product ID is missing');
      return;
    }
    if (!reviewData.orderId) {
      toast.error('Order ID is missing');
      return;
    }
    if (!reviewData.rating) {
      toast.error('Rating is missing');
      return;
    }

    setIsSubmitting(true);

    try {
      await submitReview(reviewData);
      toast.success('Review submitted successfully!');
      onClose();
      setRating(0);
      setTitle('');
      setComment('');
      setImages([]);
      setImagePublicIds([]);
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-background rounded-lg p-6 w-full max-w-lg"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Review Product</h3>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
            disabled={isSubmitting}
          >
            <FaTimes />
          </button>
        </div>

        <div className="flex items-center mb-6">
          <div className="w-16 h-16 relative rounded-md overflow-hidden mr-4">
            <Image
              src={product.images?.[0]?.url || '/images/placeholder.jpg'}
              alt={product.name || 'Product'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 64px, 64px"
              priority
            />
          </div>
          <div>
            <h4 className="font-medium text-text-primary">{product.name || 'Unknown Product'}</h4>
            <p className="text-sm text-text-secondary">Order #{orderId.substring(0, 8)}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-text-secondary text-sm font-bold mb-2">Rating</label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-2xl ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                  disabled={isSubmitting}
                >
                  {rating >= star ? <FaStar /> : <FaRegStar />}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-text-secondary text-sm font-bold mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Summarize your experience"
              maxLength={100}
              disabled={isSubmitting}
            />
          </div>

          <div className="mb-4">
            <label className="block text-text-secondary text-sm font-bold mb-2">Review</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background text-text-primary min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Share your experience with this product"
              maxLength={500}
              disabled={isSubmitting}
            />
          </div>

          <div className="mb-6">
            <label className="block text-text-secondary text-sm font-bold mb-2">
              Images (Optional)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {images.map((url, index) => (
                <div key={index} className="relative w-20 h-20">
                  <Image
                    src={url}
                    alt={`Review image ${index + 1}`}
                    fill
                    className="object-cover rounded-md"
                    sizes="(max-width: 768px) 80px, 80px"
                    priority
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                    disabled={isSubmitting}
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}
              {images.length < 3 && (
                <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors relative">
                  {uploadingImages.size > 0 ? (
                    <span className="text-xs text-gray-500">Uploading...</span>
                  ) : (
                    <>
                      <FaUpload className="text-gray-500" />
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageUpload}
                        className="hidden"
                        multiple
                        disabled={isSubmitting || uploadingImages.size > 0}
                      />
                    </>
                  )}
                </label>
              )}
            </div>
            <p className="text-xs text-gray-500">Upload up to 3 images (JPEG, PNG, WebP, max 5MB each)</p>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 bg-blue-600 text-white rounded-md transition-colors ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ReviewModal;