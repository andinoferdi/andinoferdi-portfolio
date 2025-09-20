import type { ExperienceItem } from '@/types/experience';

export const experienceData: ExperienceItem[] = [
  {
    id: 'uph-2025',
    company: 'PELITA HARAPAN UNIVERSITY',
    position: 'Information Technology',
    type: 'Education',
    status: 'Student',
    location: 'BANTEN, INDONESIA',
    duration: 'Aug 2025 - Present',
    startDate: '2025-08',
    endDate: 'present',
    description: 'Pelita Harapan University abbreviated as UPH, is a private Reformed Evangelical coeducational higher education institution run by the Pelita Harapan Education Foundation',
    achievements: [],
    logo: '/images/logos/uph.png',
    website: 'https://www.uph.edu'
  },
  {
    id: 'aerotalon-2025',
    company: 'AEROTALON',
    position: 'Frontend Developer',
    type: 'Work',
    status: 'Contract',
    location: 'VICTORIA, AUSTRALIA',
    duration: 'Aug 2025 - Present',
    startDate: '2025-08',
    endDate: 'present',
    description: 'Aerotalon is an aerospace service provider based in Melbourne, Australia, specializing in the distribution and supply of aircraft parts and components.',
    achievements: [
      'Assist the migration of legacy front-end to React.',
      'Solving complex challenges with a focus on performance, security, and user experience.',
      'Tackling large-scale performance optimization tasks.',
      'Developing front-end solutions across a growing range of products.',
      'Conducting QA and peer reviewing code from teammates.'
    ],
    logo: '/images/logos/aerotalon.png',
    website: 'https://www.aerotalon.com'
  },
  {
    id: 'elitery-2024',
    company: 'ELITERY',
    position: 'Cloud Engineer',
    type: 'Work',
    status: 'Internship',
    location: 'JAKARTA, INDONESIA',
    duration: 'Jan 2024 - Apr 2024',
    startDate: '2024-01',
    endDate: '2024-04',
    description: 'Elitery is an IT managed service provider and system integrator based in Jakarta, Indonesia with years of experience in managing mission-critical systems.',
    achievements: [
      'Interview, consult and research client\'s need',
      'Design and propose Cloud Infrastructure',
      'Create well-architected Cloud Infrastructure',
      'Create and prepare UAT for client',
      'Review, monitoring and troubleshooting',
      'Prepare Knowledge Transfer'
    ],
    logo: '/images/logos/elitery.png',
    website: 'https://www.elitery.com'
  },
  {
    id: 'xcidic-2023',
    company: 'XCIDIC',
    position: 'Deputy Head Of Information Technology',
    type: 'Work',
    status: 'Full-Time',
    location: 'SINGAPORE',
    duration: 'Oct 2023 - May 2024',
    startDate: '2023-10',
    endDate: '2024-05',
    description: 'Xcidic is a cybersecurity company based in Singapore that delivers tailored solutions, including penetration testing, vulnerability assessments, and remediation, to meet the unique security needs of each business.',
    achievements: [
      'Contributed to the project pitch, planning, development, and production phases, ensuring successful execution and timely delivery of key initiatives.',
      'Implemented and integrated cutting-edge technologies and industry best practices, driving innovation and efficiency within the team.',
      'Designed and implemented comprehensive technical assessments for cybersecurity projects.'
    ],
    logo: '/images/logos/xcidic.png',
    website: 'https://www.xcidic.com'
  }
];

export const experienceSection = {
  title: 'Experience & Education',
  subtitle: 'My journey through various roles where I\'ve learned, contributed, and grown as a software engineer.'
};
