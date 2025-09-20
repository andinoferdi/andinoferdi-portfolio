"use client";

import React from "react";
import Link from "next/link";
import { ProductCard } from "@/components/ui/product-card";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
} from "motion/react";
import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";
import { ContainerTextFlip } from "@/components/ui/container-text-flip";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { heroTestimonials, heroTextFlipWords } from "@/data/hero";
import { getFeaturedProjects } from "@/services/projects";
import { ProjectItem } from "@/types/projects";

export const HeroSection = () => {
  const featuredProjects = getFeaturedProjects();
  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });


 
  return (
    <div
      ref={ref}
      className="min-h-screen py-20 pb-[10vh] overflow-hidden antialiased relative flex flex-col self-auto [perspective:1000px] [transform-style:preserve-3d]"
    >
      <HeroHeader scrollYProgress={scrollYProgress} />
      
      <div className="-mt-8 md:-mt-12">
        <ProjectsSection />
      </div>
      
      <motion.div
       
        className="flex flex-col items-center w-full"
      >
        <ProductRow products={featuredProjects} />
      </motion.div>
    </div>
  );
};

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
      <div className="mt-8 md:mt-12 flex justify-center">
        <DownloadCVButton />
      </div>
    </motion.div>
  );
};


export const ProjectsSection = () => {
  return (
    <div className="max-w-7xl relative mx-auto py-12 md:py-20 px-4 w-full text-center">
      <h2 className="text-2xl md:text-5xl font-bold dark:text-white mb-4 md:mb-8">
        My Projects
      </h2>
      <p className="max-w-2xl text-sm md:text-lg mt-2 md:mt-4 dark:text-neutral-300 mx-auto px-4">
        Explore my portfolio of innovative projects and cutting-edge solutions.
      </p>
    </div>
  );
};

const ProductRow = ({ products }: { products: ProjectItem[] }) => {
  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex flex-col md:flex-row justify-center items-center space-y-6 md:space-y-0 md:space-x-8 px-4 w-full">
        {products.map((product) => (
          <ProductCard product={product} key={product.title} />
        ))}
      </div>
      <ViewMoreButton />
    </div>
  );
};


export const HeroTestimonials = () => {
  return <AnimatedTestimonials testimonials={heroTestimonials} />;
};


export const DownloadCVButton = () => {
  const handleDownloadCV = () => {
    const cvUrl = "/cv/ANDINO FERDIANSAH.pdf"; 
    const link = document.createElement("a");
    link.href = cvUrl;
    link.download = "ANDINO FERDIANSAH.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <HoverBorderGradient
      containerClassName="rounded-full cursor-pointer"
      as="button"
      className="dark:bg-black bg-white text-black dark:text-white flex items-center space-x-2 px-6 py-3"
      onClick={handleDownloadCV}
    >
      <DownloadIcon />
      <span>Download CV</span>
    </HoverBorderGradient>
  );
};

const DownloadIcon = () => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 text-black dark:text-white"
    >
      <path
        d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 10L12 15L17 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 15V3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};


const ViewMoreButton = () => {
  return (
    <div className="mt-8 md:mt-12 flex justify-center">
      <Link href="/projects">
        <HoverBorderGradient
          containerClassName="rounded-full cursor-pointer"
          as="button"
          className="dark:bg-black bg-white text-black dark:text-white flex items-center space-x-2 px-6 py-3"
        >
          <span>View More Projects</span>
          <ArrowRightIcon />
        </HoverBorderGradient>
      </Link>
    </div>
  );
};


const ArrowRightIcon = () => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 text-black dark:text-white"
    >
      <path
        d="M5 12H19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 5L19 12L12 19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
