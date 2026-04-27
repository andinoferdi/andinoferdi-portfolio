"use client";

import LiteYouTubeEmbed from "react-lite-youtube-embed";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const VIDEO_ID = "D2q5GgfHXi8";
const VIDEO_URL = "https://youtu.be/D2q5GgfHXi8?si=RIlpM2RdI5aE1Jt1";

export const IntroductionSection = () => {
  return (
    <section className="py-12 px-4 md:py-20" aria-label="Introduction video">
      <div className="max-w-7xl mx-auto">
        <div className="mx-auto max-w-4xl" data-aos="fade-up">
          <Card
            variant="glass"
            className="border-border/60 shadow-lg"
          >
            <CardHeader className="text-center" padding="default">
              <CardTitle size="lg" className="text-3xl md:text-4xl text-foreground">
                Introduction
              </CardTitle>
              <CardDescription size="lg" className="mx-auto max-w-2xl">
                Watch a short introduction video to know me better.
              </CardDescription>
            </CardHeader>
            <CardContent padding="default" className="pt-2">
              <div className="overflow-hidden rounded-xl border border-border/60 bg-background/80">
                <LiteYouTubeEmbed
                  id={VIDEO_ID}
                  title="Andino Introduction Video"
                  poster="maxresdefault"
                  noCookie={true}
                  wrapperClass="yt-lite"
                  iframeClass="w-full h-full"
                />
              </div>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                If the player does not load, open directly: {" "}
                <a
                  href={VIDEO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  YouTube link
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
