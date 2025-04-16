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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Limit to 3 images
    if (images.length + files.length > 3) {
      toast.error('Maximum 3 images allowed');
      return;
    }
    
    // Show loading toast
    const toastId = toast.loading('Uploading images...');
    
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Failed to upload image');
        }
        
        const data = await response.json();
        return data.url;
      });
      
      const uploadedUrls = await Promise.all(uploadPromises);
      setImages([...images, ...uploadedUrls]);
      
      // Update toast to success
      toast.update(toastId, { 
        render: "Images uploaded successfully!", 
        type: "success",
        autoClose: 3000,
        isLoading: false
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.update(toastId, {
        render: "Failed to upload images",
        type: "error",
        autoClose: 3000,
        isLoading: false
      });
    }
  };
  
  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Submitting review with data:", {
        productId: product._id,
        orderId,
        rating,
        title,
        comment,
        images
      });
      
      await submitReview({
        productId: product._id,
        orderId,
        rating,
        title,
        comment,
        images
      });
      
      toast.success('Review submitted successfully!');
      onClose();
      // Reset form
      setRating(0);
      setTitle('');
      setComment('');
      setImages([]);
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;
  
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
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="flex items-center mb-6">
          <div className="w-16 h-16 relative rounded-md overflow-hidden mr-4">
            <Image 
              src={product.images?.[0]?.url || "/images/placeholder.jpg"} 
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h4 className="font-medium text-text-primary">{product.name}</h4>
            <p className="text-sm text-text-secondary">Order #{orderId.substring(0, 8)}</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-text-secondary text-sm font-bold mb-2">
              Rating
            </label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-2xl ${rating >= star ? 'text-yellow-400' : 'text-text-muted'}`}
                >
                  {rating >= star ? <FaStar /> : <FaRegStar />}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-text-secondary text-sm font-bold mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background text-text-primary"
              placeholder="Summarize your experience"
              maxLength={100}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-text-secondary text-sm font-bold mb-2">
              Review
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background text-text-primary min-h-[100px]"
              placeholder="Share your experience with this product"
              maxLength={500}
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
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-2 -right-2 bg-error text-white rounded-full p-1 text-xs"
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}
              {images.length < 3 && (
                <label className="w-20 h-20 border-2 border-dashed border-border-primary rounded-md flex items-center justify-center cursor-pointer hover:bg-background-secondary transition-colors">
                  <FaUpload className="text-text-muted" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    multiple={images.length < 2}
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-text-muted">Upload up to 3 images (optional)</p>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border-primary rounded-md hover:bg-background-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
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
