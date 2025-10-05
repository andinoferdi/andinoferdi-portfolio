"use client";

import { FocusCards } from "@/components/ui/focus-cards";
import { PageTitle } from "@/components/page-title";
import { getGalleryData } from "@/services/gallery";
import { type GalleryItem } from "@/types/gallery";

export const GalleryPage = () => {
  const galleryData = getGalleryData();

  const galleryItems = galleryData.items.map((item: GalleryItem) => ({
    id: item.id,
    title: item.title,
    src: item.src,
  }));

  return (
    <>
      <PageTitle title="Gallery - AndinoFerdi" />
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
              Gallery
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A collection of photos I took during my travels to various places,
              along with my experiences and the happiness I felt.
            </p>
          </div>

          <FocusCards cards={galleryItems} />
        </div>
      </section>
    </>
  );
};