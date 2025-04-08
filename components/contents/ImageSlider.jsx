'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from './ImageSlider.module.css';

const images = [
  '/banner/1.jpg',
  '/banner/2.jpg',
  '/banner/3.jpg',
];

export default function ImageSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showArrows, setShowArrows] = useState(true);
  const touchStartXRef = useRef(0);
  const touchCurrentXRef = useRef(0);
  const interactionTimeout = useRef(null);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  useEffect(() => {
    const interval = setInterval(handleNext, 5000);
    return () => clearInterval(interval);
  }, []);

  const resetArrowTimeout = () => {
    clearTimeout(interactionTimeout.current);
    setShowArrows(true);
    interactionTimeout.current = setTimeout(() => setShowArrows(false), 1000);
  };

  useEffect(() => {
    resetArrowTimeout();
  }, []);

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
      } else if (index === currentIndex - 1 || (currentIndex === 0 && index === images.length - 1)) {
        wrapper.style.transform = `translateX(${-100 + progress * -100}%)`;
      } else if (index === currentIndex + 1 || (currentIndex === images.length - 1 && index === 0)) {
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
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`${styles.dot} ${index === currentIndex ? styles.activeDot : ''}`}
          />
        ))}
      </div>

      <div className={styles.imageContainer}>
        {images.map((image, index) => {
          const offset = index - currentIndex;
          const displayClass =
            offset === 0
              ? styles.centerImage
              : offset === -1 || (currentIndex === 0 && index === images.length - 1)
              ? styles.leftImage
              : offset === 1 || (currentIndex === images.length - 1 && index === 0)
              ? styles.rightImage
              : styles.hiddenImage;

          return (
            <div key={index} className={`${styles.imageWrapper} ${displayClass}`}>
              <Image src={image} alt={`Slide ${index}`} width={640} height={360} />
            </div>
          );
        })}
      </div>

      {showArrows && (
        <>
          <button onClick={handlePrevious} className={styles.arrowButtonLeft}>&#10094;</button>
          <button onClick={handleNext} className={styles.arrowButtonRight}>&#10095;</button>
        </>
      )}
    </div>
  );
}
