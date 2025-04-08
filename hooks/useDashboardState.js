"use client";

import useSWR from 'swr';
import { useState, useEffect } from 'react';

// Custom hook for managing active dashboard section
export const useActiveSection = () => {
  // Use localStorage to persist active section between page refreshes
  const [state, setState] = useState({ activeSection: "overview" });

  // Load saved section from localStorage on component mount
  useEffect(() => {
    const savedSection = localStorage.getItem('dashboardActiveSection');
    if (savedSection) {
      setState({ activeSection: savedSection });
    }
  }, []);

  // Save section to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('dashboardActiveSection', state.activeSection);
  }, [state.activeSection]);

  return [state, setState];
};
