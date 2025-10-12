// analyze-routes.ts
import fs from 'fs';
import path from 'path';

// --- Types for the Webpack stats JSON ---
interface Asset {
  name: string;
  size: number; // in bytes
}

interface ChunkGroupAsset {
  name: string;
}

interface ChunkGroup {
  assets: ChunkGroupAsset[];
}

interface Stats {
  assets: Asset[];
  namedChunkGroups: Record<string, ChunkGroup>;
}

// --- Load stats file ---
const statsPath = path.resolve('.next/analyze/client-stats.json');
const stats = JSON.parse(fs.readFileSync(statsPath, 'utf-8')) as Stats;

// Threshold in KB
const MAX_ROUTE_SIZE = 300;

// --- Analyze routes ---
interface OversizedRoute {
  route: string;
  size: number; // in KB
}

const oversized: OversizedRoute[] = [];

for (const [route, data] of Object.entries(stats.namedChunkGroups)) {
  let totalSize = 0;

  for (const asset of data.assets) {
    const a = stats.assets.find((x) => x.name === asset.name);
    if (a) {
      totalSize += a.size;
    }
  }

  const kb = Math.round(totalSize / 1024);
  if (kb > MAX_ROUTE_SIZE) {
    oversized.push({ route, size: kb });
  }
}

// --- Report results ---
if (oversized.length) {
  console.error('❌ Oversized routes detected:');
  oversized.forEach((r) => {
    console.error(`- ${r.route}: ${r.size.toString()} KB`);
  });
  process.exit(1);
} else {
  console.log('✅ All routes are within size limits.');
}
