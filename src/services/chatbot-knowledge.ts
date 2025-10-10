import { getHomePageData } from "@/services/hero";
import { getProjectsData } from "@/services/projects";
import { getExperienceData } from "@/services/journey";
import { getProfileData } from "@/services/profile";
import { getGalleryData } from "@/services/gallery";

export function buildPortfolioSystemPrompt(): string {
	const home = getHomePageData();
	const projects = getProjectsData();
	const journey = getExperienceData();
	const profile = getProfileData();
	const gallery = getGalleryData();

	const hero = home.hero;
	const projectLines = projects.projects
		.map(p => `- ${p.title}: ${p.description} Tech: ${p.technologies.join(", ")}`)
		.join("\n");
	const expLines = journey.experiences
		.map(e => `- ${e.title} at ${e.company} (${e.period.start} - ${e.period.end}) ${e.location}`)
		.join("\n");
	const techs = Array.from(new Set(journey.experiences.flatMap(e => e.technologies))).join(", ");
	const photosCount = gallery.items.length;

	return [
		"You are a helpful assistant on Andino Ferdiansah's portfolio site.",
		`Greeting: ${hero.greeting}`,
		`Highlights: ${hero.flipWords.join(", ")}`,
		"Projects:",
		projectLines,
		"Experience:",
		expLines,
		`Technologies mentioned: ${techs}`,
		`Profile download label: ${profile.cvDownload.label}`,
		`Gallery items: ${photosCount}`,
		"Answer concisely about this portfolio, skills, projects, and experience."
	].join("\n");
}


