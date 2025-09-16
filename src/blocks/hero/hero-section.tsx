"use client";

import React from "react";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
} from "motion/react";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";
import { ContainerTextFlip } from "@/components/ui/container-text-flip";
import { heroTestimonials, heroTextFlipWords } from "./data";
import { HeroParallaxProps, ProductItem } from "./types";

/**
 * Main Hero Section with Parallax Effect
 * Contains header, animated text, testimonials, and 3D project cards
 */
export const HeroSection = ({ products }: HeroParallaxProps) => {
  const firstRow = products.slice(0, 3);
  const secondRow = products.slice(3, 6);
  const thirdRow = products.slice(6, 9);
  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const springConfig = { stiffness: 300, damping: 30, bounce: 100 };

  const translateX = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, 0]),
    springConfig
  );
  const translateXReverse = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, 0]),
    springConfig
  );
  const rotateX = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [15, 0]),
    springConfig
  );
  const opacity = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [0.05, 1]),
    springConfig
  );
  const rotateZ = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [20, 0]),
    springConfig
  );
  const translateY = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [-520, 1]),
    springConfig
  );

  return (
    <div
      ref={ref}
      className="h-[500vh] py-20 overflow-hidden antialiased relative flex flex-col self-auto [perspective:1000px] [transform-style:preserve-3d]"
    >
      <HeroHeader scrollYProgress={scrollYProgress} />
      
      {/* Projects Section */}
      <motion.div
        style={{
          opacity: useSpring(
            useTransform(scrollYProgress, [0.05, 0.12], [0, 1]),
            springConfig
          ),
          y: useSpring(
            useTransform(scrollYProgress, [0.05, 0.12], [20, 0]),
            springConfig
          ),
        }}
        className="-mt-8 md:-mt-12"
      >
        <ProjectsSection />
      </motion.div>
      
      {/* 3D Project Cards with Parallax */}
      <motion.div
        style={{
          rotateX,
          rotateZ,
          translateY,
          opacity,
        }}
        className="flex flex-col items-center w-full"
      >
        <ProductRow products={firstRow} translate={translateX} />
        <ProductRow products={secondRow} translate={translateXReverse} />
        <ProductRow products={thirdRow} translate={translateX} />
      </motion.div>
    </div>
  );
};

/**
 * Hero Header with Animated Text and Testimonials
 */
export const HeroHeader = ({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) => {
  const headerOpacity = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [0.95, 1]),
    { stiffness: 300, damping: 30, bounce: 100 }
  );

  return (
    <motion.div
      style={{ opacity: headerOpacity }}
      className="max-w-7xl relative mx-auto py-8 md:py-16 px-4 w-full left-0 top-0 text-center -translate-y-8 md:-translate-y-12 will-change-transform"
    >
      <h1 className="text-2xl md:text-7xl font-bold dark:text-white mb-4 md:mb-8">
        Hi, my name is
      </h1>
      <div className="mt-4 md:mt-6">
        <ContainerTextFlip words={heroTextFlipWords} />
      </div>
      <div className="mt-8 md:mt-12">
        <HeroTestimonials />
      </div>
    </motion.div>
  );
};

/**
 * Projects Section Header
 */
export const ProjectsSection = () => {
  return (
    <div className="max-w-7xl relative mx-auto py-12 md:py-20 px-4 w-full text-center">
      <h2 className="text-2xl md:text-5xl font-bold dark:text-white mb-4 md:mb-8">
        My Projects
      </h2>
      <p className="max-w-2xl text-sm md:text-lg mt-2 md:mt-4 dark:text-neutral-300 mx-auto px-4">
        Explore our portfolio of innovative projects and cutting-edge solutions.
      </p>
    </div>
  );
};

/**
 * Product Row - Renders a row of 3D product cards
 */
const ProductRow = ({
  products,
  translate,
}: {
  products: ProductItem[];
  translate: MotionValue<number>;
}) => {
  return (
    <motion.div className="flex flex-col md:flex-row justify-center items-center space-y-6 md:space-y-0 md:space-x-8 mb-8 md:mb-12 px-4 w-full">
      {products.map((product) => (
        <ProductCard
          product={product}
          translate={translate}
          key={product.title}
        />
      ))}
    </motion.div>
  );
};

/**
 * 3D Product Card Component
 */
export const ProductCard = ({
  product,
  translate,
}: {
  product: ProductItem;
  translate: MotionValue<number>;
}) => {
  return (
    <motion.div
      style={{
        x: translate,
      }}
      key={product.title}
      className="h-96 w-full max-w-sm md:w-[28rem] relative shrink-0"
    >
      <CardContainer className="inter-var h-full -mt-4 md:-mt-8">
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
            Explore this amazing project and discover innovative solutions
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
          <div className="flex justify-between items-center mt-4">
            <CardItem
              translateZ={20}
              as="a"
              href={product.link}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl text-xs font-normal dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              View Project →
            </CardItem>
            <CardItem
              translateZ={20}
              as="button"
              className="px-4 py-2 rounded-xl bg-black dark:bg-white dark:text-black text-white text-xs font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              Learn More
            </CardItem>
          </div>
        </CardBody>
      </CardContainer>
    </motion.div>
  );
};

/**
 * Hero Testimonials Component
 */
export const HeroTestimonials = () => {
  return <AnimatedTestimonials testimonials={heroTestimonials} />;
};
