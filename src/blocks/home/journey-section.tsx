"use client";

import { Timeline } from "@/components/ui/timeline";
import { getExperienceData } from "@/services/journey";
import { type Experience } from "@/types/journey";
import { TechnologyIcon } from "@/components/ui/technology-icon";
import { Calendar, MapPin, Building2, Award, ExternalLink } from "lucide-react";
import Image from "next/image";

const ExperienceTimelineEntry = ({ experience }: { experience: Experience }) => {
  return (
    <div className="space-y-4 bg-background/90 backdrop-blur-md border border-border/60 rounded-xl p-6 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="flex items-center gap-3">
          {experience.logo ? (
            <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-background/90 backdrop-blur-md border border-border/60 flex items-center justify-center">
              <Image
                src={experience.logo}
                alt={`${experience.company} logo`}
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <Building2 className="h-5 w-5 text-primary" />
          )}
          <div>
            <h3 className="text-xl font-bold text-foreground">
              {experience.title}
            </h3>
            <div className="flex items-center gap-2">
              <p className="text-lg text-muted-foreground">
                {experience.company}
              </p>
              {experience.website && (
                <a
                  href={experience.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                  title={`Visit ${experience.company} website`}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col md:items-end gap-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{experience.period.start} - {experience.period.end}</span>
            {experience.current && (
              <span className="inline-flex items-center rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30 text-primary px-2 py-1 text-xs font-semibold">
                Current
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{experience.location}</span>
          </div>
        </div>
      </div>

      <p className="text-muted-foreground leading-relaxed">
        {experience.description}
      </p>

      {experience.achievements.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            <h4 className="font-semibold text-foreground">Key Achievements</h4>
          </div>
          <ul className="space-y-1 ml-6">
            {experience.achievements.map((achievement, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{achievement}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

              {experience.technologies.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {experience.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/60 backdrop-blur-sm px-2 py-1 text-xs font-medium text-foreground hover:bg-background/80 transition-colors"
                    >
                      <TechnologyIcon technology={tech} className="h-3 w-3" />
                      {tech}
                    </span>
                  ))}
                </div>
              )}
    </div>
  );
};

export const ExperienceSection = () => {
  const experienceData = getExperienceData();

  const timelineData = experienceData.experiences.map((experience) => ({
    title: `${experience.period.start} - ${experience.period.end}`,
    content: <ExperienceTimelineEntry experience={experience} />,
  }));

  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
            My Journey
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A timeline of my professional experience, projects, and growth as a developer.
          </p>
        </div>

        <Timeline data={timelineData} />
      </div>
    </section>
  );
};
