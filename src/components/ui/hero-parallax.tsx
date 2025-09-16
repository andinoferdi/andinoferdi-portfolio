"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
} from "motion/react";

export const HeroParallax = ({
  products,
}: {
  products: {
    title: string;
    link: string;
    thumbnail: string;
  }[];
}) => {
  const firstRow = products.slice(0, 5);
  const secondRow = products.slice(5, 10);
  const thirdRow = products.slice(10, 15);
  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const springConfig = { stiffness: 300, damping: 30, bounce: 100 };

  // Responsive transform values based on screen size
  const translateDistance = isMobile ? 500 : 1000;
  const rotateAmount = isMobile ? 10 : 15;
  const translateYAmount = isMobile ? [-400, 200] : [-700, 500];

  const translateX = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, translateDistance]),
    springConfig
  );
  const translateXReverse = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, -translateDistance]),
    springConfig
  );
  const rotateX = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [rotateAmount, 0]),
    springConfig
  );
  const opacity = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [0.2, 1]),
    springConfig
  );
  const rotateZ = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [isMobile ? 10 : 20, 0]),
    springConfig
  );
  const translateY = useSpring(
    useTransform(scrollYProgress, [0, 0.2], translateYAmount),
    springConfig
  );
  return (
    <div
      ref={ref}
      className="h-[200vh] sm:h-[250vh] md:h-[300vh] py-20 sm:py-40 overflow-hidden antialiased relative flex flex-col self-auto [perspective:1000px] [transform-style:preserve-3d]"
    >
      <Header />
      <motion.div
        style={{
          rotateX,
          rotateZ,
          translateY,
          opacity,
        }}
        className=""
      >
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-4 sm:space-x-8 md:space-x-12 lg:space-x-20 mb-8 sm:mb-12 md:mb-16 lg:mb-20">
          {firstRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateX}
              key={product.title}
            />
          ))}
        </motion.div>
        <motion.div className="flex flex-row mb-8 sm:mb-12 md:mb-16 lg:mb-20 space-x-4 sm:space-x-8 md:space-x-12 lg:space-x-20">
          {secondRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateXReverse}
              key={product.title}
            />
          ))}
        </motion.div>
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-4 sm:space-x-8 md:space-x-12 lg:space-x-20">
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

export const Header = () => {
  return (
    <div className="max-w-7xl relative mx-auto py-10 sm:py-20 md:py-30 lg:py-40 px-4 sm:px-6 lg:px-8 w-full left-0 top-0 text-center">
      <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight">
        Your Name <br /> Portfolio
      </h1>
      <p className="max-w-xl sm:max-w-2xl mx-auto text-sm xs:text-base sm:text-lg md:text-xl mt-4 sm:mt-6 md:mt-8 text-neutral-200 leading-relaxed">
        Full Stack Developer crafting exceptional digital experiences with modern technologies. 
        Passionate about clean code, innovative solutions, and user-centered design.
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
      whileHover={{
        y: -20,
      }}
      key={product.title}
      className="group/product h-48 w-48 xs:h-56 xs:w-56 sm:h-64 sm:w-64 md:h-80 md:w-80 lg:h-96 lg:w-[30rem] relative shrink-0"
    >
      <a
        href={product.link}
        className="block group-hover/product:shadow-2xl "
      >
        <Image
          src={product.thumbnail}
          height={600}
          width={600}
          className="object-cover object-left-top absolute h-full w-full inset-0"
          alt={product.title}
        />
      </a>
      <div className="absolute inset-0 h-full w-full opacity-0 group-hover/product:opacity-80 bg-black pointer-events-none"></div>
      <h2 className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 opacity-0 group-hover/product:opacity-100 text-white text-xs sm:text-sm md:text-base font-medium">
        {product.title}
      </h2>
    </motion.div>
  );
};
