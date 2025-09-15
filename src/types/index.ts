/**
 * Shared TypeScript type definitions
 */

// Common component props
export interface BaseProps {
  children?: React.ReactNode;
  className?: string;
}

// API response types
export interface ApiResponse<T = Record<string, unknown>> {
  data: T;
  status: number;
  message?: string;
}

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

// Project types
export interface Project {
  id: string;
  title: string;
  description: string;
  image?: string;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
  featured: boolean;
}

// Contact form types
export interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';
