"use client";

import { useState } from "react";
import Link from "next/link";
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
import { ModeToggle } from "@/components/ui/mode-toggle";
import { SocialLinks } from "@/components/ui/social-links";

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
          <SocialLinks socialLinks={socialLinks} />
          <ModeToggle />
        </div>
      </NavBody>
      <MobileNav>
        <MobileNavHeader>
          <NavbarLogo logo={logo} brandName={brandName} />
          <div className="flex items-center gap-2 relative z-30">
            <SocialLinks socialLinks={socialLinks} />
            <ModeToggle />
            <MobileNavToggle isOpen={isOpen} onClick={toggleMobileMenu} />
          </div>
        </MobileNavHeader>
        <MobileNavMenu isOpen={isOpen} onClose={() => setIsOpen(false)}>
          {menuItems.map((item, index) => (
            <Link
              key={index}
              href={item.link}
              className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-all duration-300 ease-out hover:scale-105 font-medium"
              onClick={handleItemClick}
            >
              {item.name}
            </Link>
          ))}
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
};
