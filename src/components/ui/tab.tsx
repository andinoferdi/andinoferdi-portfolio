"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import AOS from "aos";
import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabProps {
  items: TabItem[];
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

interface TabListProps {
  items: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

interface TabContentProps {
  items: TabItem[];
  activeTab: string;
  className?: string;
}

export const Tab = ({
  items,
  defaultValue,
  onValueChange,
  className,
}: TabProps) => {
  const [activeTab, setActiveTab] = useState(
    defaultValue || items[0]?.id || "",
  );

  const handleTabChange = (tabId: string) => {
    startTransition(() => {
      setActiveTab(tabId);
    });
    onValueChange?.(tabId);
  };

  return (
    <div className={cn("w-full", className)}>
      <TabList
        items={items}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      <TabContent items={items} activeTab={activeTab} />
    </div>
  );
};

export const TabList = ({
  items,
  activeTab,
  onTabChange,
  className,
}: TabListProps) => {
  return (
    <div className={cn("flex justify-center mb-8", className)}>
      <div className="flex rounded-lg border border-border bg-muted p-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "px-6 py-3 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer",
              activeTab === item.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export const TabContent = ({
  items,
  activeTab,
  className,
}: TabContentProps) => {
  const activeItem = useMemo(
    () => items.find((item) => item.id === activeTab),
    [activeTab, items],
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      AOS.refreshHard();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeItem]);

  return (
    <div className={cn("w-full", className)}>
      {activeItem && (
        <div
          key={activeItem.id}
          role="tabpanel"
          aria-hidden={false}
          className="w-full animate-in fade-in-0 duration-200"
        >
          {activeItem.content}
        </div>
      )}
    </div>
  );
};

export { type TabItem, type TabProps, type TabListProps, type TabContentProps };
