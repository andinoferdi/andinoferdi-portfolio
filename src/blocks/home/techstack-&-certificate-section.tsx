"use client";

import { TechStackCard } from "@/components/tech-stack-card";
import { CertificateCard } from "@/components/certificate-card";
import { HoverBorderGradient } from "@/components/ui/hover-border-button";
import { Tab, type TabItem } from "@/components/ui/tab";
import { getTechStackData } from "@/services/techstack";
import { getCertificateData } from "@/services/certificate";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

export const TechStackCertificateSection = () => {
  const techStackData = getTechStackData();
  const certificateData = getCertificateData();

  const tabItems: TabItem[] = [
    {
      id: 'techstack',
      label: 'Tech Stack',
      content: (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {techStackData.categories.slice(0, 3).map((category, index) => (
            <TechStackCard
              key={category.id}
              category={category}
              index={index}
            />
          ))}
        </div>
      ),
    },
    {
      id: 'certificate',
      label: 'Certificates',
      content: (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {certificateData.certificates.slice(0, 3).map((certificate) => (
            <div key={certificate.id} data-aos="fade-up">
              <CertificateCard certificate={certificate} />
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-7xl">
        <header className="mb-16 text-center" data-aos="fade-up">
          <h2 className="mb-4 text-4xl font-bold text-foreground md:text-6xl">
            Tech Stack & Certificates
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Technologies, tools, and professional certifications that showcase my expertise and commitment to continuous learning.
          </p>
        </header>

        {/* Tab Component */}
        <div className="mb-12" data-aos="fade-up">
          <Tab
            items={tabItems}
            defaultValue="techstack"
            className="w-full"
          />
        </div>

        {/* Single CTA Button */}
        <div className="flex justify-center mt-12" data-aos="fade-up">
          <HoverBorderGradient
            as={Link}
            href="/techstack-&-certificate"
            containerClassName="rounded-full"
            className="flex items-center gap-2 px-6 py-2.5 text-base font-medium sm:px-8 sm:py-3 sm:text-lg"
            {...({} as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
          >
            View All Tech Stack & Certificates
            <ExternalLink className="h-5 w-5" />
          </HoverBorderGradient>
        </div>
      </div>
    </section>
  );
};

