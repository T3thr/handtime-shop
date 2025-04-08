"use client";

import { useState, useEffect } from 'react';

export function useLiff() {
  const [liffObject, setLiffObject] = useState(null);
  const [liffError, setLiffError] = useState(null);

  useEffect(() => {
    // Only run in browser environment
    if (typeof window !== 'undefined') {
      const initLiff = async () => {
        try {
          // Dynamically import LIFF SDK to avoid server-side issues
          const { default: liff } = await import('@line/liff');
          
          // Check if LIFF is already initialized
          if (!liff.isApiAvailable()) {
            await liff.init({
              liffId: process.env.NEXT_PUBLIC_LIFF_ID,
              withLoginOnExternalBrowser: true, // Enable login on external browser
            });
          }
          
          setLiffObject(liff);
        } catch (error) {
          console.error('LIFF initialization failed:', error);
          setLiffError(error);
        }
      };

      initLiff();
    }
  }, []);

  return liffObject;
}

export default useLiff;