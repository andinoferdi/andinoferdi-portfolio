"use client";

import React from "react";
import { 
  IconBrandNextjs, 
  IconBrandReact, 
  IconBrandVue, 
  IconBrandJavascript, 
  IconBrandTypescript, 
  IconBrandTailwind, 
  IconBrandMongodb, 
  IconBrandNodejs, 
  IconBrandPython, 
  IconBrandHtml5, 
  IconBrandCss3,
  IconBrandGoogle
} from "@tabler/icons-react";

interface TechIconsProps {
  technologies: string[];
  className?: string;
}

const techIconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  nextjs: IconBrandNextjs,
  react: IconBrandReact,
  vue: IconBrandVue,
  javascript: IconBrandJavascript,
  typescript: IconBrandTypescript,
  tailwindcss: IconBrandTailwind,
  mongodb: IconBrandMongodb,
  nodejs: IconBrandNodejs,
  python: IconBrandPython,
  html: IconBrandHtml5,
  css: IconBrandCss3,
  tensorflow: IconBrandGoogle,
};

const techColors: Record<string, string> = {
  nextjs: "text-black dark:text-white",
  react: "text-blue-500",
  vue: "text-green-500",
  javascript: "text-yellow-500",
  typescript: "text-blue-600",
  tailwindcss: "text-cyan-500",
  mongodb: "text-green-600",
  nodejs: "text-green-700",
  python: "text-yellow-600",
  html: "text-orange-500",
  css: "text-blue-400",
  tensorflow: "text-orange-600",
};

export const TechIcons = ({ technologies, className = "" }: TechIconsProps) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {technologies.map((tech) => {
        const IconComponent = techIconMap[tech];
        const colorClass = techColors[tech] || "text-gray-500";
        
        if (!IconComponent) return null;
        
        return (
          <div
            key={tech}
            className={`flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 ${colorClass}`}
            role="img"
            aria-label={`${tech.charAt(0).toUpperCase() + tech.slice(1)} technology`}
          >
            <IconComponent size={16} aria-hidden="true" />
          </div>
        );
      })}
    </div>
  );
};
