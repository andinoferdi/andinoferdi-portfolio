import { type ProjectsData } from "@/types/projects";

export const getProjectsData = (): ProjectsData => {
  return {
    projects: [
      {
        id: "freshko",
        title: "FreshKo",
        description:
          "My workshop course assignment: a modern food delivery platform with real-time inventory management and a seamless user experience.",
        image: "/images/projects/FreshKo.png",
        technologies: ["Next.js", "TypeScript", "Tailwind CSS"],
        liveUrl: "https://freshko.vercel.app",
      },
      {
        id: "portfolio-v2",
        title: "Portfolio V2",
        description:
          "An unfinished personal portfolio website showcasing projects, skills, and professional experience with a modern design.",
        image: "/images/projects/portfolio-v2.png",
        technologies: ["React", "Javascript", "Tailwind CSS"],
        liveUrl: "https://andinoferdi-portfolio-v2.netlify.app/",
      },
      {
        id: "anro-studio",
        title: "Anro Studio",
        description:
          "My workshop course assignment: a creative design studio website that showcases digital solutions, services, and portfolio with a modern UI/UX design and responsive layout.",
        image: "/images/projects/anro.png",
        technologies: ["HTML", "CSS", "Javascript"],
        liveUrl: "https://anrostudio.netlify.app/",
      },
      {
        id: "pet-finder",
        title: "Pet Finder",
        description:
          "My Machine Learning course assignment: AI-powered expert system using forward chaining method to help users find the perfect pet based on their personality and lifestyle through interactive questions with 99% accuracy.",
        image: "/images/projects/pet-finder.png",
        technologies: ["Next.js", "TypeScript", "Tailwind CSS"],
        liveUrl: "https://sistem-pakar-hewan-peliharaan.vercel.app/",
      },
    ],
  };
};
