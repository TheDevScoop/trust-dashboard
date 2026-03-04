import { NextResponse } from "next/server";
import { fetchAllEcosystemRepos } from "@/lib/github-client";
import { buildEcosystemData } from "@/lib/coupling-engine";
import type { EcosystemData } from "@/lib/ecosystem-types";

let cachedData: EcosystemData | null = null;
let cachedAt = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("refresh") === "true";

    const now = Date.now();
    if (cachedData && !forceRefresh && now - cachedAt < CACHE_TTL) {
      return NextResponse.json(cachedData, {
        headers: {
          "X-Cache": "HIT",
          "X-Cached-At": new Date(cachedAt).toISOString(),
        },
      });
    }

    const { elizaOSRepos, pluginRepos } = await fetchAllEcosystemRepos();
    const data = await buildEcosystemData(elizaOSRepos, pluginRepos);

    cachedData = data;
    cachedAt = now;

    return NextResponse.json(data, {
      headers: {
        "X-Cache": "MISS",
        "X-Fetched-At": data.meta.fetchedAt,
      },
    });
  } catch (error) {
    console.error("[ecosystem-api] Error fetching ecosystem data:", error);

    // Return cached data if available, even if stale
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          "X-Cache": "STALE",
          "X-Cached-At": new Date(cachedAt).toISOString(),
        },
      });
    }

    return NextResponse.json(
      { error: "Failed to fetch ecosystem data" },
      { status: 500 }
    );
  }
}
