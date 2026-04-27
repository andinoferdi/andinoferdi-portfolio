"use client";

import { useEffect } from "react";
import AOS from "aos";

export const useAOS = () => {
  useEffect(() => {
    const isMobile = window.innerWidth < 768;

    AOS.init({
      once: true,
      duration: isMobile ? 400 : 800,
      offset: isMobile ? 5 : 10,
      easing: "ease",
      delay: 0,
      disable: false,
      startEvent: 'DOMContentLoaded',
      initClassName: 'aos-init',
      animatedClassName: 'aos-animate',
      useClassNames: false,
      disableMutationObserver: isMobile,
      debounceDelay: 50,
      throttleDelay: isMobile ? 60 : 99,
    });

    const handleLoad = () => {
      AOS.refresh();
    };

    window.addEventListener('load', handleLoad);
    
    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, []);
};
