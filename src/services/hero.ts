import { heroTestimonials, heroTextFlipWords } from '@/data/hero';
import type { Testimonial } from '@/types/hero';

export const getHeroTestimonials = (): Testimonial[] => {
  return heroTestimonials;
};

export const getHeroTextFlipWords = (): string[] => {
  return heroTextFlipWords;
};


