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
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollProgress = scrollY / (documentHeight - windowHeight);
      const isMobile = window.innerWidth < 768;

      blobRefs.current.forEach((blob, index) => {
        if (!blob) return;

        // Variasi speed dan amplitude untuk setiap blob
        const speed = 0.3 + index * 0.15;
        const amplitude = isMobile ? 25 + index * 10 : 40 + index * 15;

        // Variasi pola gerakan untuk setiap blob
        const phase = (index * Math.PI) / 2; // 90 derajat offset per blob
        const xOffset = Math.sin(scrollY * speed * 0.01 + phase) * amplitude;
        const yOffset =
          Math.cos(scrollY * speed * 0.01 + phase) * (amplitude * 0.7);

        // Opacity berdasarkan scroll progress dengan variasi
        const baseOpacity = 0.08 + index * 0.02;
        const scrollOpacity = Math.sin(scrollProgress * Math.PI + index) * 0.05;
        const finalOpacity = Math.max(
          0.05,
          Math.min(0.15, baseOpacity + scrollOpacity)
        );

        blob.style.transform = `translate3d(${xOffset}px, ${yOffset}px, 0) scale(${
          1 + scrollProgress * 0.1
        })`;
        blob.style.opacity = finalOpacity.toString();
        blob.style.transition =
          "transform 0.4s ease-out, opacity 0.3s ease-out";
      });

      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateBlobs);
        ticking = true;
      }
    };

    const handleResize = () => {
      updateBlobs();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });

    updateBlobs();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className={`fixed inset-0 pointer-events-none -z-10 ${className}`}>
      {/* Deep Blue blob - top left */}
      <div
        ref={setBlobRef(0)}
        className="absolute top-0 -left-4 md:w-96 md:h-96 w-72 h-72 bg-blue-600 dark:bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-10 dark:opacity-8"
        style={{
          animation: "blob 6s ease-in-out infinite",
        }}
      />

      {/* Indigo blob - top right */}
      <div
        ref={setBlobRef(1)}
        className="absolute top-0 -right-4 w-72 h-72 md:w-96 md:h-96 bg-indigo-600 dark:bg-indigo-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-10 dark:opacity-8"
        style={{
          animation: "blob 8s ease-in-out infinite 2s",
        }}
      />

      {/* Purple blob - bottom left */}
      <div
        ref={setBlobRef(2)}
        className="absolute -bottom-8 left-[-40%] md:left-20 w-72 h-72 md:w-96 md:h-96 bg-purple-600 dark:bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-10 dark:opacity-8"
        style={{
          animation: "blob 7s ease-in-out infinite 4s",
        }}
      />

      {/* Violet blob - bottom right */}
      <div
        ref={setBlobRef(3)}
        className="absolute -bottom-10 right-4 md:right-20 w-72 h-72 md:w-96 md:h-96 bg-violet-600 dark:bg-violet-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-9 dark:opacity-6"
        style={{
          animation: "blob 9s ease-in-out infinite 1s",
        }}
      />

      {/* Navy blob - center left */}
      <div
        ref={setBlobRef(4)}
        className="absolute top-1/2 -left-8 md:w-80 md:h-80 w-64 h-64 bg-blue-700 dark:bg-blue-600 rounded-full mix-blend-multiply filter blur-[120px] opacity-8 dark:opacity-5"
        style={{
          animation: "blob 10s ease-in-out infinite 3s",
        }}
      />

      {/* Slate blob - center right */}
      <div
        ref={setBlobRef(5)}
        className="absolute top-1/2 -right-8 md:w-80 md:h-80 w-64 h-64 bg-slate-600 dark:bg-slate-500 rounded-full mix-blend-multiply filter blur-[120px] opacity-8 dark:opacity-5"
        style={{
          animation: "blob 12s ease-in-out infinite 5s",
        }}
      />

      {/* Indigo light blob - center top */}
      <div
        ref={setBlobRef(6)}
        className="absolute top-1/4 left-1/2 transform -translate-x-1/2 md:w-72 md:h-72 w-56 h-56 bg-indigo-500 dark:bg-indigo-400 rounded-full mix-blend-multiply filter blur-[110px] opacity-6 dark:opacity-4"
        style={{
          animation: "blob 11s ease-in-out infinite 1.5s",
        }}
      />

      {/* Purple light blob - center bottom */}
      <div
        ref={setBlobRef(7)}
        className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 md:w-72 md:h-72 w-56 h-56 bg-purple-500 dark:bg-purple-400 rounded-full mix-blend-multiply filter blur-[110px] opacity-6 dark:opacity-4"
        style={{
          animation: "blob 13s ease-in-out infinite 6s",
        }}
      />
    </div>
  );
};
