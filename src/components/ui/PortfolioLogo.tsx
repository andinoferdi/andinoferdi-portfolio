import Link from 'next/link';

export const PortfolioLogo = () => {
  return (
    <Link
      href="/"
      className="relative z-20 mr-4 flex items-center space-x-2 px-2 py-1 text-sm font-normal text-black dark:text-white"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black dark:bg-white">
        <span className="text-sm font-bold text-white dark:text-black">P</span>
      </div>
      <span className="font-medium text-black dark:text-white">Portfolio</span>
    </Link>
  );
};
