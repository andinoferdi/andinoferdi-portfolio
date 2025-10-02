"use client";

import { getProjectsData } from "@/services/projects";
import { ProjectCard } from "@/components/project-card";
import { PageTitle } from "@/components/page-title";

export const ProjectsPage = () => {
  const projectsData = getProjectsData();

  return (
    <>
      <PageTitle title="Projects - AndinoFerdi" />
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projectsData.projects.map((project) => (
              <ProjectCard key={project.id} project={project} showCodeButton={false} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
