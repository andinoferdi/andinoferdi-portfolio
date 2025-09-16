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
import { AnimatedTestimonials } from "@/blocks/hero/animated-testimonials";
import { ContainerTextFlip } from "@/blocks/hero/container-text-flip";



export const HeroParallax = ({
  products,
}: {
  products: {
    title: string;
    link: string;
    thumbnail: string;
  }[];
}) => {
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
      <Header scrollYProgress={scrollYProgress} />
      
      {/* Projects Section - appears when parallax reaches final position */}
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
      
      <motion.div
        style={{
          rotateX,
          rotateZ,
          translateY,
          opacity,
        }}
        className="flex flex-col items-center w-full"
      >
        <motion.div className="flex flex-col md:flex-row justify-center items-center space-y-6 md:space-y-0 md:space-x-8 mb-8 md:mb-12 px-4 w-full">
          {firstRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateX}
              key={product.title}
            />
          ))}
        </motion.div>
        <motion.div className="flex flex-col md:flex-row justify-center items-center space-y-6 md:space-y-0 md:space-x-8 mb-8 md:mb-12 px-4 w-full">
          {secondRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateXReverse}
              key={product.title}
            />
          ))}
        </motion.div>
        <motion.div className="flex flex-col md:flex-row justify-center items-center space-y-6 md:space-y-0 md:space-x-8 px-4 w-full">
          {thirdRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateX}
              key={product.title}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export const Header = ({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) => {
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
      <div className="mt-2 md:mt-4">
        <ContainerTextFlipDemo />
      </div>
      {/* Animated Testimonials */}
      <div className="mt-8 md:mt-12">
        <AnimatedTestimonialsDemo />
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
        Explore our portfolio of innovative projects and cutting-edge solutions.
      </p>
    </div>
  );
};

export const ProductCard = ({
  product,
  translate,
}: {
  product: {
    title: string;
    link: string;
    thumbnail: string;
  };
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

export function AnimatedTestimonialsDemo() {
  const testimonials = [
    {
      quote:
        "The attention to detail and innovative features have completely transformed our workflow. This is exactly what we've been looking for.",
      name: "Sarah Chen",
      designation: "Product Manager at TechFlow",
      src: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=3560&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      quote:
        "Implementation was seamless and the results exceeded our expectations. The platform's flexibility is remarkable.",
      name: "Michael Rodriguez",
      designation: "CTO at InnovateSphere",
      src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      quote:
        "This solution has significantly improved our team's productivity. The intuitive interface makes complex tasks simple.",
      name: "Emily Watson",
      designation: "Operations Director at CloudScale",
      src: "https://images.unsplash.com/photo-1623582854588-d60de57fa33f?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      quote:
        "Outstanding support and robust features. It's rare to find a product that delivers on all its promises.",
      name: "James Kim",
      designation: "Engineering Lead at DataPro",
      src: "https://images.unsplash.com/photo-1636041293178-808a6762ab39?q=80&w=3464&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      quote:
        "The scalability and performance have been game-changing for our organization. Highly recommend to any growing business.",
      name: "Lisa Thompson",
      designation: "VP of Technology at FutureNet",
      src: "https://images.unsplash.com/photo-1624561172888-ac93c696e10c?q=80&w=2592&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
  ];
  return <AnimatedTestimonials testimonials={testimonials} />;
};

export function ContainerTextFlipDemo() {
  return (
    <ContainerTextFlip
      words={["Andino", "Ferdiansah", "Ferdi", "Bahro"]}
    />
  );
};
