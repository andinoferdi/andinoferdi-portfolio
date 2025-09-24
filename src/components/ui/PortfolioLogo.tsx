import Link from 'next/link';
import Image from 'next/image';

export const PortfolioLogo = () => {
  return (
    <Link
      href="/"
      className="relative z-20 mr-4 flex items-center space-x-2 px-2 py-1 text-sm font-normal text-black dark:text-white"
    >
      <div className="flex h-12 w-12 items-center justify-center">
        <Image
          src="/images/Logo.png"
          alt="Portfolio Logo"
          width={48}
          height={48}
          className="rounded-full object-contain"
          loading="lazy"
        />
      </div>
    </Link>
  );
};
