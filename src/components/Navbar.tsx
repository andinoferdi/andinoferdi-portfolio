'use client';

import React, { useState } from 'react';
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavbarButton,
} from '@/components/ui/resizable-navbar';
import { PortfolioLogo } from '@/components/ui/PortfolioLogo';

const navItems = [
  { name: 'Home', link: '/' },
  { name: 'About', link: '#about' },
  { name: 'Projects', link: '#projects' },
  { name: 'Experience', link: '#experience' },
  { name: 'Contact', link: '#contact' },
];

export default function PortfolioNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Navbar>
      {/* Desktop Navigation */}
      <NavBody>
        <div className="flex items-center">
          <PortfolioLogo />
        </div>

        <NavItems 
          items={navItems}
          onItemClick={() => setIsOpen(false)}
        />

        <div className="flex items-center space-x-4">
          <NavbarButton 
            variant="secondary" 
            href="#contact"
          >
            Contact
          </NavbarButton>
          <NavbarButton 
            variant="dark" 
            href="/resume.pdf"
            target="_blank"
          >
            Resume
          </NavbarButton>
        </div>
      </NavBody>

      {/* Mobile Navigation */}
      <MobileNav>
        <MobileNavHeader>
          <PortfolioLogo />
          <MobileNavToggle 
            isOpen={isOpen} 
            onClick={() => setIsOpen(!isOpen)} 
          />
        </MobileNavHeader>

        <MobileNavMenu 
          isOpen={isOpen}
        >
          <div className="flex flex-col space-y-4 w-full">
            {navItems.map((item, idx) => (
              <a
                key={`mobile-${idx}`}
                href={item.link}
                onClick={() => setIsOpen(false)}
                className="block w-full px-4 py-3 text-base text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100 transition-colors rounded-md hover:bg-gray-50 dark:hover:bg-neutral-800"
              >
                {item.name}
              </a>
            ))}
            <div className="flex flex-col space-y-3 pt-6 border-t border-gray-200 dark:border-neutral-700 w-full">
              <NavbarButton 
                variant="secondary" 
                href="#contact"
                onClick={() => setIsOpen(false)}
              >
                Contact
              </NavbarButton>
              <NavbarButton 
                variant="dark" 
                href="/resume.pdf"
                target="_blank"
                onClick={() => setIsOpen(false)}
              >
                Resume
              </NavbarButton>
            </div>
          </div>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}
