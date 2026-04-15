"use client";

import { startTransition, useEffect, useRef, useState, useMemo } from "react";
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
  const outerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const activeItem = useMemo(
    () => items.find((item) => item.id === activeTab),
    [activeTab, items],
  );

  // Animate the outer wrapper to match the inner panel height
  useEffect(() => {
    const outer = outerRef.current;
    const panel = panelRef.current;
    if (!outer || !panel) return;

    // Measure once on mount / tab change
    const applyHeight = () => {
      const h = panel.getBoundingClientRect().height;
      if (h > 0) outer.style.height = `${h}px`;
    };

    applyHeight();

    // Keep tracking in case inner content shifts (e.g. images load)
    const ro = new ResizeObserver(() => applyHeight());
    ro.observe(panel);
    return () => ro.disconnect();
  }, [activeItem]);

  return (
    <div
      ref={outerRef}
      className={cn(
        "w-full overflow-hidden transition-[height] duration-300 ease-in-out",
        className,
      )}
      // no explicit height style here — it's driven by the effect above
    >
      {activeItem && (
        <div
          ref={panelRef}
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
