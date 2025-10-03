"use client";

import React, { useEffect, useRef } from "react";

interface BlobEffectsProps {
  className?: string;
}

export const BlobEffects = ({ className }: BlobEffectsProps) => {
  const blobRefs = useRef<(HTMLDivElement | null)[]>([]);

  const setBlobRef = (index: number) => (ref: HTMLDivElement | null) => {
    blobRefs.current[index] = ref;
  };

  useEffect(() => {
    let ticking = false;

    const updateBlobs = () => {
      const scrollY = window.scrollY;
      const isMobile = window.innerWidth < 768;

      blobRefs.current.forEach((blob, index) => {
        if (!blob) return;
        
        const speed = 0.5 + index * 0.2;
        const amplitude = isMobile ? 30 + index * 15 : 50 + index * 20;
        
        // More dynamic movements
        const xOffset = Math.sin(scrollY * speed * 0.01 + index) * amplitude;
        const yOffset = Math.cos(scrollY * speed * 0.01 + index) * (amplitude * 0.6);

        // Apply transformation
        blob.style.transform = `translate3d(${xOffset}px, ${yOffset}px, 0)`;
        blob.style.transition = "transform 0.3s ease-out";
      });

      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateBlobs);
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    
    // Initial call to position blobs
    updateBlobs();
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className={`fixed inset-0 pointer-events-none -z-10 ${className}`}>
      {/* Blue blob - top left */}
      <div
        ref={setBlobRef(0)}
        className="absolute top-0 -left-4 md:w-96 md:h-96 w-72 h-72 bg-blue-500 dark:bg-blue-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-15 dark:opacity-10 animate-blob"
        style={{
          animation: "blob 6s ease-in-out infinite"
        }}
      />
      
      {/* Sky blue blob - top right */}
      <div
        ref={setBlobRef(1)}
        className="absolute top-0 -right-4 w-72 h-72 md:w-96 md:h-96 bg-sky-500 dark:bg-sky-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-15 dark:opacity-10"
        style={{
          animation: "blob 8s ease-in-out infinite 2s"
        }}
      />
      
      {/* Indigo blob - bottom left */}
      <div
        ref={setBlobRef(2)}
        className="absolute -bottom-8 left-[-40%] md:left-20 w-72 h-72 md:w-96 md:h-96 bg-indigo-500 dark:bg-indigo-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-15 dark:opacity-10"
        style={{
          animation: "blob 7s ease-in-out infinite 4s"
        }}
      />
      
      {/* Cyan blob - bottom right */}
      <div
        ref={setBlobRef(3)}
        className="absolute -bottom-10 right-4 md:right-20 w-72 h-72 md:w-96 md:h-96 bg-cyan-500 dark:bg-cyan-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-12 dark:opacity-8"
        style={{
          animation: "blob 9s ease-in-out infinite 1s"
        }}
      />
    </div>
  );
};
