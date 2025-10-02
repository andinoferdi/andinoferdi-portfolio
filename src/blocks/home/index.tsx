"use client";

import { getHomePageData } from "@/services/hero";
import { HeroSection } from "./hero-section";
import { ProjectsSection } from "./projects-section";
import { PageTitle } from "@/components/page-title";

export default function Home() {
  const data = getHomePageData();

  return (
    <>
      <PageTitle title="Andino Ferdiansah | Developer" />
      <HeroSection data={data.hero} />
      <ProjectsSection />
    </>
  );
}
