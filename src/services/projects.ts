import { ProjectItem } from "@/types/projects";
import { projectsItem } from "@/data/projects";

export const getAllProjects = (): ProjectItem[] => {
  return projectsItem;
};

export const getFeaturedProjects = (): ProjectItem[] => {
  return projectsItem.slice(0, 3);
};

export const getProjectsByTechnology = (technology: string): ProjectItem[] => {
  return projectsItem.filter(project => 
    project.technologies.includes(technology.toLowerCase())
  );
};


export const getProjectByTitle = (title: string): ProjectItem | undefined => {
  return projectsItem.find(project => 
    project.title.toLowerCase() === title.toLowerCase()
  );
};


export const validateProject = (project: ProjectItem): boolean => {
  return !!(
    project.title &&
    project.link &&
    project.thumbnail &&
    project.technologies &&
    project.title.trim().length > 0 &&
    project.link.startsWith('http') &&
    project.technologies.length > 0
  );
};
