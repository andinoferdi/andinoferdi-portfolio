"use client";

import React from "react";
import Image from "next/image";
import { motion, MotionValue } from "motion/react";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import { TechIcons } from "@/components/ui/tech-icons";
import { IconExternalLink } from "@tabler/icons-react";
import { ProjectItem } from "@/types/projects";

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
  const cardContent = (
    <CardContainer className={`inter-var h-full ${cardContainerClassName}`}>
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
          <a href={product.link} target="_blank" rel="noopener noreferrer">
            <Image
              src={product.thumbnail}
              height={400}
              width={400}
              className="h-48 w-full object-cover rounded-xl group-hover/card:shadow-xl"
              alt={product.title}
            />
          </a>
        </CardItem>
        <div className="flex justify-center items-center mt-8">
          <CardItem
            translateZ={20}
            as="a"
            href={product.link}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 rounded-xl bg-black dark:bg-white dark:text-black text-white text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <span>View Project</span>
            <IconExternalLink size={16} />
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
