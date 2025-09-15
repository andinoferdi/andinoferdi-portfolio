import { cn } from '@/lib/utils';

interface TitleProps {
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'text-lg md:text-xl font-semibold',
  md: 'text-xl md:text-2xl font-semibold',
  lg: 'text-2xl md:text-3xl font-bold',
  xl: 'text-3xl md:text-4xl font-bold',
};

export function Title({ 
  children, 
  as: Component = 'h2', 
  className, 
  size = 'md' 
}: TitleProps) {
  return (
    <Component
      className={cn(
        'text-foreground tracking-tight',
        sizeClasses[size],
        className
      )}
    >
      {children}
    </Component>
  );
}
