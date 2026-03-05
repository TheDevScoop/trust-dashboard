import { NextResponse } from "next/server";
import { fetchAllEcosystemRepos } from "@/lib/github-client";
import { buildEcosystemData } from "@/lib/coupling-engine";
import type { EcosystemData, GitHubRepo } from "@/lib/ecosystem-types";

let cachedData: EcosystemData | null = null;
let cachedAt = 0;
const CACHE_TTL = 5 * 60 * 1000;

// Comprehensive seed data so the graph always loads
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

function getSeedData(): { elizaOSRepos: GitHubRepo[]; pluginRepos: GitHubRepo[] } {
  const elizaOSRepos: GitHubRepo[] = [
    makeSeedRepo("elizaOS", "eliza", "Autonomous agents for everyone", 17680, 5447, "TypeScript", ["agent", "agentic", "ai", "autonomous", "chatbot", "crypto", "discord", "eliza", "elizaos", "framework", "plugins", "rag", "slack", "swarm", "telegram"], { homepage: "https://eliza.how/" }),
    makeSeedRepo("elizaOS", "elizaos.github.io", "The elizaOS Website and Leaderboard", 45, 50, "TypeScript", ["elizaos", "website", "leaderboard"]),
    makeSeedRepo("elizaOS", "eliza-starter", "Starter template for building Eliza agents", 240, 180, "TypeScript", ["eliza", "starter", "template", "agent"]),
    makeSeedRepo("elizaOS", "characterfile", "A simple file format for character data", 320, 110, "TypeScript", ["character", "ai", "npc", "personality"]),
    makeSeedRepo("elizaOS", "awesome-eliza", "A curated list of awesome things related to Eliza", 190, 40, "Markdown", ["awesome", "eliza", "list"]),
    makeSeedRepo("elizaOS", "agentmemory", "Easy-to-use agent memory backed by chromadb + postgres", 90, 25, "Python", ["memory", "agent", "rag", "chromadb"]),
    makeSeedRepo("elizaOS", "eliza-2004scape", "Eliza plays Runescape", 0, 0, "TypeScript", []),
    makeSeedRepo("elizaOS", "openclaw-adapter", "Run Eliza plugins inside OpenClaw", 37, 7, "TypeScript", []),
    makeSeedRepo("elizaOS", "benchmarks", "Benchmark suite for elizaOS agents", 5, 0, "Python", []),
    makeSeedRepo("elizaOS", "examples", "Examples of how to use elizaOS", 4, 0, "TypeScript", []),
    makeSeedRepo("elizaOS", "prr", "PR review and repo management agent", 3, 1, "TypeScript", []),
    makeSeedRepo("elizaOS", "token-manager", "Token balance management for agents", 15, 5, "TypeScript", ["token", "agent", "crypto"]),
    makeSeedRepo("elizaOS", "runtime-config", "Runtime configuration system for elizaOS", 8, 2, "TypeScript", ["config", "runtime"]),
    makeSeedRepo("elizaOS", "agent-twitter-client", "Twitter/X client for Eliza agents", 60, 25, "TypeScript", ["twitter", "x", "agent", "social"]),
    makeSeedRepo("elizaOS", "knowledge-base", "Knowledge base system for agent memory", 18, 8, "TypeScript", ["knowledge", "rag", "memory"]),
    makeSeedRepo("elizaOS", "eliza-docs", "Documentation for elizaOS framework", 30, 15, "MDX", ["docs", "documentation", "eliza"]),
  ];

  const pluginRepos: GitHubRepo[] = [
    makeSeedRepo("elizaos-plugins", "registry", "Plugin registry for the ElizaOS ecosystem", 50, 30, "TypeScript", ["registry", "plugins", "elizaos"]),
    makeSeedRepo("elizaos-plugins", "plugin-discord", "Discord connector plugin", 25, 12, "TypeScript", ["discord", "plugin", "connector"]),
    makeSeedRepo("elizaos-plugins", "plugin-telegram", "Telegram connector plugin", 22, 10, "TypeScript", ["telegram", "plugin", "connector"]),
    makeSeedRepo("elizaos-plugins", "plugin-twitter", "Twitter/X connector plugin", 35, 18, "TypeScript", ["twitter", "plugin", "connector"]),
    makeSeedRepo("elizaos-plugins", "plugin-solana", "Solana blockchain integration", 30, 15, "TypeScript", ["solana", "crypto", "blockchain"]),
    makeSeedRepo("elizaos-plugins", "plugin-evm", "EVM/Ethereum blockchain support", 28, 14, "TypeScript", ["ethereum", "evm", "crypto"]),
    makeSeedRepo("elizaos-plugins", "plugin-node", "Node.js runtime plugin", 15, 8, "TypeScript", ["node", "runtime"]),
    makeSeedRepo("elizaos-plugins", "plugin-openai", "OpenAI model integration", 20, 9, "TypeScript", ["openai", "llm", "ai"]),
    makeSeedRepo("elizaos-plugins", "plugin-anthropic", "Anthropic Claude integration", 18, 7, "TypeScript", ["anthropic", "claude", "llm"]),
    makeSeedRepo("elizaos-plugins", "plugin-local-ai", "Local AI model support", 14, 5, "TypeScript", ["local", "llm", "ai"]),
    makeSeedRepo("elizaos-plugins", "plugin-bootstrap", "Bootstrap/core actions plugin", 12, 6, "TypeScript", ["bootstrap", "core"]),
    makeSeedRepo("elizaos-plugins", "plugin-image-generation", "AI image generation plugin", 16, 7, "TypeScript", ["image", "generation", "ai"]),
    makeSeedRepo("elizaos-plugins", "plugin-video-generation", "AI video generation plugin", 10, 4, "TypeScript", ["video", "generation", "ai"]),
    makeSeedRepo("elizaos-plugins", "plugin-tts", "Text-to-speech plugin", 8, 3, "TypeScript", ["tts", "speech", "audio"]),
    makeSeedRepo("elizaos-plugins", "plugin-coinbase", "Coinbase Commerce integration", 10, 5, "TypeScript", ["coinbase", "crypto", "payment"]),
    makeSeedRepo("elizaos-plugins", "plugin-starknet", "StarkNet blockchain integration", 8, 3, "TypeScript", ["starknet", "blockchain", "crypto"]),
    makeSeedRepo("elizaos-plugins", "plugin-near", "NEAR Protocol integration", 6, 2, "TypeScript", ["near", "blockchain", "crypto"]),
    makeSeedRepo("elizaos-plugins", "plugin-sui", "Sui blockchain integration", 5, 2, "TypeScript", ["sui", "blockchain", "crypto"]),
    makeSeedRepo("elizaos-plugins", "plugin-flow", "Flow blockchain integration", 4, 1, "TypeScript", ["flow", "blockchain"]),
    makeSeedRepo("elizaos-plugins", "plugin-whatsapp", "WhatsApp connector plugin", 12, 5, "TypeScript", ["whatsapp", "plugin", "connector"]),
    makeSeedRepo("elizaos-plugins", "plugin-slack", "Slack workspace connector", 10, 4, "TypeScript", ["slack", "plugin", "connector"]),
    makeSeedRepo("elizaos-plugins", "plugin-farcaster", "Farcaster social protocol", 8, 3, "TypeScript", ["farcaster", "social", "web3"]),
    makeSeedRepo("elizaos-plugins", "plugin-lens", "Lens Protocol integration", 7, 2, "TypeScript", ["lens", "social", "web3"]),
    makeSeedRepo("elizaos-plugins", "plugin-github", "GitHub integration plugin", 12, 5, "TypeScript", ["github", "plugin", "dev"]),
    makeSeedRepo("elizaos-plugins", "plugin-giphy", "Giphy GIF integration", 3, 1, "TypeScript", ["giphy", "gif", "media"]),
    makeSeedRepo("elizaos-plugins", "plugin-web-search", "Web search capability", 9, 4, "TypeScript", ["search", "web", "browsing"]),
    makeSeedRepo("elizaos-plugins", "plugin-0g", "0G network integration", 4, 1, "TypeScript", ["0g", "network"]),
    makeSeedRepo("elizaos-plugins", "plugin-goat", "GOAT tooling integration", 6, 2, "TypeScript", ["goat", "tools"]),
    makeSeedRepo("elizaos-plugins", "plugin-icp", "Internet Computer Protocol plugin", 5, 2, "TypeScript", ["icp", "blockchain"]),
    makeSeedRepo("elizaos-plugins", "plugin-multiversx", "MultiversX blockchain plugin", 4, 1, "TypeScript", ["multiversx", "blockchain"]),
    makeSeedRepo("elizaos-plugins", "plugin-tee", "Trusted Execution Environment plugin", 7, 3, "TypeScript", ["tee", "security"]),
    makeSeedRepo("elizaos-plugins", "plugin-ton", "TON blockchain integration", 5, 2, "TypeScript", ["ton", "blockchain"]),
    makeSeedRepo("elizaos-plugins", "plugin-cronoszkevm", "Cronos zkEVM plugin", 3, 1, "TypeScript", ["cronos", "zkevm", "blockchain"]),
    makeSeedRepo("elizaos-plugins", "plugin-avalanche", "Avalanche blockchain plugin", 4, 1, "TypeScript", ["avalanche", "blockchain"]),
    makeSeedRepo("elizaos-plugins", "plugin-story", "Story Protocol integration", 5, 2, "TypeScript", ["story", "ip"]),
    makeSeedRepo("elizaos-plugins", "plugin-rabbi-trader", "Crypto trading agent plugin", 8, 4, "TypeScript", ["trading", "crypto", "defi"]),
    makeSeedRepo("elizaos-plugins", "plugin-nft-generation", "NFT creation and minting plugin", 6, 2, "TypeScript", ["nft", "generation", "crypto"]),
    makeSeedRepo("elizaos-plugins", "plugin-aptos", "Aptos blockchain integration", 5, 2, "TypeScript", ["aptos", "blockchain"]),
    makeSeedRepo("elizaos-plugins", "plugin-cosmos", "Cosmos ecosystem integration", 4, 1, "TypeScript", ["cosmos", "blockchain"]),
    makeSeedRepo("elizaos-plugins", "plugin-conflux", "Conflux blockchain plugin", 3, 1, "TypeScript", ["conflux", "blockchain"]),
    makeSeedRepo("elizaos-plugins", "plugin-coding-agent", "Coding agent orchestration - spawn CLI agents via PTY", 0, 0, "TypeScript", []),
    makeSeedRepo("elizaos-plugins", "plugin-ui", "Plugin UI SDK - schema-driven config renderers", 0, 0, "TypeScript", []),
    makeSeedRepo("elizaos-plugins", "plugin-repoprompt", "RepoPrompt CLI integration", 0, 0, "TypeScript", []),
    makeSeedRepo("elizaos-plugins", "plugin-pi-ai", "Pi AI credential bridge", 0, 0, "TypeScript", []),
    makeSeedRepo("elizaos-plugins", "plugin-claude-code-workbench", "Claude Code companion workflow", 0, 0, "TypeScript", []),
    makeSeedRepo("elizaos-plugins", "plugin-allora", "Allora network integration", 3, 1, "TypeScript", ["allora", "ai"]),
    makeSeedRepo("elizaos-plugins", "plugin-birdeye", "Birdeye DeFi analytics", 4, 2, "TypeScript", ["birdeye", "defi"]),
    makeSeedRepo("elizaos-plugins", "plugin-pyth", "Pyth Network oracle integration", 3, 1, "TypeScript", ["pyth", "oracle"]),
    makeSeedRepo("elizaos-plugins", "plugin-bnb", "BNB Chain integration", 4, 2, "TypeScript", ["bnb", "blockchain"]),
    makeSeedRepo("elizaos-plugins", "plugin-arbitrum", "Arbitrum L2 integration", 3, 1, "TypeScript", ["arbitrum", "l2"]),
    makeSeedRepo("elizaos-plugins", "plugin-zksync", "zkSync Era integration", 3, 1, "TypeScript", ["zksync", "l2"]),
  ];

  return { elizaOSRepos, pluginRepos };
}

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

    let elizaOSRepos: GitHubRepo[] = [];
    let pluginRepos: GitHubRepo[] = [];
    let source = "live";

    try {
      console.log("[ecosystem-api] Attempting live GitHub fetch...");
      const liveData = await fetchAllEcosystemRepos();
      elizaOSRepos = liveData.elizaOSRepos;
      pluginRepos = liveData.pluginRepos;

      // If we got very few results, the API likely failed silently
      if (elizaOSRepos.length + pluginRepos.length < 5) {
        console.warn("[ecosystem-api] Too few results from GitHub, using seed data");
        throw new Error("Insufficient data from GitHub API");
      }

      console.log(
        `[ecosystem-api] Live fetch success: ${elizaOSRepos.length} + ${pluginRepos.length} repos`
      );
    } catch (apiError) {
      console.warn("[ecosystem-api] GitHub API failed, falling back to seed data:", apiError);
      const seed = getSeedData();
      elizaOSRepos = seed.elizaOSRepos;
      pluginRepos = seed.pluginRepos;
      source = "seed";
    }

    const data = await buildEcosystemData(elizaOSRepos, pluginRepos);

    cachedData = data;
    cachedAt = now;

    return NextResponse.json(data, {
      headers: {
        "X-Cache": "MISS",
        "X-Source": source,
        "X-Fetched-At": data.meta.fetchedAt,
      },
    });
  } catch (error) {
    console.error("[ecosystem-api] Fatal error:", error);

    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: { "X-Cache": "STALE" },
      });
    }

    // Last resort: build from seed data
    try {
      console.log("[ecosystem-api] Building from seed data as last resort...");
      const seed = getSeedData();
      const data = await buildEcosystemData(seed.elizaOSRepos, seed.pluginRepos);
      cachedData = data;
      cachedAt = Date.now();
      return NextResponse.json(data, {
        headers: { "X-Cache": "SEED", "X-Source": "seed-fallback" },
      });
    } catch (seedError) {
      console.error("[ecosystem-api] Even seed data failed:", seedError);
      return NextResponse.json(
        { error: "Failed to build ecosystem data" },
        { status: 500 }
      );
    }
  }
}
