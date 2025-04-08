'use client';
import { createContext, useContext, useEffect, useState, useRef } from 'react';

// Create LIFF context
const LiffContext = createContext({
  liff: null,
  isLoggedIn: false,
  profile: null,
  isReady: false,
  login: () => {},
  logout: () => {},
});

export const useLiff = () => useContext(LiffContext);

export function LiffProvider({ children, liffId }) {
  const [liffObject, setLiffObject] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const isLoggedIn = useRef(false);
  
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;
    
    const initializeLiff = async () => {
      try {
        // Import LIFF dynamically
        const { default: liff } = await import('@line/liff');
        
        if (!liff.isInitialized()) {
          await liff.init({ liffId });
        }
        
        isLoggedIn.current = liff.isLoggedIn();
        setLiffObject(liff);
        setIsReady(true);
        
        // If already logged in, get profile
        if (liff.isLoggedIn()) {
          try {
            const userProfile = await liff.getProfile();
            setProfile(userProfile);
          } catch (profileError) {
            console.error("Error fetching LINE profile:", profileError);
          }
        }
      } catch (error) {
        console.error("LIFF initialization error:", error);
        setIsReady(true); // Mark as ready even with error
      }
    };
    
    initializeLiff();
  }, [liffId]);
  
  const login = async () => {
    if (!liffObject) return;
    
    if (!liffObject.isLoggedIn()) {
      liffObject.login();
    } else {
      try {
        const userProfile = await liffObject.getProfile();
        setProfile(userProfile);
        isLoggedIn.current = true;
        return userProfile;
      } catch (error) {
        console.error("Error getting LINE profile:", error);
      }
    }
  };
  
  const logout = () => {
    if (!liffObject) return;
    
    if (liffObject.isLoggedIn()) {
      liffObject.logout();
      setProfile(null);
      isLoggedIn.current = false;
    }
  };
  
  const contextValue = {
    liff: liffObject,
    isLoggedIn: isLoggedIn.current,
    profile,
    isReady,
    login,
    logout,
  };
  
  return (
    <LiffContext.Provider value={contextValue}>
      {children}
    </LiffContext.Provider>
  );
}

// Optional: Create a separate component for your app
export default function LiffWrapper({ children }) {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  
  if (!liffId) {
    console.warn("LIFF ID not found in environment variables");
    return children;
  }
  
  return (
    <LiffProvider liffId={liffId}>
      {children}
    </LiffProvider>
  );
}