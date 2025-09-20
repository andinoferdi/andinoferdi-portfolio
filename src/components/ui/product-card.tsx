"use client";

import React from "react";
import Image from "next/image";
import { motion, MotionValue } from "motion/react";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import { TechIcons } from "@/components/ui/tech-icons";
import { IconExternalLink } from "@tabler/icons-react";
import { ProjectItem } from "@/types/projects";
import { usePreloadImages, usePrefetchOnHover } from "@/hooks/use-prefetch";
import { getAllProjects } from "@/services/projects";

interface ProductCardProps {
  product: ProjectItem;
  translate?: MotionValue<number>;
  className?: string;
  cardContainerClassName?: string;
}

export const ProductCard = ({
  product,
  translate,
  className = "",
  cardContainerClassName = "",
}: ProductCardProps) => {
  const { prefetchOnHover } = usePrefetchOnHover();
  const [imageError, setImageError] = React.useState(false);
  
  const otherProjectImages = getAllProjects()
    .filter(p => p.title !== product.title)
    .slice(0, 3)
    .map(p => p.thumbnail);

  usePreloadImages(otherProjectImages, 200);

  const handleMouseEnter = () => {
    prefetchOnHover(product.link);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const cardContent = (
    <CardContainer 
      className={`inter-var h-full ${cardContainerClassName}`}
      onMouseEnter={handleMouseEnter}
    >
      <CardBody className="bg-gray-50 relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-full h-full rounded-xl p-6 border">
        <CardItem
          translateZ="50"
          className="text-xl font-bold text-neutral-600 dark:text-white mb-4"
        >
          {product.title}
        </CardItem>
        <CardItem
          as="p"
          translateZ="60"
          className="text-neutral-500 text-sm max-w-sm mb-4 dark:text-neutral-300"
        >
          {product.description}
        </CardItem>
        <CardItem translateZ="70" className="mb-4">
          <TechIcons technologies={product.technologies} />
        </CardItem>
        <CardItem translateZ="100" className="w-full flex-1">
          <a 
            href={product.link} 
            target="_blank" 
            rel="noopener noreferrer"
            aria-label={`View ${product.title} project thumbnail`}
            className="block"
          >
            {!imageError ? (
              <Image
                src={product.thumbnail}
                height={400}
                width={400}
                className="h-48 w-full object-cover rounded-xl group-hover/card:shadow-xl"
                alt={`${product.title} project screenshot`}
                priority={false}
                loading="lazy"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                onError={handleImageError}
              />
            ) : (
              <div className="h-48 w-full bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  Image not available
                </span>
              </div>
            )}
          </a>
        </CardItem>
        <div className="flex justify-center items-center mt-8">
          <CardItem
            translateZ={20}
            as="a"
            href={product.link}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View ${product.title} project`}
            className="px-6 py-2 rounded-xl bg-black dark:bg-white dark:text-black text-white text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <span>View Project</span>
            <IconExternalLink size={16} aria-hidden="true" />
          </CardItem>
        </div>
      </CardBody>
    </CardContainer>
  );

  if (translate) {
    return (
      <motion.div
        style={{
          x: translate,
        }}
        key={product.title}
        className={`h-96 w-full max-w-sm md:w-[28rem] relative shrink-0 ${className}`}
      >
        {cardContent}
      </motion.div>
    );
  }

  return (
    <div
      key={product.title}
      className={`h-auto w-full max-w-sm md:w-[28rem] relative shrink-0 mb-4 ${className}`}
    >
      {cardContent}
    </div>
  );
};
