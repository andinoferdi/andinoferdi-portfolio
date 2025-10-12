"use client";

import { useEffect } from "react";
import AOS from "aos";

export const useAOS = () => {
  useEffect(() => {
    const initAOS = () => {
      AOS.init({
        once: true,
        duration: 1000,
        offset: 100,
        easing: "ease-in-out",
        delay: 0,
      });
    };

    initAOS();
    
    window.addEventListener("resize", initAOS);
    
    return () => {
      window.removeEventListener("resize", initAOS);
      AOS.refresh();
    };
  }, []);
};
