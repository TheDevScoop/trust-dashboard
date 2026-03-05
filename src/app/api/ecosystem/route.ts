import { NextResponse } from "next/server";
import { fetchAllEcosystemRepos, fetchContributorsForRepos } from "@/lib/github-client";
import { buildEcosystemData } from "@/lib/coupling-engine";
import type { EcosystemData, GitHubRepo } from "@/lib/ecosystem-types";

let cachedData: EcosystemData | null = null;
let cachedAt = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Comprehensive seed data for fallback
function makeSeedRepo(
  org: string,
  name: string,
  desc: string,
  stars: number,
  forks: number,
  language: string,
  topics: string[],
  opts: Partial<GitHubRepo> = {}
): GitHubRepo {
  return {
    id: Math.floor(Math.random() * 1e9),
    name,
    full_name: `${org}/${name}`,
    description: desc,
    html_url: `https://github.com/${org}/${name}`,
    homepage: null,
    stargazers_count: stars,
    forks_count: forks,
    open_issues_count: Math.floor(stars * 0.01),
    language,
    topics,
    updated_at: new Date(Date.now() - Math.random() * 60 * 86400000).toISOString(),
    created_at: "2024-07-09T07:55:40Z",
    pushed_at: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
    fork: false,
    default_branch: "main",
    owner: {
      login: org,
      avatar_url: `https://avatars.githubusercontent.com/u/186240462?v=4`,
    },
    ...opts,
  };
}

