import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AssetKind = "image" | "audio" | "document" | "other";

interface PreloadManifestAsset {
  url: string;
  kind: AssetKind;
  size: number;
}

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
  ".gif",
  ".svg",
]);

const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".ogg", ".m4a"]);
const DOCUMENT_EXTENSIONS = new Set([".pdf"]);

const PUBLIC_DIR = path.join(process.cwd(), "public");

const getKindFromFile = (filePath: string): AssetKind => {
  const ext = path.extname(filePath).toLowerCase();
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  if (AUDIO_EXTENSIONS.has(ext)) return "audio";
  if (DOCUMENT_EXTENSIONS.has(ext)) return "document";
  return "other";
};

const toPublicUrl = (absolutePath: string): string => {
  const relativePath = path.relative(PUBLIC_DIR, absolutePath);
  const normalized = relativePath.split(path.sep).join("/");
  return `/${normalized}`;
};

const collectAssets = async (directory: string): Promise<PreloadManifestAsset[]> => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const assets: PreloadManifestAsset[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      const nestedAssets = await collectAssets(fullPath);
      assets.push(...nestedAssets);
      continue;
    }

    if (!entry.isFile()) continue;

    const stats = await fs.stat(fullPath);
    assets.push({
      url: toPublicUrl(fullPath),
      kind: getKindFromFile(fullPath),
      size: stats.size,
    });
  }

  return assets;
};

export async function GET() {
  try {
    const assets = await collectAssets(PUBLIC_DIR);
    assets.sort((a, b) => a.url.localeCompare(b.url));

    const totalBytes = assets.reduce((sum, asset) => sum + asset.size, 0);

    return NextResponse.json(
      {
        assets,
        totalCount: assets.length,
        totalBytes,
        generatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Failed to build preload asset manifest:", error);
    return NextResponse.json(
      { error: "Failed to build preload manifest" },
      { status: 500 }
    );
  }
}

