export interface FooterConfig {
  copyright: string;
  privacyNotice: string;
}

export const getFooterConfig = (): FooterConfig => {
  return {
    copyright: "(c) 2025 AndinoFerdi. All rights reserved.",
    privacyNotice:
      "Visit data (IP, device, and referrer) may be recorded for security and analytics.",
  };
};
