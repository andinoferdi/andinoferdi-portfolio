import { cn } from '@/lib/utils';

interface PageTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTitle({ children, className }: PageTitleProps) {
  return (
    <h1
      className={cn(
        'text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-8',
        className
      )}
    >
      {children}
    </h1>
  );
}
