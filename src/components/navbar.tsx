"use client";

import { useState } from "react";
import { getNavbarConfig } from "@/stores/navbar-menu";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavbarLogo,
} from "@/components/ui/resizable-navbar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Github } from "lucide-react";
import { IconBrandWhatsapp } from "@tabler/icons-react";

export const DemoNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navbarConfig = getNavbarConfig();
  const { mainItems: menuItems, logo, socialLinks, brandName } = navbarConfig;

  const handleItemClick = () => {
    setIsOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <Navbar>
      <NavBody>
        <NavbarLogo logo={logo} brandName={brandName} />
        <NavItems items={menuItems} onItemClick={handleItemClick} />
        <div className="flex items-center gap-2 relative z-30">
          <a
            href={socialLinks.github.href}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-colors relative z-30"
            aria-label="GitHub"
          >
            <Github className="h-4 w-4" />
          </a>
          <a
            href={socialLinks.whatsapp.href}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-colors relative z-30"
            aria-label="WhatsApp"
          >
            <IconBrandWhatsapp className="h-4 w-4" />
          </a>
          <ThemeToggle />
        </div>
      </NavBody>
      <MobileNav>
        <MobileNavHeader>
          <NavbarLogo logo={logo} brandName={brandName} />
          <div className="flex items-center gap-2 relative z-30">
            <a
              href={socialLinks.github.href}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-colors relative z-30"
              aria-label="GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              href={socialLinks.whatsapp.href}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-colors relative z-30"
              aria-label="WhatsApp"
            >
              <IconBrandWhatsapp className="h-4 w-4" />
            </a>
            <ThemeToggle />
            <MobileNavToggle isOpen={isOpen} onClick={toggleMobileMenu} />
          </div>
        </MobileNavHeader>
        <MobileNavMenu isOpen={isOpen} onClose={() => setIsOpen(false)}>
          {menuItems.map((item, index) => (
            <a
              key={index}
              href={item.link}
              className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-100 transition-colors"
              onClick={handleItemClick}
            >
              {item.name}
            </a>
          ))}
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
};
