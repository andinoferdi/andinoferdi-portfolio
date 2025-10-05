"use client";
import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useTheme } from "next-themes";

type SpotlightProps = {
  gradientFirst?: string;
  gradientSecond?: string;
  gradientThird?: string;
  translateY?: number;
  width?: number;
  height?: number;
  smallWidth?: number;
  duration?: number;
  xOffset?: number;
};

export const Spotlight = ({
  gradientFirst,
  gradientSecond,
  gradientThird,
  translateY = -350,
  width = 560,
  height = 1380,
  smallWidth = 240,
  duration = 7,
  xOffset = 100,
}: SpotlightProps = {}) => {
  const { theme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Adjusted values for mobile
  const mobileWidth = Math.min(width * 0.6, 300);
  const mobileHeight = Math.min(height * 0.7, 800);
  const mobileSmallWidth = Math.min(smallWidth * 0.5, 120);
  const mobileXOffset = Math.min(xOffset * 0.4, 40);
  const mobileTranslateY = Math.min(translateY * 0.8, -280);

  // Default gradients optimized for both light and dark modes with mobile adjustments
  const defaultGradientFirst = theme === "dark" 
    ? `radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(210, 100%, 85%, ${isMobile ? '.04' : '.08'}) 0, hsla(210, 100%, 55%, ${isMobile ? '.01' : '.02'}) 50%, hsla(210, 100%, 45%, 0) 80%)`
    : `radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(210, 100%, 85%, ${isMobile ? '.08' : '.15'}) 0, hsla(210, 100%, 55%, ${isMobile ? '.04' : '.08'}) 50%, hsla(210, 100%, 45%, 0) 80%)`;

  const defaultGradientSecond = theme === "dark"
    ? `radial-gradient(50% 50% at 50% 50%, hsla(210, 100%, 85%, ${isMobile ? '.03' : '.06'}) 0, hsla(210, 100%, 55%, ${isMobile ? '.01' : '.02'}) 80%, transparent 100%)`
    : `radial-gradient(50% 50% at 50% 50%, hsla(210, 100%, 85%, ${isMobile ? '.06' : '.12'}) 0, hsla(210, 100%, 55%, ${isMobile ? '.03' : '.06'}) 80%, transparent 100%)`;

  const defaultGradientThird = theme === "dark"
    ? `radial-gradient(50% 50% at 50% 50%, hsla(210, 100%, 85%, ${isMobile ? '.02' : '.04'}) 0, hsla(210, 100%, 45%, ${isMobile ? '.01' : '.02'}) 80%, transparent 100%)`
    : `radial-gradient(50% 50% at 50% 50%, hsla(210, 100%, 85%, ${isMobile ? '.04' : '.08'}) 0, hsla(210, 100%, 45%, ${isMobile ? '.02' : '.04'}) 80%, transparent 100%)`;

  const finalGradientFirst = gradientFirst || defaultGradientFirst;
  const finalGradientSecond = gradientSecond || defaultGradientSecond;
  const finalGradientThird = gradientThird || defaultGradientThird;

  // Use mobile-adjusted values
  const finalWidth = isMobile ? mobileWidth : width;
  const finalHeight = isMobile ? mobileHeight : height;
  const finalSmallWidth = isMobile ? mobileSmallWidth : smallWidth;
  const finalXOffset = isMobile ? mobileXOffset : xOffset;
  const finalTranslateY = isMobile ? mobileTranslateY : translateY;
  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      transition={{
        duration: 1.5,
      }}
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <motion.div
        animate={{
          x: [0, finalXOffset, 0],
        }}
        transition={{
          duration,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
        className="absolute top-0 left-0 w-screen h-screen z-40 pointer-events-none"
      >
        <div
          style={{
            transform: `translateY(${finalTranslateY}px) rotate(-45deg)`,
            background: finalGradientFirst,
            width: `${finalWidth}px`,
            height: `${finalHeight}px`,
          }}
          className={`absolute top-0 left-0`}
        />

        <div
          style={{
            transform: "rotate(-45deg) translate(5%, -50%)",
            background: finalGradientSecond,
            width: `${finalSmallWidth}px`,
            height: `${finalHeight}px`,
          }}
          className={`absolute top-0 left-0 origin-top-left`}
        />

        <div
          style={{
            transform: "rotate(-45deg) translate(-180%, -70%)",
            background: finalGradientThird,
            width: `${finalSmallWidth}px`,
            height: `${finalHeight}px`,
          }}
          className={`absolute top-0 left-0 origin-top-left`}
        />
      </motion.div>

      <motion.div
        animate={{
          x: [0, -finalXOffset, 0],
        }}
        transition={{
          duration,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
        className="absolute top-0 right-0 w-screen h-screen z-40 pointer-events-none"
      >
        <div
          style={{
            transform: `translateY(${finalTranslateY}px) rotate(45deg)`,
            background: finalGradientFirst,
            width: `${finalWidth}px`,
            height: `${finalHeight}px`,
          }}
          className={`absolute top-0 right-0`}
        />

        <div
          style={{
            transform: "rotate(45deg) translate(-5%, -50%)",
            background: finalGradientSecond,
            width: `${finalSmallWidth}px`,
            height: `${finalHeight}px`,
          }}
          className={`absolute top-0 right-0 origin-top-right`}
        />

        <div
          style={{
            transform: "rotate(45deg) translate(180%, -70%)",
            background: finalGradientThird,
            width: `${finalSmallWidth}px`,
            height: `${finalHeight}px`,
          }}
          className={`absolute top-0 right-0 origin-top-right`}
        />
      </motion.div>
    </motion.div>
  );
};
