"use client";

import { IconBrandReact, IconBrandTypescript, IconBrandTailwind, IconBrandHtml5, IconBrandCss3, IconBrandJavascript, IconBrandSvelte, IconBrandThreejs, IconBrandLaravel, IconBrandPhp, IconBrandMysql, IconBrandNodejs, IconBrandMongodb, IconBrandGit, IconBrandBootstrap, IconBrandVue } from "@tabler/icons-react";

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
  "PostgreSQL": () => <span className="text-blue-600 dark:text-blue-400 font-bold text-xs">🐘</span>,
  
  "Git": IconBrandGit,
  "REST APIs": () => <span className="text-green-600 dark:text-green-400 font-bold text-xs">🔗</span>,
  "Agile": () => <span className="text-orange-600 dark:text-orange-400 font-bold text-xs">⚡</span>,
  "Blade": () => <span className="text-red-600 dark:text-red-400 font-bold text-xs">🔪</span>,
};

interface TechnologyIconProps {
  technology: string;
  className?: string;
}

export const TechnologyIcon = ({ technology, className = "h-3 w-3" }: TechnologyIconProps) => {
  const IconComponent = technologyIcons[technology];
  
  if (!IconComponent) {
    return <span className="text-muted-foreground">🔧</span>;
  }
  
  return <IconComponent className={className} />;
};

export { technologyIcons };