function getSeedData(): { elizaOSRepos: GitHubRepo[]; pluginRepos: GitHubRepo[]; communityRepos: GitHubRepo[] } {
  const elizaOSRepos: GitHubRepo[] = [
    makeSeedRepo("elizaOS", "eliza", "Autonomous agents for everyone", 17698, 5449, "TypeScript", 
      ["agent", "agentic", "ai", "autonomous", "chatbot", "crypto", "discord", "eliza", "elizaos", "framework", "plugins", "rag", "slack", "swarm", "telegram"], 
      { homepage: "https://eliza.how/" }),
    makeSeedRepo("elizaOS", "elizaos.github.io", "The elizaOS Website and Leaderboard", 45, 50, "TypeScript", ["elizaos", "website", "leaderboard"]),
    makeSeedRepo("elizaOS", "eliza-starter", "Starter template for building Eliza agents", 371, 579, "TypeScript", ["eliza", "starter", "template"]),
    makeSeedRepo("elizaOS", "characterfile", "A simple file format for character data", 385, 145, "JavaScript", ["character", "agents", "llm"]),
    makeSeedRepo("elizaOS", "agentmemory", "Easy-to-use agent memory, powered by chromadb and postgres", 231, 60, "Python", ["memory", "agent", "rag"]),
    makeSeedRepo("elizaOS", "awesome-eliza", "A curated list of awesome things related to Eliza", 190, 40, "Markdown", ["awesome", "eliza"]),
    makeSeedRepo("elizaOS", "agent-twitter-client", "Twitter/X client for Eliza agents", 60, 25, "TypeScript", ["twitter", "agent"]),
    makeSeedRepo("elizaOS", "knowledge-base", "Knowledge base system for agent memory", 18, 8, "TypeScript", ["knowledge", "rag"]),
    makeSeedRepo("elizaOS", "eliza-docs", "Documentation for elizaOS framework", 30, 15, "MDX", ["docs", "eliza"]),
  ];

  const pluginRepos: GitHubRepo[] = [
    makeSeedRepo("elizaos-plugins", "registry", "Plugin registry for the ElizaOS ecosystem", 50, 30, "TypeScript", ["registry", "plugins", "elizaos"]),
    makeSeedRepo("elizaos-plugins", "plugin-discord", "Discord connector plugin", 25, 12, "TypeScript", ["discord", "plugin"]),
    makeSeedRepo("elizaos-plugins", "plugin-telegram", "Telegram connector plugin", 22, 10, "TypeScript", ["telegram", "plugin"]),
    makeSeedRepo("elizaos-plugins", "plugin-twitter", "Twitter/X connector plugin", 35, 18, "TypeScript", ["twitter", "plugin"]),
    makeSeedRepo("elizaos-plugins", "plugin-solana", "Solana blockchain integration", 30, 15, "TypeScript", ["solana", "crypto"]),
    makeSeedRepo("elizaos-plugins", "plugin-evm", "EVM/Ethereum blockchain support", 28, 14, "TypeScript", ["ethereum", "evm"]),
    makeSeedRepo("elizaos-plugins", "plugin-openai", "OpenAI model integration", 20, 9, "TypeScript", ["openai", "llm"]),
    makeSeedRepo("elizaos-plugins", "plugin-anthropic", "Anthropic Claude integration", 18, 7, "TypeScript", ["anthropic", "claude"]),
    makeSeedRepo("elizaos-plugins", "plugin-image-generation", "AI image generation plugin", 16, 7, "TypeScript", ["image", "ai"]),
    makeSeedRepo("elizaos-plugins", "plugin-whatsapp", "WhatsApp connector plugin", 12, 5, "TypeScript", ["whatsapp", "plugin"]),
    makeSeedRepo("elizaos-plugins", "plugin-slack", "Slack workspace connector", 10, 4, "TypeScript", ["slack", "plugin"]),
    makeSeedRepo("elizaos-plugins", "plugin-github", "GitHub integration plugin", 12, 5, "TypeScript", ["github", "plugin"]),
    makeSeedRepo("elizaos-plugins", "plugin-web-search", "Web search capability", 9, 4, "TypeScript", ["search", "web"]),
    makeSeedRepo("elizaos-plugins", "plugin-starknet", "StarkNet blockchain integration", 8, 3, "TypeScript", ["starknet", "crypto"]),
    makeSeedRepo("elizaos-plugins", "plugin-near", "NEAR Protocol integration", 6, 2, "TypeScript", ["near", "crypto"]),
    makeSeedRepo("elizaos-plugins", "plugin-sui", "Sui blockchain integration", 5, 2, "TypeScript", ["sui", "crypto"]),
    makeSeedRepo("elizaos-plugins", "plugin-farcaster", "Farcaster social protocol", 8, 3, "TypeScript", ["farcaster", "social"]),
    makeSeedRepo("elizaos-plugins", "plugin-lens", "Lens Protocol integration", 7, 2, "TypeScript", ["lens", "social"]),
    makeSeedRepo("elizaos-plugins", "plugin-coinbase", "Coinbase Commerce integration", 10, 5, "TypeScript", ["coinbase", "crypto"]),
    makeSeedRepo("elizaos-plugins", "plugin-tee", "Trusted Execution Environment plugin", 7, 3, "TypeScript", ["tee", "security"]),
    makeSeedRepo("elizaos-plugins", "plugin-ton", "TON blockchain integration", 5, 2, "TypeScript", ["ton", "crypto"]),
    makeSeedRepo("elizaos-plugins", "plugin-aptos", "Aptos blockchain integration", 5, 2, "TypeScript", ["aptos", "crypto"]),
    makeSeedRepo("elizaos-plugins", "plugin-polymarket", "Polymarket prediction market plugin", 4, 2, "TypeScript", ["polymarket", "prediction"]),
    makeSeedRepo("elizaos-plugins", "plugin-rabbi-trader", "Crypto trading agent plugin", 8, 4, "TypeScript", ["trading", "defi"]),
    makeSeedRepo("elizaos-plugins", "plugin-nft-generation", "NFT creation and minting plugin", 6, 2, "TypeScript", ["nft", "crypto"]),
  ];

  const communityRepos: GitHubRepo[] = [
    makeSeedRepo("milady-ai", "milady", "terminally online - eliza fork", 243, 52, "TypeScript", 
      ["agent", "eliza", "elizaos", "autonomous-agents"]),
    makeSeedRepo("jmikedupont2", "ai-agent-terraform", "Terraform framework for deploying elizaOS agents", 25, 18, "HCL", 
      ["agents", "ai", "eliza", "elizaos", "terraform"]),
    makeSeedRepo("multiversx", "mx-agent-kit", "MultiversX AI Agent Kit for elizaOS", 23, 3, "Shell", 
      ["agents", "ai", "eliza", "elizaos", "multiversx"]),
    makeSeedRepo("fleek-network", "eliza-fleek", "Eliza deployment on Fleek", 15, 8, "TypeScript", 
      ["eliza", "fleek", "deployment"]),
  ];

  return { elizaOSRepos, pluginRepos, communityRepos };
}

