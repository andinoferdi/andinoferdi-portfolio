"use client";

import React from "react";
import { TracingBeam } from "@/components/ui/tracing-beam";
import { IconMapPin, IconExternalLink } from "@tabler/icons-react";
import { 
  getSortedExperiences, 
  getExperienceSection,
  getStatusColor,
  getTypeColor
} from "@/services/experience";
import { useMobile } from "@/hooks/use-mobile";
import type { ExperienceItem } from "@/types/experience";

const CompanyLogo = ({ 
  logo, 
  company, 
  index 
}: { 
  logo: string; 
  company: string; 
  index: number;
}) => (
  <div className="flex-shrink-0 mx-auto sm:mx-0 sm:ml-0">
    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl p-2 sm:p-3 flex items-center justify-center">
      <img
        src={logo}
        alt={`${company} logo`}
        className="w-full h-full object-contain"
        loading="lazy"
        style={{
          transform: 'translateZ(0)', // GPU acceleration
        }}
      />
    </div>
  </div>
);

const StatusBadge = ({ 
  type, 
  status, 
  getTypeColor, 
  getStatusColor 
}: {
  type: string;
  status: string;
  getTypeColor: (type: string) => string;
  getStatusColor: (status: string) => string;
}) => (
  <div className="flex flex-wrap gap-2 mb-3">
    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getTypeColor(type)}`}>
      <div className="w-2 h-2 rounded-full bg-current"></div>
      {type}
    </span>
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {status}
    </span>
  </div>
);

const AchievementsList = ({ achievements }: { achievements: string[] }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2 mb-4">
      <span className="text-lg">🏆</span>
      <h5 className="text-base sm:text-lg font-semibold text-blue-400">Key Achievements</h5>
    </div>
    <ul className="space-y-2 sm:space-y-3">
      {achievements.map((achievement, achievementIndex) => (
        <li key={achievementIndex} className="flex items-start gap-3 dark:text-neutral-300">
          <div 
            className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0"
            style={{ transform: 'translateZ(0)' }}
          ></div>
          <span className="leading-relaxed text-sm sm:text-base">{achievement}</span>
        </li>
      ))}
    </ul>
  </div>
);

const WebsiteLink = ({ website }: { website: string }) => (
  <div className="flex justify-center sm:justify-end">
    <a
      href={website}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm sm:text-base"
      style={{
        transform: 'translateZ(0)', // GPU acceleration
        willChange: 'background-color'
      }}
    >
      <span>🌐</span>
      <span>Visit Website</span>
      <IconExternalLink className="w-4 h-4" />
    </a>
  </div>
);

const ExperienceItem = ({ 
  item, 
  index,
  isMobile
}: {
  item: ExperienceItem;
  index: number;
  isMobile: boolean;
}) => (
  <div 
    className="mb-12 md:mb-16 last:mb-0"
    style={{
      transform: 'translateZ(0)', // GPU acceleration
      // Mobile optimization: reduce compositing layers
      contain: isMobile ? 'layout' : 'none',
    }}
  >
    <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 mb-6">
      <CompanyLogo logo={item.logo} company={item.company} index={index} />

      <div className="flex-1 w-full sm:ml-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2">
          <h3 className="text-xl sm:text-2xl font-bold dark:text-white mb-2 sm:mb-0">
            {item.company}
          </h3>
          <div className="flex items-center gap-2 text-pink-400">
            <IconMapPin className="w-4 h-4" />
            <span className="text-sm font-medium">{item.location}</span>
          </div>
        </div>

        <h4 className="text-lg sm:text-xl dark:text-neutral-300 mb-3">
          {item.position}
        </h4>

        <StatusBadge
          type={item.type}
          status={item.status}
          getTypeColor={getTypeColor}
          getStatusColor={getStatusColor}
        />

        <div className="flex items-center gap-2 dark:text-neutral-400 text-sm mb-4">
          <span>📅</span>
          <span>{item.duration}</span>
        </div>
      </div>
    </div>

    {/* Description Card */}
    <div 
      className="bg-gray-900/50 rounded-xl p-4 sm:p-6 mb-6 border border-gray-800"
      style={{
        transform: 'translateZ(0)', // GPU acceleration
        backfaceVisibility: 'hidden', // Prevent flickering on mobile
      }}
    >
      <p className="dark:text-neutral-300 leading-relaxed text-sm sm:text-base">
        {item.description}
      </p>
    </div>

    {/* Achievements */}
    {item.achievements.length > 0 && (
      <AchievementsList achievements={item.achievements} />
    )}

    {/* Website Link */}
    {item.website && (
      <WebsiteLink website={item.website} />
    )}
  </div>
);

export const ExperienceSection = () => {
  const isMobile = useMobile();
  
  const experienceData = getSortedExperiences();
  const sectionInfo = getExperienceSection();

  return (
    <div 
      className="relative py-12 md:py-20"
      style={{
        transform: 'translateZ(0)', // GPU acceleration for entire section
        // Mobile optimization
        contain: isMobile ? 'layout' : 'none',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 
            className="text-2xl md:text-5xl font-bold dark:text-white mb-4 md:mb-8"
            style={{ transform: 'translateZ(0)' }}
          >
            {sectionInfo.title}
          </h2>
          <p 
            className="max-w-2xl text-sm md:text-lg mt-2 md:mt-4 dark:text-neutral-300 mx-auto px-4"
            style={{ transform: 'translateZ(0)' }}
          >
            {sectionInfo.subtitle}
          </p>
        </div>

        {/* Experience Timeline with TracingBeam */}
        <TracingBeam className="px-4 sm:px-8">
          <div 
            className="max-w-4xl mx-auto antialiased pt-4 relative"
            style={{
              // Mobile optimization: improve scrolling performance
              transform: 'translateZ(0)',
              willChange: isMobile ? 'auto' : 'scroll-position',
            }}
          >
            {experienceData.map((item, index) => (
              <ExperienceItem
                key={item.id}
                item={item}
                index={index}
                isMobile={isMobile}
              />
            ))}
          </div>
        </TracingBeam>
      </div>
    </div>
  );
};

export default ExperienceSection;
