"use client";

import React from "react";
import { ProductCard } from "@/components/ui/product-card";
import { projectsItem } from "@/data/projects";
import { ProjectItem } from "@/types/projects";

export function ProjectsContent() {
  const firstRow = projectsItem.slice(0, 3);
  const secondRow = projectsItem.slice(3, 6);
  const thirdRow = projectsItem.slice(6, 9);

  return (
    <div className="py-20 antialiased relative flex flex-col">
      <div className="flex flex-col items-center w-full space-y-8">
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
  products: ProjectItem[];
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-center items-center space-y-6 md:space-y-0 md:space-x-8 px-4 w-full">
      {products.map((product) => (
        <ProductCard
          product={product}
          key={product.title}
        />
      ))}
    </div>
  );
};


export default ProjectsContent;
