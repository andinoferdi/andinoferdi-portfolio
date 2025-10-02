"use client";

import { getFooterConfig } from "@/stores/footer-menu";
import {
  Footer as ResizableFooter,
  FooterBody,
  FooterSection,
  FooterLogo,
  FooterSocial,
  FooterCopyright,
} from "@/components/ui/resizable-footer";

export const DemoFooter = () => {
  const footerConfig = getFooterConfig();
  const { sections, socialLinks, logo, brandName, copyright } = footerConfig;

  return (
    <ResizableFooter>
      <FooterBody>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <FooterLogo logo={logo} brandName={brandName} />
            <p className="text-sm text-muted-foreground max-w-xs">
              Building the future of web development with modern tools and best practices.
            </p>
            <FooterSocial socialLinks={socialLinks} />
          </div>
          
          {sections.map((section, index) => (
            <FooterSection
              key={index}
              title={section.title}
              links={section.links}
            />
          ))}
        </div>
        
        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <FooterCopyright copyright={copyright} />
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Made with ❤️ using Next.js</span>
            </div>
          </div>
        </div>
      </FooterBody>
    </ResizableFooter>
  );
};
