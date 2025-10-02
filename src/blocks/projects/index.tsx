"use client";

import { getProjectsData } from "@/services/projects";
import { ProjectCard } from "@/components/project-card";
import { PageTitle } from "@/components/page-title";

export const ProjectsPage = () => {
  const projectsData = getProjectsData();

  return (
    <>
      <PageTitle title="Projects - AndinoFerdi" />
      <div className="min-h-screen py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
              My Projects
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore my portfolio of innovative projects and cutting-edge solutions.
            </p>
          </div>

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
