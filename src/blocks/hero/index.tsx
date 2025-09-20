"use client";

import React from "react";
import { HeroSection } from "./hero-section";


export function HeroContent() {
  return <HeroSection />;
}

export { HeroSection } from "./hero-section";
export { heroTestimonials, heroTextFlipWords } from "@/data/hero";
export type { Testimonial } from "@/types/hero";


export default HeroContent;
