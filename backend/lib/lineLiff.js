"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

let liffObject = null;

export async function initializeLiff() {
  if (typeof window === 'undefined') return null;
  
  try {
    const liff = (await import('@line/liff')).default;
    
    if (liff.isInitialized()) return liff;
    
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    if (!liffId) throw new Error("LIFF ID is not defined");
    
    await liff.init({ liffId });
    liffObject = liff;
    return liff;
  } catch (error) {
    console.error("LIFF initialization failed:", error);
    return null;
  }
}

export function useLiff() {
  const [liff, setLiff] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const { data: session } = useSession();

  useEffect(() => {
    if (liffObject) {
      setLiff(liffObject);
      setIsReady(true);
      setIsLoggedIn(liffObject.isLoggedIn());
      return;
    }
    
    initializeLiff()
      .then((liffInstance) => {
        if (liffInstance) {
          setLiff(liffInstance);
          setIsReady(true);
          setIsLoggedIn(liffInstance.isLoggedIn());
          
          if (liffInstance.isLoggedIn()) {
            liffInstance.getProfile()
              .then(setProfile)
              .catch(e => setError(e));
          }
        }
      })
      .catch(err => setError(err));
  }, [session]);

  return { liff, isReady, isLoggedIn, profile, error };
}