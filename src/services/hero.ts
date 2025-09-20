import { heroProducts, heroTestimonials, heroTextFlipWords } from '@/data/hero';
import type { ProductItem, Testimonial } from '@/types/hero';

export const getHeroProducts = (): ProductItem[] => {
  return heroProducts;
};

export const getHeroTestimonials = (): Testimonial[] => {
  return heroTestimonials;
};

export const getHeroTextFlipWords = (): string[] => {
  return heroTextFlipWords;
};

export const getRandomProducts = (count: number = 6): ProductItem[] => {
  const shuffled = [...heroProducts].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, heroProducts.length));
};

export const getProductsByTitle = (titles: string[]): ProductItem[] => {
  return heroProducts.filter(product => 
    titles.some(title => 
      product.title.toLowerCase().includes(title.toLowerCase())
    )
  );
};

export const getFeaturedTestimonials = (count: number = 3): Testimonial[] => {
  return heroTestimonials.slice(0, Math.min(count, heroTestimonials.length));
};

export const searchProducts = (query: string): ProductItem[] => {
  const lowercaseQuery = query.toLowerCase();
  return heroProducts.filter(product =>
    product.title.toLowerCase().includes(lowercaseQuery) ||
    product.link.toLowerCase().includes(lowercaseQuery)
  );
};

export const validateProduct = (product: ProductItem): boolean => {
  return !!(
    product.title &&
    product.link &&
    product.thumbnail &&
    product.title.trim().length > 0 &&
    product.link.startsWith('http') &&
    product.thumbnail.startsWith('http')
  );
};

export const validateTestimonial = (testimonial: Testimonial): boolean => {
  return !!(
    testimonial.quote &&
    testimonial.name &&
    testimonial.src &&
    testimonial.quote.trim().length > 0 &&
    testimonial.name.trim().length > 0 &&
    testimonial.src.startsWith('http')
  );
};

export const getHeroConfig = (): {
  products: ProductItem[];
  testimonials: Testimonial[];
  textFlipWords: string[];
} => {
  return {
    products: getHeroProducts(),
    testimonials: getHeroTestimonials(),
    textFlipWords: getHeroTextFlipWords()
  };
};

export const formatProductsForRows = (products: ProductItem[] = heroProducts): {
  firstRow: ProductItem[];
  secondRow: ProductItem[];
  thirdRow: ProductItem[];
} => {
  return {
    firstRow: products.slice(0, 3),
    secondRow: products.slice(3, 6),
    thirdRow: products.slice(6, 9)
  };
};
