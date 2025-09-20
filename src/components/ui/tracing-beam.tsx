"use client";
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  motion,
  useTransform,
  useScroll,
  useSpring,
} from "motion/react";
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/use-mobile";

export const TracingBeam = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const isMobile = useMobile();
  const ref = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [svgHeight, setSvgHeight] = useState(0);
  
  // Optimize scroll config for mobile
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
    ...(isMobile && { 
      throttle: 16 // Limit to ~60fps on mobile
    })
  });

  // Memoize SVG height calculation
  const updateSvgHeight = useCallback(() => {
    if (contentRef.current) {
      const height = contentRef.current.offsetHeight;
      setSvgHeight(height);
    }
  }, []);

  useEffect(() => {
    updateSvgHeight();
    
    // Add resize observer for responsive height
    if (contentRef.current) {
      const resizeObserver = new ResizeObserver(updateSvgHeight);
      resizeObserver.observe(contentRef.current);
      
      return () => resizeObserver.disconnect();
    }
  }, [updateSvgHeight]);

  // Optimize spring parameters based on device capability
  const springConfig = useMemo(() => ({
    stiffness: isMobile ? 200 : 400,  // Reduced for mobile
    damping: isMobile ? 40 : 80,      // Increased damping for mobile
    mass: isMobile ? 1.5 : 1,         // More mass for smoother mobile animation
  }), [isMobile]);

  // Create transforms (can't be memoized as they use hooks)
  const y1Transform = useTransform(scrollYProgress, [0, 0.8], [50, Math.max(svgHeight, 100)]);
  const y2Transform = useTransform(scrollYProgress, [0, 1], [50, Math.max(svgHeight - 200, 50)]);

  const y1 = useSpring(y1Transform, springConfig);
  const y2 = useSpring(y2Transform, springConfig);

  return (
    <motion.div
      ref={ref}
      className={cn("relative mx-auto h-full w-full max-w-4xl", className)}
      style={{
        willChange: isMobile ? 'auto' : 'transform', // Optimize for mobile
      }}
    >
      <div 
        className="absolute top-3 left-4 sm:-left-2 md:-left-16"
        style={{
          willChange: isMobile ? 'auto' : 'transform',
        }}
      >
        <motion.div
          transition={{
            duration: isMobile ? 0.1 : 0.2, // Faster on mobile
            delay: isMobile ? 0.2 : 0.5,    // Less delay on mobile
            ease: "easeOut"
          }}
          animate={!isMobile ? {
            boxShadow:
              scrollYProgress.get() > 0
                ? "none"
                : "rgba(0, 0, 0, 0.24) 0px 3px 8px",
          } : {}} // Disable shadow animation on mobile
          className="border-netural-200 ml-[20px] sm:ml-[30px] flex h-3 w-3 sm:h-4 sm:w-4 items-center justify-center rounded-full border shadow-sm"
        >
          <motion.div
            transition={{
              duration: isMobile ? 0.1 : 0.2,
              delay: isMobile ? 0.2 : 0.5,
              ease: "easeOut"
            }}
            animate={!isMobile ? {
              backgroundColor: scrollYProgress.get() > 0 ? "white" : "#10b981",
              borderColor: scrollYProgress.get() > 0 ? "white" : "#059669",
            } : {}} // Disable color animation on mobile
            className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full border border-neutral-300 bg-white"
          />
        </motion.div>
        <svg
          viewBox={`0 0 20 ${svgHeight || 100}`}
          width="20"
          height={svgHeight || 100}
          className="ml-3 sm:ml-5 block"
          aria-hidden="true"
          style={{
            willChange: isMobile ? 'auto' : 'contents',
          }}
        >
          {/* Static background path */}
          <path
            d={`M 1 0V -36 l 18 24 V ${(svgHeight || 100) * 0.8} l -18 24V ${svgHeight || 100}`}
            fill="none"
            stroke="#9091A0"
            strokeOpacity="0.16"
          />
          
          {/* Animated path - simplified for mobile */}
          {!isMobile ? (
            <motion.path
              d={`M 1 0V -36 l 18 24 V ${(svgHeight || 100) * 0.8} l -18 24V ${svgHeight || 100}`}
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="1.25"
              className="motion-reduce:hidden"
              transition={{
                duration: 5, // Reduced duration
                ease: "easeOut"
              }}
            />
          ) : (
            // Static colored path for mobile
            <path
              d={`M 1 0V -36 l 18 24 V ${(svgHeight || 100) * 0.8} l -18 24V ${svgHeight || 100}`}
              fill="none"
              stroke="#6344F5"
              strokeWidth="1.25"
              strokeOpacity="0.6"
            />
          )}
          
          <defs>
            <motion.linearGradient
              id="gradient"
              gradientUnits="userSpaceOnUse"
              x1="0"
              x2="0"
              y1={!isMobile ? y1 : 50}
              y2={!isMobile ? y2 : (svgHeight || 100) - 50}
            >
              <stop stopColor="#18CCFC" stopOpacity="0"></stop>
              <stop stopColor="#18CCFC"></stop>
              <stop offset="0.325" stopColor="#6344F5"></stop>
              <stop offset="1" stopColor="#AE48FF" stopOpacity="0"></stop>
            </motion.linearGradient>
          </defs>
        </svg>
      </div>
      <div 
        ref={contentRef} 
        className="ml-12 sm:ml-20"
        style={{
          willChange: 'auto', // Let browser decide
        }}
      >
        {children}
      </div>
    </motion.div>
  );
};
