"use client";

import React from "react";
import { HeroSection } from "./hero-section";
import { heroProducts } from "@/data/hero";


export function HeroContent() {
  return <HeroSection products={heroProducts} />;
}

export { HeroSection } from "./hero-section";
export { heroProducts, heroTestimonials, heroTextFlipWords } from "@/data/hero";
export type { ProductItem, Testimonial, HeroParallaxProps } from "@/types/hero";


export default HeroContent;
