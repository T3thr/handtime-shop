import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaImage, FaEye, FaEyeSlash, FaTrash, FaArrowUp, FaArrowDown, FaLink } from 'react-icons/fa';
import Image from 'next/image';

export const BannerManagement = () => {
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBanner, setNewBanner] = useState({
    title: '',
    link: '',
    isActive: true,
    file: null
  });
  const [previewUrl, setPreviewUrl] = useState('');

  const fetchBanners = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/banner');
      setBanners(response.data.banners);
    } catch (error) {
      console.error('Failed to fetch banners:', error);
      toast.error('Failed to load banners');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewBanner(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, and WebP are allowed');
      return;
    }

    setNewBanner(prev => ({ ...prev, file }));
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newBanner.file) {
      toast.error('Please select an image');
      return;
    }
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', newBanner.file);
      formData.append('title', newBanner.title);
      formData.append('link', newBanner.link);
      formData.append('isActive', newBanner.isActive);
      
      const response = await axios.post('/api/banner', formData);
      
      toast.success('Banner uploaded successfully');
      setNewBanner({
        title: '',
        link: '',
        isActive: true,
        file: null
      });
      setPreviewUrl('');
      setShowAddForm(false);
      fetchBanners();
    } catch (error) {
      console.error('Failed to upload banner:', error);
      toast.error(error.response?.data?.error || 'Failed to upload banner');
    } finally {
      setIsUploading(false);
    }
  };

  const toggleBannerStatus = async (bannerId, currentStatus) => {
    try {
      await axios.put('/api/banner', {
        bannerId,
        isActive: !currentStatus
      });
      
      setBanners(prev => prev.map(banner => 
        banner._id === bannerId ? { ...banner, isActive: !currentStatus } : banner
      ));
      
      toast.success(`Banner ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Failed to update banner status:', error);
      toast.error('Failed to update banner status');
    }
  };

  const deleteBanner = async (bannerId) => {
    if (!confirm('Are you sure you want to delete this banner? This action cannot be undone.')) {
      return;
    }
    
    try {
      await axios.delete('/api/banner', {
        data: { bannerId }
      });
      
      setBanners(prev => prev.filter(banner => banner._id !== bannerId));
      toast.success('Banner deleted successfully');
    } catch (error) {
      console.error('Failed to delete banner:', error);
      toast.error('Failed to delete banner');
    }
  };

  const moveBannerOrder = async (bannerId, direction) => {
    const bannerIndex = banners.findIndex(b => b._id === bannerId);
    if (bannerIndex === -1) return;
    
    const newBanners = [...banners];
    
    if (direction === 'up' && bannerIndex > 0) {
      // Swap with previous banner
      const temp = newBanners[bannerIndex];
      newBanners[bannerIndex] = newBanners[bannerIndex - 1];
      newBanners[bannerIndex - 1] = temp;
    } else if (direction === 'down' && bannerIndex < newBanners.length - 1) {
      // Swap with next banner
      const temp = newBanners[bannerIndex];
      newBanners[bannerIndex] = newBanners[bannerIndex + 1];
      newBanners[bannerIndex + 1] = temp;
    } else {
      return; // No change needed
    }
    
    // Update order values
    const updatedBanners = newBanners.map((banner, index) => ({
      ...banner,
      order: index + 1
    }));
    
    setBanners(updatedBanners);
    
    try {
      // Update the moved banner's order
      await axios.put('/api/banner', {
        bannerId,
        order: direction === 'up' ? banners[bannerIndex - 1].order : banners[bannerIndex + 1].order
      });
      
      // Update the other banner's order
      await axios.put('/api/banner', {
        bannerId: direction === 'up' ? banners[bannerIndex - 1]._id : banners[bannerIndex + 1]._id,
        order: banners[bannerIndex].order
      });
      
      toast.success('Banner order updated');
    } catch (error) {
      console.error('Failed to update banner order:', error);
      toast.error('Failed to update banner order');
      fetchBanners(); // Refresh to get correct order
    }
  };

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Banner Management</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
        >
          {showAddForm ? 'Cancel' : 'Add New Banner'}
        </button>
      </div>

      {/* Add Banner Form */}
      {showAddForm && (
        <div className="bg-background-secondary p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Add New Banner</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-text-secondary text-sm font-medium mb-2">
                  Banner Title (Optional)
                </label>
                <input
                  type="text"
                  name="title"
                  value={newBanner.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md bg-background text-text-primary"
                  placeholder="Enter banner title"
                />
              </div>
              <div>
                <label className="block text-text-secondary text-sm font-medium mb-2">
                  Link URL (Optional)
                </label>
                <input
                  type="text"
                  name="link"
                  value={newBanner.link}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md bg-background text-text-primary"
                  placeholder="https://example.com"
                />
              </div>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                id="isActive"
                checked={newBanner.isActive}
                onChange={handleInputChange}
                className="mr-2"
              />
              <label htmlFor="isActive" className="text-text-secondary text-sm font-medium">
                Active (visible on homepage)
              </label>
            </div>
            
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-2">
                Banner Image
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <label className="w-full sm:w-auto px-4 py-2 bg-background-secondary border border-border-primary rounded-md text-text-primary hover:bg-background-hover cursor-pointer">
                  <FaImage className="inline mr-2" />
                  Select Image
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-text-secondary">
                  Max size: 5MB. Formats: JPEG, PNG, WebP
                </span>
              </div>
            </div>
            
            {previewUrl && (
              <div className="mt-4">
                <p className="text-sm font-medium text-text-secondary mb-2">Preview:</p>
                <div className="relative w-full h-40 bg-background-secondary rounded-md overflow-hidden">
                  <Image
                    src={previewUrl}
                    alt="Banner preview"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isUploading || !newBanner.file}
                className={`px-4 py-2 rounded-md text-white ${
                  isUploading || !newBanner.file
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-primary hover:bg-primary-hover"
                }`}
              >
                {isUploading ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⟳</span>
                    Uploading...
                  </>
                ) : (
                  "Upload Banner"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Banners List */}
      {isLoading ? (
        <div className="text-center py-10">Loading banners...</div>
      ) : banners.length === 0 ? (
        <div className="text-center py-10 text-text-secondary">
          No banners found. Add your first banner to display in the homepage slider.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map((banner) => (
            <div
              key={banner._id}
              className="bg-background border border-border-primary rounded-lg overflow-hidden"
            >
              <div className="relative h-40 bg-background-secondary">
                <Image
                  src={banner.imageUrl}
                  alt={banner.title || "Banner image"}
                  fill
                  className="object-cover"
                />
                {banner.link && (
                  <div className="absolute top-2 right-2 bg-background-secondary bg-opacity-70 p-1 rounded-full">
                    <FaLink className="text-primary" title={`Links to: ${banner.link}`} />
                  </div>
                )}
                <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${
                  banner.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                  {banner.isActive ? "Active" : "Hidden"}
                </div>
              </div>
              
              <div className="p-3">
                <h3 className="font-medium text-text-primary truncate">
                  {banner.title || "Untitled Banner"}
                </h3>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => moveBannerOrder(banner._id, 'up')}
                      className="p-1 text-text-secondary hover:text-primary"
                      title="Move up"
                    >
                      <FaArrowUp />
                    </button>
                    <button
                      onClick={() => moveBannerOrder(banner._id, 'down')}
                      className="p-1 text-text-secondary hover:text-primary"
                      title="Move down"
                    >
                      <FaArrowDown />
                    </button>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => toggleBannerStatus(banner._id, banner.isActive)}
                      className="p-1 text-text-secondary hover:text-primary"
                      title={banner.isActive ? "Hide banner" : "Show banner"}
                    >
                      {banner.isActive ? <FaEyeSlash /> : <FaEye />}
                    </button>
                    <button
                      onClick={() => deleteBanner(banner._id)}
                      className="p-1 text-text-secondary hover:text-error"
                      title="Delete banner"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
