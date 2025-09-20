export interface ExperienceItem {
  company: string;
  position: string;
  location: string;
  duration: string;
  type: "Education" | "Work";
  status: "Student" | "Internship" | "Contract" | "Full-Time" | "Part-Time";
  description: string;
  achievements: string[];
  logo: string;
  website?: string;
}
