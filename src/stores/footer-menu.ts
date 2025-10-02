export interface FooterLink {
  name: string;
  href: string;
  icon?: string;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}

export interface FooterConfig {
  sections: FooterSection[];
  socialLinks: FooterLink[];
  logo: {
    src: string;
    alt: string;
    width: number;
    height: number;
    href: string;
  };
  brandName: string;
  copyright: string;
}

export const defaultFooterConfig: FooterConfig = {
  sections: [
    {
      title: "Product",
      links: [
        { name: "Features", href: "/features" },
        { name: "Pricing", href: "/pricing" },
        { name: "Documentation", href: "/docs" },
        { name: "API", href: "/api" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About", href: "/about" },
        { name: "Blog", href: "/blog" },
        { name: "Careers", href: "/careers" },
        { name: "Contact", href: "/contact" },
      ],
    },
    {
      title: "Support",
      links: [
        { name: "Help Center", href: "/help" },
        { name: "Community", href: "/community" },
        { name: "Status", href: "/status" },
        { name: "Security", href: "/security" },
      ],
    },
    {
      title: "Legal",
      links: [
        { name: "Privacy", href: "/privacy" },
        { name: "Terms", href: "/terms" },
        { name: "Cookies", href: "/cookies" },
        { name: "Licenses", href: "/licenses" },
      ],
    },
  ],
  socialLinks: [
    { name: "Twitter", href: "https://twitter.com", icon: "twitter" },
    { name: "GitHub", href: "https://github.com", icon: "github" },
    { name: "LinkedIn", href: "https://linkedin.com", icon: "linkedin" },
    { name: "Discord", href: "https://discord.com", icon: "discord" },
  ],
  logo: {
    src: "https://assets.aceternity.com/logo-dark.png",
    alt: "logo",
    width: 30,
    height: 30,
    href: "/",
  },
  brandName: "Startup",
  copyright: "© 2024 Startup. All rights reserved.",
};

export const getFooterConfig = (): FooterConfig => {
  return defaultFooterConfig;
};
