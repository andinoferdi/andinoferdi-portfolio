"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/use-mobile";

interface TracingBeamProps {
  children: React.ReactNode;
  className?: string;
}

export const TracingBeam: React.FC<TracingBeamProps> = ({ children, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const isMobile = useMobile();
  
  // Throttled scroll handler for better mobile performance
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const elementHeight = rect.height;
    
    // Calculate progress based on element position in viewport
    let progress = 0;
    
    if (rect.top <= viewportHeight && rect.bottom >= 0) {
      const totalScrollableHeight = elementHeight + viewportHeight;
      const scrolled = viewportHeight - rect.top;
      progress = Math.max(0, Math.min(1, scrolled / totalScrollableHeight));
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
    
    setScrollProgress(progress);
  }, []);

  // Throttled scroll listener for 60fps performance
  useEffect(() => {
    let ticking = false;
    
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Initial calculation
    handleScroll();
    
    window.addEventListener('scroll', throttledScroll, { passive: true });
    window.addEventListener('resize', throttledScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      window.removeEventListener('resize', throttledScroll);
    };
  }, [handleScroll]);

  // Calculate line height and progress for visual effect
  const lineHeight = Math.max(300, (contentRef.current?.offsetHeight || 0) * 0.8);
  const progressHeight = lineHeight * scrollProgress;
  
  return (
    <div 
      ref={containerRef}
      className={cn("relative w-full max-w-4xl mx-auto", className)}
    >
      {/* Tracing Line Container */}
      <div className="absolute left-4 top-3 sm:-left-2 md:-left-16">
        {/* Start Dot */}
        <div 
          className={cn(
            "ml-5 sm:ml-7 flex h-3 w-3 sm:h-4 sm:w-4 items-center justify-center rounded-full border-2 transition-all duration-300",
            isVisible 
              ? "border-blue-500 shadow-lg shadow-blue-500/25" 
              : "border-gray-400"
          )}
          style={{
            transform: 'translateZ(0)', // GPU acceleration
            willChange: isVisible ? 'border-color, box-shadow' : 'auto'
          }}
        >
          <div 
            className={cn(
              "h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full transition-all duration-300",
              isVisible ? "bg-blue-500" : "bg-gray-400"
            )}
            style={{
              transform: 'translateZ(0)', // GPU acceleration
            }}
          />
        </div>

        {/* Tracing Line */}
        <div 
          className="ml-[22px] sm:ml-[30px] mt-2 relative"
          style={{
            height: `${lineHeight}px`,
            transform: 'translateZ(0)', // GPU acceleration
          }}
        >
          {/* Background Line */}
          <div 
            className="absolute w-px bg-gray-600/30"
            style={{
              height: `${lineHeight}px`,
              transform: 'translateZ(0)',
            }}
          />
          
          {/* Animated Progress Line - CSS-based for better mobile performance */}
          <div 
            className={cn(
              "absolute w-px transition-all duration-300 ease-out",
              // Mobile: simpler gradient, Desktop: full gradient
              isMobile 
                ? "bg-blue-500/80" 
                : "bg-gradient-to-b from-cyan-400 via-blue-500 to-purple-600"
            )}
            style={{
              height: `${progressHeight}px`,
              transform: 'translateZ(0)', // GPU acceleration
              willChange: isVisible ? 'height' : 'auto',
              // Mobile optimization: reduce shadow complexity
              boxShadow: isMobile 
                ? isVisible ? '0 0 4px rgba(59, 130, 246, 0.5)' : 'none'
                : isVisible ? '0 0 8px rgba(59, 130, 246, 0.6), 0 0 16px rgba(59, 130, 246, 0.3)' : 'none',
              transition: isMobile 
                ? 'height 0.3s ease-out, box-shadow 0.3s ease-out'
                : 'height 0.5s ease-out, box-shadow 0.5s ease-out'
            }}
          />

          {/* Moving Glow Effect - Only on desktop for performance */}
          {!isMobile && isVisible && (
            <div 
              className="absolute w-2 h-2 -ml-0.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50 animate-pulse"
              style={{
                top: `${progressHeight - 4}px`,
                transform: 'translateZ(0)',
                willChange: 'top',
                transition: 'top 0.5s ease-out'
              }}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div 
        ref={contentRef}
        className="ml-12 sm:ml-20 relative"
        style={{
          transform: 'translateZ(0)', // GPU acceleration for content
        }}
      >
        {children}
      </div>
    </div>
  );
};
