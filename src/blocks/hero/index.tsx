'use client';

export function HeroContent() {
  return (
    <section 
      className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 relative"
      role="main"
      aria-labelledby="hero-heading"
    >
      <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8 lg:space-y-10 relative z-10">
        <div className="space-y-4">
          <h1 
            id="hero-heading"
            className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-foreground tracking-tight leading-tight"
          >
            Your Name
          </h1>
          <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl text-muted-foreground font-light">
            Full Stack Developer
          </h2>
        </div>
        
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2 sm:px-0">
          Crafting exceptional digital experiences with modern technologies. 
          Passionate about clean code, innovative solutions, and user-centered design.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8 sm:mt-10 lg:mt-12 px-2 sm:px-0">
          <button
            className="bg-primary text-primary-foreground px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-medium text-base sm:text-lg hover:opacity-90 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background min-w-[140px] sm:min-w-[160px] w-full sm:w-auto"
            aria-label="View my work and projects"
          >
            View My Work
          </button>
          <button
            className="border border-border text-foreground px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-medium text-base sm:text-lg hover:bg-secondary hover:text-secondary-foreground transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-border focus:ring-offset-2 focus:ring-offset-background min-w-[140px] sm:min-w-[160px] w-full sm:w-auto"
            aria-label="Get in touch with me"
          >
            Get In Touch
          </button>
        </div>
      </div>
    </section>
  );
}
