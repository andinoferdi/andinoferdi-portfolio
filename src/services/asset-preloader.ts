import { getProfileData } from "@/services/profile";
import { getProjectsData } from "@/services/projects";
import { getExperienceData } from "@/services/journey";
import { getOriginalTracks } from "@/services/music";

export interface AssetPreloadResult {
  success: boolean;
  loaded: number;
  total: number;
  errors: string[];
}

export class AssetPreloader {
  private static instance: AssetPreloader;
  private loadedAssets = new Set<string>();
  private loadingPromises = new Map<string, Promise<void>>();

  static getInstance(): AssetPreloader {
    if (!AssetPreloader.instance) {
      AssetPreloader.instance = new AssetPreloader();
    }
    return AssetPreloader.instance;
  }

  private preloadImage(src: string): Promise<void> {
    if (this.loadedAssets.has(src)) {
      return Promise.resolve();
    }

    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)!;
    }

    const promise = new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.loadedAssets.add(src);
        this.loadingPromises.delete(src);
        resolve();
      };
      img.onerror = () => {
        this.loadingPromises.delete(src);
        reject(new Error(`Failed to load image: ${src}`));
      };
      img.src = src;
    });

    this.loadingPromises.set(src, promise);
    return promise;
  }

  private preloadAudio(src: string): Promise<void> {
    if (this.loadedAssets.has(src)) {
      return Promise.resolve();
    }

    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)!;
    }

    const promise = new Promise<void>((resolve, reject) => {
      const audio = new Audio();
      audio.oncanplaythrough = () => {
        this.loadedAssets.add(src);
        this.loadingPromises.delete(src);
        resolve();
      };
      audio.onerror = () => {
        this.loadingPromises.delete(src);
        reject(new Error(`Failed to load audio: ${src}`));
      };
      audio.preload = "metadata";
      audio.src = src;
    });

    this.loadingPromises.set(src, promise);
    return promise;
  }

  async preloadAllAssets(): Promise<AssetPreloadResult> {
    const profileData = getProfileData();
    const projectsData = getProjectsData();
    const experienceData = getExperienceData();
    const musicData = getOriginalTracks();

    const imageAssets = [
      "/images/Logo.png",
      ...profileData.profiles.map(profile => profile.src),
      ...projectsData.projects.map(project => project.image),
      ...experienceData.experiences
        .filter(exp => exp.logo)
        .map(exp => exp.logo!),
      ...musicData.map(track => track.coverImage),
    ];

    const audioAssets = musicData.map(track => track.audioUrl);

    const allAssets = [
      ...imageAssets.map(src => ({ src, type: 'image' as const })),
      ...audioAssets.map(src => ({ src, type: 'audio' as const })),
    ];

    const results = await Promise.allSettled(
      allAssets.map(asset => 
        asset.type === 'image' 
          ? this.preloadImage(asset.src)
          : this.preloadAudio(asset.src)
      )
    );

    const errors: string[] = [];
    let loaded = 0;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        loaded++;
      } else {
        errors.push(`${allAssets[index].src}: ${result.reason.message}`);
      }
    });

    return {
      success: errors.length === 0,
      loaded,
      total: allAssets.length,
      errors,
    };
  }

  isAssetLoaded(src: string): boolean {
    return this.loadedAssets.has(src);
  }

  getLoadedAssetsCount(): number {
    return this.loadedAssets.size;
  }

  clearCache(): void {
    this.loadedAssets.clear();
    this.loadingPromises.clear();
  }
}

export const assetPreloader = AssetPreloader.getInstance();
