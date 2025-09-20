import { ExperienceItem } from "@/types/experience";
import { experienceData } from "@/data/experience";

export const getAllExperiences = (): ExperienceItem[] => {
  return experienceData;
};

export const getWorkExperiences = (): ExperienceItem[] => {
  return experienceData.filter(experience => experience.type === "Work");
};

export const getEducationExperiences = (): ExperienceItem[] => {
  return experienceData.filter(experience => experience.type === "Education");
};

export const getCurrentExperiences = (): ExperienceItem[] => {
  return experienceData.filter(experience => 
    experience.duration.includes("Present")
  );
};

export const getExperienceByCompany = (company: string): ExperienceItem | undefined => {
  return experienceData.find(experience => 
    experience.company.toLowerCase() === company.toLowerCase()
  );
};

export const validateExperience = (experience: ExperienceItem): boolean => {
  return !!(
    experience.company &&
    experience.position &&
    experience.location &&
    experience.duration &&
    experience.type &&
    experience.status &&
    experience.description &&
    experience.logo &&
    experience.company.trim().length > 0 &&
    experience.position.trim().length > 0 &&
    experience.description.trim().length > 0
  );
};
