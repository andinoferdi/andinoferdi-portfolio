"use client";

import { 
  IconBrandReact, 
  IconBrandTailwind, 
  IconBrandHtml5, 
  IconBrandCss3, 
  IconBrandJavascript, 
  IconBrandLaravel, 
  IconBrandPhp, 
  IconBrandMysql, 
  IconBrandNodejs, 
  IconBrandMongodb, 
  IconBrandBootstrap, 
  IconBrandVue,
  IconBrandFigma,
  IconBrandFlutter,
  IconDatabase,
  IconCode,
  IconTools,
  IconBrandPython,
  IconBrandFirebase,
  IconBrandVercel,
  IconBrandSass,
  IconBrandVite,
  IconBrandAdobePhotoshop,
  IconBrandAdobeIllustrator,
  IconBrandAdobePremier,
  IconBrandAdobeXd
} from "@tabler/icons-react";

const technologyIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  // Frameworks
  "Next.js": () => (
    <div className="flex h-4 w-4 items-center justify-center rounded bg-black text-white font-bold text-xs">
      N
    </div>
  ),
  "Tailwind CSS": IconBrandTailwind,
  "Bootstrap": IconBrandBootstrap,
  "Laravel": IconBrandLaravel,
  "Vue.js": IconBrandVue,
  "Flutter": IconBrandFlutter,
  "Vite": IconBrandVite,
  "Nuxt.js": IconBrandVue,
  
  // Frontend
  "HTML": IconBrandHtml5,
  "CSS": IconBrandCss3,
  "JavaScript": IconBrandJavascript,
  "Sass": IconBrandSass,
  "jQuery": IconCode,
  "React.js": IconBrandReact,
  
  // Backend
  "PHP": IconBrandPhp,
  "Node.js": IconBrandNodejs,
  "Python": IconBrandPython,
  "Java": IconCode,
  "Firebase": IconBrandFirebase,
  "Golang": IconCode,
  
  // Databases
  "MySQL": IconBrandMysql,
  "MongoDB": IconBrandMongodb,
  "MariaDB": IconDatabase,
  "PostgreSQL": IconDatabase,
  "SQLite": IconDatabase,
  
  // Design Tools
  "Figma": IconBrandFigma,
  "Adobe Illustrator": IconBrandAdobeIllustrator,
  "Adobe Photoshop": IconBrandAdobePhotoshop,
  "Adobe Premiere Pro": IconBrandAdobePremier,
  "Adobe Audition": IconBrandAdobeXd,
  
  // Others
  "Netlify": IconTools,
  "Vercel": IconBrandVercel,
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
