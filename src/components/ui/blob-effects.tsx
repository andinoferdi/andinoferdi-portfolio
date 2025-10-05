"use client";

import React, { useEffect, useRef, useState } from "react";

interface BlobEffectsProps {
  className?: string;
}

export const BlobEffects = ({ className }: BlobEffectsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLowEnd, setIsLowEnd] = useState(false);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    const checkDevice = () => {
      const isMobile = window.innerWidth < 768;
      const cores = navigator.hardwareConcurrency || 2;
      const isLowEndDevice = isMobile && cores <= 4;
      setIsLowEnd(isLowEndDevice);
    };

    checkDevice();
  }, []);

  useEffect(() => {
    if (isLowEnd || !containerRef.current) return;

    const container = containerRef.current;
    const blobs = container.querySelectorAll<HTMLDivElement>("[data-blob]");
    const isMobile = window.innerWidth < 768;
    const throttleMs = isMobile ? 50 : 16;

    const updateBlobs = (timestamp: number) => {
      if (timestamp - lastUpdateRef.current < throttleMs) return;
      lastUpdateRef.current = timestamp;

      const scrollY = window.scrollY;
      const scrollFactor = scrollY * 0.001;

      blobs.forEach((blob, index) => {
        const speed = 0.3 + index * 0.1;
        const amplitude = isMobile ? 15 + index * 5 : 30 + index * 10;
        const phase = index * 1.57;

        const x = Math.sin(scrollFactor * speed + phase) * amplitude;
        const y = Math.cos(scrollFactor * speed + phase) * amplitude * 0.5;

        blob.style.setProperty("--x", `${x}px`);
        blob.style.setProperty("--y", `${y}px`);
      });
    };

    let rafId: number;
    const handleScroll = () => {
      rafId = requestAnimationFrame(updateBlobs);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateBlobs(0);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isLowEnd]);

  if (isLowEnd) return null;

  const isMobileClass = "md:w-96 md:h-96 w-64 h-64";
  const baseClass =
    "absolute rounded-full mix-blend-multiply pointer-events-none";
  const mobileBlur = "blur-[60px] md:blur-[100px]";
  const transformStyle = {
    transform: "translate3d(var(--x, 0), var(--y, 0), 0)",
    willChange: "transform",
  };

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none -z-10 overflow-hidden ${className}`}
    >
      <div
        data-blob
        className={`${baseClass} ${isMobileClass} ${mobileBlur} top-0 -left-4 bg-blue-600 dark:bg-blue-500 opacity-10 dark:opacity-8`}
        style={transformStyle}
      />

      <div
        data-blob
        className={`${baseClass} ${isMobileClass} ${mobileBlur} top-0 -right-4 bg-indigo-600 dark:bg-indigo-500 opacity-10 dark:opacity-8`}
        style={transformStyle}
      />

      <div
        data-blob
        className={`${baseClass} ${isMobileClass} ${mobileBlur} -bottom-8 left-0 md:left-20 bg-purple-600 dark:bg-purple-500 opacity-10 dark:opacity-8`}
        style={transformStyle}
      />

      <div
        data-blob
        className={`${baseClass} ${isMobileClass} ${mobileBlur} -bottom-10 right-4 md:right-20 bg-violet-600 dark:bg-violet-500 opacity-9 dark:opacity-6`}
        style={transformStyle}
      />

      <div
        data-blob
        className={`${baseClass} w-0 md:w-80 h-0 md:h-80 blur-[90px] top-1/2 -left-8 bg-blue-700 dark:bg-blue-600 opacity-8 dark:opacity-5 hidden md:block`}
        style={transformStyle}
      />

      <div
        data-blob
        className={`${baseClass} w-0 md:w-80 h-0 md:h-80 blur-[90px] top-1/2 -right-8 bg-slate-600 dark:bg-slate-500 opacity-8 dark:opacity-5 hidden md:block`}
        style={transformStyle}
      />

      <div
        data-blob
        className={`${baseClass} w-0 md:w-72 h-0 md:h-72 blur-[80px] top-1/4 left-1/2 -translate-x-1/2 bg-indigo-500 dark:bg-indigo-400 opacity-6 dark:opacity-4 hidden md:block`}
        style={transformStyle}
      />

      <div
        data-blob
        className={`${baseClass} w-0 md:w-72 h-0 md:h-72 blur-[80px] bottom-1/4 left-1/2 -translate-x-1/2 bg-purple-500 dark:bg-purple-400 opacity-6 dark:opacity-4 hidden md:block`}
        style={transformStyle}
      />
    </div>
  );
};
