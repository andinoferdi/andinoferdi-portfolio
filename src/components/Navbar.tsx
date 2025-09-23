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
import { usePrefetchOnHover } from "@/hooks/use-prefetch";
import { useCacheStatus } from "@/hooks/use-cache-status";
import { useAlert } from "@/hooks/use-alert";
import { IconDatabase, IconTrash, IconRefresh } from "@tabler/icons-react";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";

export function MainNavbar() {
  const pathname = usePathname();
  const { prefetchOnHover } = usePrefetchOnHover();
  const { totalSize, isLoading, formatBytes, clearAllCache, clearSWCache, refreshCacheStatus } = useCacheStatus();
  const { confirmAlert, showAlert, AlertComponent } = useAlert();
  
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

  const handleClearAll = async () => {
    const confirmed = await confirmAlert(
      'Clear All Caches',
      'Are you sure you want to clear all caches? This will reload the page.'
    );
    if (confirmed) {
      await clearAllCache();
      showAlert('success', 'Success', 'All caches have been cleared successfully!');
    }
  };

  const handleClearSW = async () => {
    const confirmed = await confirmAlert(
      'Clear Service Worker Cache',
      'Are you sure you want to clear Service Worker cache?'
    );
    if (confirmed) {
      await clearSWCache();
      showAlert('success', 'Success', 'Service Worker cache has been cleared successfully!');
    }
  };

  return (
    <>
      <AlertComponent />
      <Navbar>
        <NavBody>
        <NavbarLogo />
        <CustomNavItems
          items={navItems}
          pathname={pathname}
          prefetchOnHover={prefetchOnHover}
        />
        <div className="flex items-center gap-4">
          <NavbarButton
            variant="secondary"
            href="https://github.com/andinoferdi"
            ariaLabel="Visit my GitHub profile"
            className="border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
          >
            <IconBrandGithub size={20} aria-hidden="true" />
          </NavbarButton>
          <NavbarButton
            variant="secondary"
            href="https://wa.me/6281359528944"
            ariaLabel="Contact me on WhatsApp"
            className="border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
          >
            <IconBrandWhatsapp size={20} aria-hidden="true" />
          </NavbarButton>
          <Dropdown>
            <DropdownTrigger>
              <NavbarButton
                variant="secondary"
                ariaLabel="Cache Manager"
                className="border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 flex items-center justify-center gap-2"
              >
                <IconDatabase size={20} aria-hidden="true" />
                <span className="hidden sm:inline">
                  {isLoading ? '...' : formatBytes(totalSize)}
                </span>
              </NavbarButton>
            </DropdownTrigger>
            <DropdownMenu 
              aria-label="Cache Actions"
              className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-gray-700 shadow-lg"
            >
              <DropdownItem 
                key="refresh" 
                startContent={<IconRefresh size={16} />}
                onPress={refreshCacheStatus}
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Refresh Status
              </DropdownItem>
              <DropdownItem 
                key="clear-sw" 
                startContent={<IconTrash size={16} />}
                onPress={handleClearSW}
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Clear SW Cache
              </DropdownItem>
              <DropdownItem 
                key="clear-all" 
                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" 
                color="danger"
                startContent={<IconTrash size={16} />}
                onPress={handleClearAll}
              >
                Clear All Caches
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
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
              ariaLabel="Visit my GitHub profile"
              className="w-full border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 flex items-center justify-center gap-2"
              href="https://github.com/andinoferdi"
            >
              <IconBrandGithub size={20} aria-hidden="true" />
              <span>GitHub</span>
            </NavbarButton>
            <NavbarButton
              onClick={() => setIsMobileMenuOpen(false)}
              variant="secondary"
              ariaLabel="Contact me on WhatsApp"
              href="https://wa.me/6281359528944"
              className="w-full border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 flex items-center justify-center gap-2"
            >
              <IconBrandWhatsapp size={20} aria-hidden="true" />
              <span>WhatsApp</span>
            </NavbarButton>
            <Dropdown>
              <DropdownTrigger>
                <NavbarButton
                  variant="secondary"
                  ariaLabel="Cache Manager"
                  className="w-full border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 flex items-center justify-center gap-2"
                >
                  <IconDatabase size={20} aria-hidden="true" />
                  <span>{isLoading ? '...' : formatBytes(totalSize)}</span>
                </NavbarButton>
              </DropdownTrigger>
              <DropdownMenu 
                aria-label="Cache Actions"
                className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-gray-700 shadow-lg"
              >
                <DropdownItem 
                  key="refresh" 
                  startContent={<IconRefresh size={16} />}
                  onPress={refreshCacheStatus}
                  className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Refresh Status
                </DropdownItem>
                <DropdownItem 
                  key="clear-sw" 
                  startContent={<IconTrash size={16} />}
                  onPress={handleClearSW}
                  className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Clear SW Cache
                </DropdownItem>
                <DropdownItem 
                  key="clear-all" 
                  className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" 
                  color="danger"
                  startContent={<IconTrash size={16} />}
                  onPress={handleClearAll}
                >
                  Clear All Caches
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
    </>
  );
}

function CustomNavItems({ 
  items, 
  pathname, 
  prefetchOnHover 
}: { 
  items: { name: string; link: string }[];
  pathname: string;
  prefetchOnHover: (href: string) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  const handleMouseEnter = (idx: number, link: string) => {
    setHovered(idx);
    prefetchOnHover(link);
  };

  return (
    <div
      onMouseLeave={() => setHovered(null)}
      className="absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-2 text-sm font-medium text-zinc-600 transition duration-200 hover:text-zinc-800 lg:flex lg:space-x-2"
    >
      {items.map((item, idx) => (
        <Link
          onMouseEnter={() => handleMouseEnter(idx, item.link)}
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
