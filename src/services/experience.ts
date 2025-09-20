import type { ExperienceItem } from '@/types/experience';
import { experienceData, experienceSection } from '@/data/experience';

// Memoized and cached data to prevent unnecessary re-computations
let cachedExperiences: ExperienceItem[] | null = null;
let cachedSortedExperiences: ExperienceItem[] | null = null;

export const getAllExperiences = (): ExperienceItem[] => {
  if (cachedExperiences === null) {
    cachedExperiences = [...experienceData];
  }
  return cachedExperiences;
};

export const getSortedExperiences = (): ExperienceItem[] => {
  if (cachedSortedExperiences === null) {
    cachedSortedExperiences = [...experienceData].sort((a, b) => {
      // Sort by start date (newest first)
      if (b.startDate === a.startDate) {
        return b.endDate.localeCompare(a.endDate);
      }
      return b.startDate.localeCompare(a.startDate);
    });
  }
  return cachedSortedExperiences;
};

export const getExperienceById = (id: string): ExperienceItem | undefined => {
  return getAllExperiences().find(exp => exp.id === id);
};

export const getExperiencesByType = (type: 'Education' | 'Work'): ExperienceItem[] => {
  return getAllExperiences().filter(exp => exp.type === type);
};

export const getExperienceSection = () => experienceSection;

// Utility functions for performance optimization
export const getStatusColor = (status: string): string => {
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
};

export const getTypeColor = (type: string): string => {
  return type === "Education"
    ? "bg-green-900/30 text-green-400 border border-green-700"
    : "bg-blue-900/30 text-blue-400 border border-blue-700";
};
