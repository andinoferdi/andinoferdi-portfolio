export interface FooterConfig {
  copyright: string;
}

export const getFooterConfig = (): FooterConfig => {
  return {
    copyright: "(c) 2025 AndinoFerdi. All rights reserved.",
  };
};
