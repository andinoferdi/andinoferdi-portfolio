"use client";

import { TechnologyIcon } from "@/components/ui/technology-icon";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";
import { ExternalLink, Github } from "lucide-react";
import Image from "next/image";
import { type Project } from "@/types/projects";

interface ProjectCardProps {
  project: Project;
  showCodeButton?: boolean;
}

export const ProjectCard = ({ project, showCodeButton = true }: ProjectCardProps) => {
  return (
    <CardContainer className="group">
      <CardBody className="bg-card border border-border rounded-xl p-6 h-full flex flex-col">
        <CardItem translateZ="50" className="mb-4">
          <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
            <Image
              src={project.image}
              alt={project.title}
              width={400}
              height={240}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="w-full h-full object-cover"
            />
          </div>
        </CardItem>

        <CardItem translateZ="60" className="flex-1 flex flex-col">
          <h3 className="text-xl font-bold text-foreground mb-2">
            {project.title}
          </h3>
          <p className="text-muted-foreground text-sm mb-4 flex-1">
            {project.description}
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {project.technologies.map((tech) => (
              <span
                key={tech}
                className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-xs text-muted-foreground"
              >
                <TechnologyIcon technology={tech} className="h-3 w-3" />
                {tech}
              </span>
            ))}
          </div>

          <div className="flex gap-2 mt-auto">
            <CardItem translateZ="100" className="flex-1">
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors w-full"
              >
                <ExternalLink className="h-4 w-4" />
                Live Demo
              </a>
            </CardItem>
            
            {showCodeButton && project.githubUrl && (
              <CardItem translateZ="100">
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Github className="h-4 w-4" />
                  Code
                </a>
              </CardItem>
            )}
          </div>
        </CardItem>
      </CardBody>
    </CardContainer>
  );
};
