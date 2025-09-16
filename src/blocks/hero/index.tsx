/**
 * Hero Block - Entry Point
 * Clean architecture for hero section with separated concerns
 */

"use client";

import React from "react";
import { HeroSection } from "./hero-section";
import { heroProducts } from "./data";

/**
 * Main Hero Component Export
 * This is the primary export used by pages
 */
export function HeroContent() {
  return <HeroSection products={heroProducts} />;
}

/**
 * Re-exports for external use
 */
export { HeroSection } from "./hero-section";
export { heroProducts, heroTestimonials, heroTextFlipWords } from "./data";
export type { ProductItem, Testimonial, HeroParallaxProps } from "./types";

/**
 * Default export (for convenience)
 */
export default HeroContent;
