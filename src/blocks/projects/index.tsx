"use client";

import React from "react";
import Image from "next/image";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import { heroProducts } from "@/data/hero";
import { ProductItem } from "@/types/hero";

/**
 * Projects Page with 3D Cards
 * Contains 3D project cards without parallax effects
 */
export function ProjectsContent() {
  const firstRow = heroProducts.slice(0, 3);
  const secondRow = heroProducts.slice(3, 6);
  const thirdRow = heroProducts.slice(6, 9);

  return (
    <div className="min-h-screen py-20 antialiased relative flex flex-col">
     
      <div className="flex flex-col items-center w-full">
        <ProductRow products={firstRow} />
        <ProductRow products={secondRow} />
        <ProductRow products={thirdRow} />
      </div>
    </div>
  );
}




const ProductRow = ({
  products,
}: {
  products: ProductItem[];
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-center items-center space-y-6 md:space-y-0 md:space-x-8 mb-8 md:mb-12 px-4 w-full">
      {products.map((product) => (
        <ProductCard
          product={product}
          key={product.title}
        />
      ))}
    </div>
  );
};

/**
 * 3D Product Card Component
 */
export const ProductCard = ({
  product,
}: {
  product: ProductItem;
}) => {
  return (
    <div
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
    </div>
  );
};

export default ProjectsContent;
