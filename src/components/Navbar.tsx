"use client";
import {
  Navbar,
  NavBody,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { IconBrandGithub, IconBrandWhatsapp } from "@tabler/icons-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export function MainNavbar() {
  const pathname = usePathname();
  
  const navItems = [
    {
      name: "Home",
      link: "/",
    },
    {
      name: "Projects",
      link: "/projects",
    },
    {
      name: "About",
      link: "/about",
    },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <Navbar>
      <NavBody>
        <NavbarLogo />
        <CustomNavItems items={navItems} pathname={pathname} />
        <div className="flex items-center gap-4">
          <NavbarButton
            variant="secondary"
            href="https://github.com/andinoferdi"
            className="border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
          >
            <IconBrandGithub size={20} />
          </NavbarButton>
          <NavbarButton
            variant="secondary"
            href="https://wa.me/6281359528944"
            className="border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
          >
            <IconBrandWhatsapp size={20} />
          </NavbarButton>
        </div>
      </NavBody>

      <MobileNav>
        <MobileNavHeader>
          <NavbarLogo />
          <MobileNavToggle
            isOpen={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />
        </MobileNavHeader>

        <MobileNavMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        >
          {navItems.map((item, idx) => (
            <Link
              key={`mobile-link-${idx}`}
              href={item.link}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`relative px-4 py-2 rounded-full ${
                pathname === item.link
                  ? "text-white font-semibold border border-white"
                  : "text-neutral-600 dark:text-neutral-300"
              }`}
            >
              <span className="block">{item.name}</span>
            </Link>
          ))}
          <div className="flex w-full flex-col gap-4">
            <NavbarButton
              onClick={() => setIsMobileMenuOpen(false)}
              variant="secondary"
              className="w-full border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 flex items-center justify-center gap-2"
              href="https://github.com/andinoferdi"
            >
              <IconBrandGithub size={20} />
              <span>GitHub</span>
            </NavbarButton>
            <NavbarButton
              onClick={() => setIsMobileMenuOpen(false)}
              variant="primary"
              href="https://wa.me/6281359528944"
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <IconBrandWhatsapp size={20} />
              <span>WhatsApp</span>
            </NavbarButton>
          </div>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}

function CustomNavItems({ items, pathname }: { items: { name: string; link: string }[], pathname: string }) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div
      onMouseLeave={() => setHovered(null)}
      className="absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-2 text-sm font-medium text-zinc-600 transition duration-200 hover:text-zinc-800 lg:flex lg:space-x-2"
    >
      {items.map((item, idx) => (
        <Link
          onMouseEnter={() => setHovered(idx)}
          className={`relative px-4 py-2 ${
            pathname === item.link 
              ? "text-white font-semibold border border-white rounded-full" 
              : "text-neutral-600 dark:text-neutral-300"
          }`}
          key={`link-${idx}`}
          href={item.link}
        >
          {hovered === idx && pathname !== item.link && (
            <div className="absolute inset-0 h-full w-full rounded-full bg-gray-100 dark:bg-neutral-800" />
          )}
          <span className="relative z-20">{item.name}</span>
        </Link>
      ))}
    </div>
  );
}
