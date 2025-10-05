"use client";

import { useState, useEffect } from "react";

interface UseLoadingScreenReturn {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useLoadingScreen = (): UseLoadingScreenReturn => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hasVisited = sessionStorage.getItem("hasVisited");
    
    if (hasVisited) {
      setIsLoading(false);
    } else {
      sessionStorage.setItem("hasVisited", "true");
    }
  }, []);

  return {
    isLoading,
    setIsLoading,
  };
};
