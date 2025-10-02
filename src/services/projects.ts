import { type ProjectsData } from "@/types/projects";

export const getProjectsData = (): ProjectsData => {
  return {
    projects: [
      {
        id: "freshko",
        title: "FreshKo",
        description:
          "My college workshop assignment: a modern food delivery platform with real-time inventory management and a seamless user experience.",
        image: "/images/projects/FreshKo.webp",
        technologies: ["Next.js", "TypeScript", "Tailwind CSS"],
        liveUrl: "https://freshko.vercel.app",
        githubUrl: "https://github.com/andinoferdi/freshko",
      },
      {
        id: "portfolio-v2",
        title: "Portfolio V2",
        description:
          "An unfinished personal portfolio website showcasing projects, skills, and professional experience with a modern design.",
        image: "/images/projects/portfolio-v2.webp",
        technologies: ["React", "Javascript", "Tailwind CSS"],
        liveUrl: "https://andinoferdi-portfolio-v2.netlify.app/",
        githubUrl: "https://github.com/andinoferdi/portfolio-v2",
      },
      {
        id: "anro-studio",
        title: "Anro Studio",
        description:
          "My workshop assignment: a creative design studio website that showcases digital solutions, services, and portfolio with a modern UI/UX design and responsive layout.",
        image: "/images/projects/anro.webp",
        technologies: ["HTML", "CSS", "TypeScript"],
        liveUrl: "https://anrostudio.netlify.app/",
        githubUrl: "https://github.com/andinoferdi/anro-studio",
      },
    ],
  };
};
