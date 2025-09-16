"use client";
import React from "react";
import { HeroParallaxDemo } from "./HeroParallaxDemo";

export function ResponsiveHeroWrapper() {
  return (
    <div className="w-full min-h-screen relative overflow-x-hidden">
      <HeroParallaxDemo />
    </div>
  );
}
