import { type ProfileData } from "@/types/profile";

export const getProfileData = (): ProfileData => {
  return {
    profiles: [
      {
        quote: "I specialize in Vue.js, React.js, Nuxt.js, and Next.js development, creating modern and responsive web applications with excellent user experience.",
        name: "Front End Developer",
        designation: "Modern Web Development",
        src: "/images/self/1.webp",
      },
      {
        quote: "I have extensive experience with Laravel, Golang, and Python development, focusing on backend architecture and database optimization.",
        name: "Back End Developer",
        designation: "Server & Database Expert",
        src: "/images/self/2.webp",
      },
      {
        quote: "I'm proficient in Flutter and React Native development, building cross-platform mobile applications with native performance.",
        name: "Mobile Developer",
        designation: "Cross-Platform Apps",
        src: "/images/self/3.webp",
      },
      {
        quote: "I have comprehensive knowledge of Figma design tools, creating beautiful and intuitive user interfaces and user experiences.",
        name: "UI/UX Designer",
        designation: "Design & User Experience",
        src: "/images/self/4.webp",
      },
    ],
    cvDownload: {
      url: "/cv/ANDINO FERDIANSAH.pdf",
      filename: "ANDINO FERDIANSAH.pdf",
      label: "Download CV",
    },
  };
};
