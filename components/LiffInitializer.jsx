"use client";
import { useEffect, useState } from 'react';
import { initializeLiff } from '@/backend/lib/lineLiff';

export default function LiffInitializer() {
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    // Initialize LIFF immediately on component mount
    const init = async () => {
      try {
        await initializeLiff();
        console.log("LIFF initialization completed in LiffInitializer");
      } catch (error) {
        console.error("LIFF initialization failed in LiffInitializer:", error);
        setInitError(error);
      }
    };
    
    init();
    
    // Clean up function
    return () => {
      // No cleanup needed as LIFF doesn't provide a cleanup method
    };
  }, []);
  
  // This component doesn't render anything visible but can expose errors if needed
  return null;
}