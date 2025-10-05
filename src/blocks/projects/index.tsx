"use client";

import { getProjectsData } from "@/services/projects";
import { ProjectCard } from "@/components/project-card";
import { PageTitle } from "@/components/page-title";

export const ProjectsPage = () => {
  const projectsData = getProjectsData();

  return (
    <>
      <PageTitle title="Projects - AndinoFerdi" />
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
              All Projects
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Complete portfolio of my innovative projects and cutting-edge solutions.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projectsData.projects.map((project) => (
              <ProjectCard key={project.id} project={project} showCodeButton={true} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
};
