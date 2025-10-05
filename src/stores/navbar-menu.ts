export interface MenuItem {
  name: string;
  link: string;
  icon?: string;
  children?: MenuItem[];
}

export interface NavbarConfig {
  mainItems: MenuItem[];
  logo: {
    src: string;
    alt: string;
    width: number;
    height: number;
    href: string;
  };
  socialLinks: {
    github: {
      href: string;
      icon: string;
    };
    whatsapp: {
      href: string;
      icon: string;
    };
  };
  brandName: string;
}

export const defaultNavbarConfig: NavbarConfig = {
  mainItems: [
    {
      name: "Home",
      link: "/",
    },
    {
      name: "Projects",
      link: "/projects",
    },
    {
      name: "Gallery",
      link: "/gallery",
    },
  ],
  logo: {
    src: "/images/Logo.png",
    alt: "AndinoFerdi Logo",
    width: 30,
    height: 30,
    href: "/",
  },
  socialLinks: {
    github: {
      href: "https://github.com/andinoferdi",
      icon: "github",
    },
    whatsapp: {
      href: "https://wa.me/6281359528944",
      icon: "whatsapp",
    },
  },
  brandName: "AndinoFerdi",
};

export const getMenuItems = (): MenuItem[] => {
  return defaultNavbarConfig.mainItems;
};

export const getNavbarConfig = (): NavbarConfig => {
  return defaultNavbarConfig;
};
