# Andino Ferdiansah - Portfolio Website

A modern, responsive portfolio website built with Next.js 15, TypeScript, and TailwindCSS. Features an intelligent loading screen with asset preloading, interactive music player, and smooth animations.


## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5.9.2
- **Styling**: TailwindCSS 4.1.13
- **Animation**: Framer Motion
- **Icons**: Lucide React, Tabler Icons
- **Build Tool**: Turbopack
- **Font**: Poppins (Google Fonts)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone https://github.com/andinoferdi/andinoferdi-portfolio.git
cd andinoferdi-portfolio
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── blocks/                 # Page-level components
│   ├── home/              # Home page sections
│   └── projects/          # Projects page
├── components/             # Reusable components
│   ├── ui/                # UI components (buttons, cards, etc.)
│   ├── providers/         # Context providers
│   ├── loading-screen.tsx  # Smart loading screen
│   ├── mini-player.tsx    # Music player component
│   └── ...
├── services/               # Business logic layer
│   ├── asset-preloader.ts # Asset preloading service
│   ├── hero.ts            # Hero section data
│   ├── projects.ts        # Projects data
│   ├── music.ts           # Music player data
│   └── ...
├── types/                  # TypeScript type definitions
├── hooks/                  # Custom React hooks
├── stores/                 # State management
└── lib/                    # Utility functions
```


### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm run start
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Andino Ferdiansah**
- GitHub: [@andinoferdi](https://github.com/andinoferdi)
- LinkedIn: [Andino Ferdiansah](https://linkedin.com/in/andinoferdi)
- Email: andinoferdiansah@gmail.com
