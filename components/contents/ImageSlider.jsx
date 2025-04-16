'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import axios from 'axios';
import styles from './ImageSlider.module.css';

export default function ImageSlider() {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showArrows, setShowArrows] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const touchStartXRef = useRef(0);
  const touchCurrentXRef = useRef(0);
  const interactionTimeout = useRef(null);

  // Fetch banners from the API
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/banner?activeOnly=true');
        setBanners(response.data.banners || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching banners:', err);
        setError('Failed to load banners');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanners();
  }, []);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? banners.length - 1 : prevIndex - 1
    );
  };

  // Auto-slide interval
  useEffect(() => {
    if (banners.length > 0) {
      const interval = setInterval(handleNext, 5000);
      return () => clearInterval(interval);
    }
  }, [banners]);

  const resetArrowTimeout = () => {
    clearTimeout(interactionTimeout.current);
    setShowArrows(true);
    interactionTimeout.current = setTimeout(() => setShowArrows(false), 1000);
  };

  useEffect(() => {
    if (banners.length > 0) {
      resetArrowTimeout();
    }
  }, [banners]);

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchCurrentXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchCurrentXRef.current = e.touches[0].clientX;
    const deltaX = touchStartXRef.current - touchCurrentXRef.current;
    const progress = Math.max(Math.min(deltaX / window.innerWidth, 1), -1);

    const imageWrappers = document.querySelectorAll(`.${styles.imageWrapper}`);
    imageWrappers.forEach((wrapper, index) => {
      if (index === currentIndex) {
        wrapper.style.transform = `translateX(${progress * -100}%)`;
      } else if (index === currentIndex - 1 || (currentIndex === 0 && index === banners.length - 1)) {
        wrapper.style.transform = `translateX(${-100 + progress * -100}%)`;
      } else if (index === currentIndex + 1 || (currentIndex === banners.length - 1 && index === 0)) {
        wrapper.style.transform = `translateX(${100 + progress * -100}%)`;
      }
    });
  };

  const handleTouchEnd = () => {
    const deltaX = touchStartXRef.current - touchCurrentXRef.current;
    if (deltaX > 50) {
      handleNext();
    } else if (deltaX < -50) {
      handlePrevious();
    }

    // Reset images position
    const imageWrappers = document.querySelectorAll(`.${styles.imageWrapper}`);
    imageWrappers.forEach((wrapper) => (wrapper.style.transform = ''));

    resetArrowTimeout();
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="relative w-full max-w-screen mx-auto my-8 overflow-hidden">
        <div className={styles.imageContainer}>
          <div className="animate-pulse bg-gray-200 w-full h-[450px] rounded-[15px]"></div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error || banners.length === 0) {
    return (
      <div className="relative w-full max-w-screen mx-auto my-8 overflow-hidden">
        <div className={styles.imageContainer}>
          <div className="flex items-center justify-center w-full h-[450px] bg-gray-100 rounded-[15px] text-gray-500">
            {error || 'No banners available'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full max-w-screen mx-auto my-8 overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={resetArrowTimeout}
      onMouseMove={resetArrowTimeout}
      onTouchStartCapture={resetArrowTimeout}
    >
      <div className={styles.navigationDots}>
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`${styles.dot} ${index === currentIndex ? styles.activeDot : ''}`}
          />
        ))}
      </div>

      <div className={styles.imageContainer}>
        {banners.map((banner, index) => {
          const offset = index - currentIndex;
          const displayClass =
            offset === 0
              ? styles.centerImage
              : offset === -1 || (currentIndex === 0 && index === banners.length - 1)
              ? styles.leftImage
              : offset === 1 || (currentIndex === banners.length - 1 && index === 0)
              ? styles.rightImage
              : styles.hiddenImage;

          return (
            <div key={banner._id} className={`${styles.imageWrapper} ${displayClass}`}>
              <Image
                src={banner.imageUrl}
                alt={banner.title || `Slide ${index}`}
                width={640}
                height={360}
                style={{ objectFit: 'cover' }}
              />
            </div>
          );
        })}
      </div>

      {showArrows && (
        <>
          <button onClick={handlePrevious} className={styles.arrowButtonLeft}>❮</button>
          <button onClick={handleNext} className={styles.arrowButtonRight}>❯</button>
        </>
      )}
    </div>
  );
}