"use client";

import { 
  IconBrandReact, 
  IconBrandTypescript, 
  IconBrandTailwind, 
  IconBrandHtml5, 
  IconBrandCss3, 
  IconBrandJavascript, 
  IconBrandSvelte, 
  IconBrandThreejs, 
  IconBrandLaravel, 
  IconBrandPhp, 
  IconBrandMysql, 
  IconBrandNodejs, 
  IconBrandMongodb, 
  IconBrandGit, 
  IconBrandBootstrap, 
  IconBrandVue,
  IconDatabase,
  IconApi,
  IconBolt,
  IconCode,
  IconTools
} from "@tabler/icons-react";

const technologyIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "Next.js": () => <span className="text-black dark:text-white font-bold text-xs">N</span>,
  "TypeScript": IconBrandTypescript,
  "Tailwind CSS": IconBrandTailwind,
  "React": IconBrandReact,
  "HTML": IconBrandHtml5,
  "CSS": IconBrandCss3,
  "Javascript": IconBrandJavascript,
  "JavaScript": IconBrandJavascript,
  "Svelte": IconBrandSvelte,
  "Three.js": IconBrandThreejs,
  "Bootstrap": IconBrandBootstrap,
  "Laravel": IconBrandLaravel,
  "PHP": IconBrandPhp,
  "Node.js": IconBrandNodejs,
  "Vue.js": IconBrandVue,
  "MySQL": IconBrandMysql,
  "MongoDB": IconBrandMongodb,
  "PostgreSQL": IconDatabase,
  "Git": IconBrandGit,
  "REST APIs": IconApi,
  "Agile": IconBolt,
  "Blade": IconCode,
};

interface TechnologyIconProps {
  technology: string;
  className?: string;
}

export const TechnologyIcon = ({ technology, className = "h-3 w-3" }: TechnologyIconProps) => {
  const IconComponent = technologyIcons[technology];
  
  if (!IconComponent) {
    return <IconTools className={`${className} text-muted-foreground`} />;
  }
  
  return <IconComponent className={className} />;
};

export { technologyIcons };
