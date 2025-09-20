"use client";

import React from "react";
import { HeroSection } from "./hero-section";
import { ExperienceSection } from "./experience-section";


export function HeroContent() {
  return (
    <>
      <HeroSection />
      <ExperienceSection />
    </>
  );
}

export { HeroSection } from "./hero-section";
export { ExperienceSection } from "./experience-section";
export { heroTestimonials, heroTextFlipWords } from "@/data/hero";
export type { Testimonial } from "@/types/hero";


export default HeroContent;
