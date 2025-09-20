export interface ExperienceItem {
  id: string;
  company: string;
  position: string;
  type: 'Education' | 'Work';
  status: 'Student' | 'Present' | 'Contract' | 'Full-Time' | 'Internship';
  location: string;
  duration: string;
  description: string;
  achievements: string[];
  logo: string;
  website?: string;
  startDate: string; // for sorting
  endDate: string;   // for sorting
}

export interface ExperienceSection {
  items: ExperienceItem[];
  title: string;
  subtitle: string;
}
