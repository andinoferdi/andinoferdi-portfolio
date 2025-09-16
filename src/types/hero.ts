export interface ProductItem {
  title: string;
  link: string;
  thumbnail: string;
}

export interface Testimonial {
  quote: string;
  name: string;
  designation: string;
  src: string;
}

export interface HeroParallaxProps {
  products: ProductItem[];
}

export interface HeroTextFlipProps {
  words?: string[];
  interval?: number;
  className?: string;
  textClassName?: string;
  animationDuration?: number;
}

export interface HeroTestimonialsProps {
  testimonials: Testimonial[];
  autoplay?: boolean;
}
