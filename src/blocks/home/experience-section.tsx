"use client";

import React, { memo, useMemo } from "react";
import { TracingBeam } from "@/components/ui/tracing-beam";
import { IconMapPin, IconExternalLink } from "@tabler/icons-react";
import { getAllExperiences } from "@/services/experience";
import { useMobile } from "@/hooks/use-mobile";
import type { ExperienceItem as ExperienceType } from "@/types/experience";

// Memoized experience item component for better performance
const ExperienceItem = memo(({ item, index, getStatusColor, getTypeColor }: {
  item: ExperienceType;
  index: number;
  getStatusColor: (status: string) => string;
  getTypeColor: (type: string) => string;
}) => (
  <div key={`experience-${index}`} className="mb-12 md:mb-16 last:mb-0">
    <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 mb-6">
      <div className="flex-shrink-0 mx-auto sm:mx-0 sm:ml-0">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl p-2 sm:p-3 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.logo}
            alt={`${item.company} logo`}
            className="w-full h-full object-contain"
            loading={index > 1 ? "lazy" : "eager"} // Lazy load after first 2 items
          />
        </div>
      </div>

      <div className="flex-1 w-full sm:ml-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2">
          <h3 className="text-xl sm:text-2xl font-bold dark:text-white mb-2 sm:mb-0">{item.company}</h3>
          <div className="flex items-center gap-2 text-pink-400">
            <IconMapPin className="w-4 h-4" />
            <span className="text-sm font-medium">{item.location}</span>
          </div>
        </div>

        <h4 className="text-lg sm:text-xl dark:text-neutral-300 mb-3">{item.position}</h4>

        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getTypeColor(item.type)}`}>
            <div className="w-2 h-2 rounded-full bg-current"></div>
            {item.type}
          </span>

          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
            {item.status}
          </span>
        </div>

        <div className="flex items-center gap-2 dark:text-neutral-400 text-sm mb-4">
          <span>📅</span>
          <span>{item.duration}</span>
        </div>
      </div>
    </div>

    <div className="bg-gray-900/50 rounded-xl p-4 sm:p-6 mb-6 border border-gray-800">
      <p className="dark:text-neutral-300 leading-relaxed text-sm sm:text-base">{item.description}</p>
    </div>

    {item.achievements.length > 0 && (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🏆</span>
          <h5 className="text-base sm:text-lg font-semibold text-blue-400">Key Achievements</h5>
        </div>
        <ul className="space-y-2 sm:space-y-3">
          {item.achievements.map((achievement: string, achievementIndex: number) => (
            <li key={achievementIndex} className="flex items-start gap-3 dark:text-neutral-300">
              <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0"></div>
              <span className="leading-relaxed text-sm sm:text-base">{achievement}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {item.website && (
      <div className="flex justify-center sm:justify-end">
        <a
          href={item.website}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm sm:text-base"
        >
          <span>🌐</span>
          <span>Visit Website</span>
          <IconExternalLink className="w-4 h-4" />
        </a>
      </div>
    )}
  </div>
));

ExperienceItem.displayName = 'ExperienceItem';

export const ExperienceSection = () => {
  const isMobile = useMobile();
  const experienceData = getAllExperiences();

  // Memoize color functions to prevent recreation on every render
  const getStatusColor = useMemo(() => (status: string) => {
    switch (status) {
      case "Student":
      case "Present":
        return "bg-yellow-900/30 text-yellow-400 border border-yellow-700";
      case "Contract":
        return "bg-green-900/30 text-green-400 border border-green-700";
      case "Full-Time":
        return "bg-blue-900/30 text-blue-400 border border-blue-700";
      case "Internship":
        return "bg-orange-900/30 text-orange-400 border border-orange-700";
      default:
        return "bg-gray-900/30 text-gray-400 border border-gray-700";
    }
  }, []);

  const getTypeColor = useMemo(() => (type: string) => {
    return type === "Education"
      ? "bg-green-900/30 text-green-400 border border-green-700"
      : "bg-blue-900/30 text-blue-400 border border-blue-700";
  }, []);

  return (
    <div className="relative py-12 md:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-5xl font-bold dark:text-white mb-4 md:mb-8">
            Experience & Education
          </h2>
          <p className="max-w-2xl text-sm md:text-lg mt-2 md:mt-4 dark:text-neutral-300 mx-auto px-4">
            My journey through various roles where I&apos;ve learned, contributed, and grown as a software engineer.
          </p>
        </div>

        {/* Conditional rendering: Use TracingBeam on desktop, simple layout on mobile */}
        {!isMobile ? (
          <TracingBeam className="px-4 sm:px-8">
            <div className="max-w-4xl mx-auto antialiased pt-4 relative">
              {experienceData.map((item, index) => (
                <ExperienceItem
                  key={`experience-${index}`}
                  item={item}
                  index={index}
                  getStatusColor={getStatusColor}
                  getTypeColor={getTypeColor}
                />
              ))}
            </div>
          </TracingBeam>
        ) : (
          <div className="px-4 sm:px-8">
            <div className="max-w-4xl mx-auto antialiased pt-4 relative">
              {experienceData.map((item, index) => (
                <ExperienceItem
                  key={`experience-${index}`}
                  item={item}
                  index={index}
                  getStatusColor={getStatusColor}
                  getTypeColor={getTypeColor}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExperienceSection;