export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("refresh") === "true";

    const now = Date.now();
    if (cachedData && !forceRefresh && now - cachedAt < CACHE_TTL) {
      console.log("[ecosystem-api] Returning cached data");
      return NextResponse.json(cachedData, {
        headers: {
          "X-Cache": "HIT",
          "X-Cached-At": new Date(cachedAt).toISOString(),
        },
      });
    }

    let elizaOSRepos: GitHubRepo[] = [];
    let pluginRepos: GitHubRepo[] = [];
    let communityRepos: GitHubRepo[] = [];
    let source = "live";

    try {
      console.log("[ecosystem-api] Starting live GitHub fetch...");
      const liveData = await fetchAllEcosystemRepos();
      elizaOSRepos = liveData.elizaOSRepos;
      pluginRepos = liveData.pluginRepos;
      communityRepos = liveData.communityRepos;

      const totalRepos = elizaOSRepos.length + pluginRepos.length + communityRepos.length;
      console.log(`[ecosystem-api] Live fetch got ${totalRepos} repos total`);

      // If we got very few results, the API likely failed
      if (totalRepos < 10) {
        console.warn("[ecosystem-api] Too few results from GitHub, using seed data");
        throw new Error("Insufficient data from GitHub API");
      }

    } catch (apiError) {
      console.warn("[ecosystem-api] GitHub API failed, falling back to seed data:", apiError);
      const seed = getSeedData();
      elizaOSRepos = seed.elizaOSRepos;
      pluginRepos = seed.pluginRepos;
      communityRepos = seed.communityRepos;
      source = "seed";
    }

    // Fetch contributors for top repos (only if we have a token to avoid rate limits)
    let contributorMap = new Map();
    if (process.env.GITHUB_TOKEN && source === "live") {
      try {
        const allRepos = [...elizaOSRepos, ...pluginRepos, ...communityRepos];
        contributorMap = await fetchContributorsForRepos(allRepos, 20, 5);
      } catch (err) {
        console.warn("[ecosystem-api] Failed to fetch contributors:", err);
      }
    }

    const data = await buildEcosystemData(elizaOSRepos, pluginRepos, communityRepos, contributorMap);

    cachedData = data;
    cachedAt = now;

    const duration = Date.now() - startTime;
    console.log(`[ecosystem-api] Built ecosystem data in ${duration}ms. Source: ${source}`);

    return NextResponse.json(data, {
      headers: {
        "X-Cache": "MISS",
        "X-Source": source,
        "X-Duration-Ms": duration.toString(),
        "X-Fetched-At": data.meta.fetchedAt,
      },
    });
  } catch (error) {
    console.error("[ecosystem-api] Fatal error:", error);

    // Return cached data if available
    if (cachedData) {
      console.log("[ecosystem-api] Returning stale cached data after error");
      return NextResponse.json(cachedData, {
        headers: { "X-Cache": "STALE" },
      });
    }

    // Last resort: build from seed data
    try {
      console.log("[ecosystem-api] Building from seed data as last resort...");
      const seed = getSeedData();
      const data = await buildEcosystemData(seed.elizaOSRepos, seed.pluginRepos, seed.communityRepos);
      cachedData = data;
      cachedAt = Date.now();
      return NextResponse.json(data, {
        headers: { "X-Cache": "SEED", "X-Source": "seed-fallback" },
      });
    } catch (seedError) {
      console.error("[ecosystem-api] Even seed data failed:", seedError);
      return NextResponse.json(
        { error: "Failed to build ecosystem data", details: String(seedError) },
        { status: 500 }
      );
    }
  }
}
