"use client";

import React from "react";
import { Spotlight } from "@/components/ui/spotlight-new";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Title } from "@/components/title/Title";

export function AboutContent() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0 z-0">
        <Spotlight />
      </div>
      
      <div className="relative z-10">
        <Section className="pt-20">
          <Container>
            <div className="text-center">
              <Title as="h1" size="xl" className="mb-8">
                About Me
              </Title>
              <p className="text-lg text-neutral-300 max-w-2xl mx-auto">
                Coming soon... This page will tell you more about my background, skills, and experience.
              </p>
            </div>
          </Container>
        </Section>
      </div>
    </div>
  );
}

export default AboutContent;
