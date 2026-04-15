"use client";

import { useState } from "react";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { type Certificate } from "@/types/certificate";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

interface CertificateCardProps {
  certificate: Certificate;
}

const slideVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

const slideTransition = {
  duration: 0.25,
  ease: [0.42, 0, 0.58, 1],
};

export const CertificateCard = ({ certificate }: CertificateCardProps) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const hasMultipleImages = certificate.images.length > 1;
  const activeImage =
    certificate.images[activeImageIndex] ?? certificate.images[0];

  const handlePreviousImage = () => {
    setActiveImageIndex((currentIndex) =>
      currentIndex === 0 ? certificate.images.length - 1 : currentIndex - 1,
    );
  };

  const handleNextImage = () => {
    setActiveImageIndex(
      (currentIndex) => (currentIndex + 1) % certificate.images.length,
    );
  };

  const handleDotClick = (index: number) => {
    setActiveImageIndex(index);
  };

  return (
    <article
      className="group"
      role="article"
      aria-label={`Certificate: ${certificate.id}`}
    >
      <CardContainer containerClassName="w-full" className="group w-full">
        <CardBody dynamicSize className="w-full">
          <CardItem translateZ="50" className="w-full">
            <div className="relative w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={activeImageIndex}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={slideTransition}
                  className="relative aspect-4/3 w-full bg-muted/20"
                >
                  <Image
                    src={activeImage}
                    alt={`Certificate ${certificate.id} image ${activeImageIndex + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-contain p-2"
                  />
                </motion.div>
              </AnimatePresence>

              {hasMultipleImages && (
                <>
                  <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-3">
                    <button
                      type="button"
                      onClick={handlePreviousImage}
                      className="pointer-events-auto inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm transition-colors hover:bg-background"
                      aria-label="Previous certificate image"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextImage}
                      className="pointer-events-auto inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm transition-colors hover:bg-background"
                      aria-label="Next certificate image"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
                    {certificate.images.map((image, index) => (
                      <button
                        key={image}
                        type="button"
                        onClick={() => handleDotClick(index)}
                        className={cn(
                          "h-2.5 w-2.5 rounded-full border border-background/70 transition-all",
                          index === activeImageIndex
                            ? "bg-foreground"
                            : "bg-background/70 hover:bg-background",
                        )}
                        aria-label={`Show certificate image ${index + 1}`}
                        aria-pressed={index === activeImageIndex}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </CardItem>
        </CardBody>
      </CardContainer>
    </article>
  );
};
