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

function getSeedData(): {
  elizaOSRepos: GitHubRepo[];
  pluginRepos: GitHubRepo[];
  communityRepos: GitHubRepo[];
  registryPluginCount: number;
} {
  // ─── elizaOS org repos (all repos from org page) ───
  const elizaOSRepos: GitHubRepo[] = [
    makeSeedRepo("elizaOS", "eliza", "Autonomous agents for everyone", 17692, 5447, "TypeScript", ["agent", "agentic", "ai", "autonomous", "chatbot", "crypto", "discord", "eliza", "elizaos", "framework", "plugins", "rag", "slack", "swarm", "telegram"], { homepage: "https://eliza.how/" }),
    makeSeedRepo("elizaOS", "elizaos.github.io", "Leaderboard of Eliza Contributors", 102, 50, "TypeScript", ["elizaos", "website", "leaderboard"]),
    makeSeedRepo("elizaOS", "eliza-starter", "Starter template for building Eliza agents", 371, 180, "TypeScript", ["eliza", "starter", "template", "agent"]),
    makeSeedRepo("elizaOS", "eliza-nextjs-starter", "Eliza v2 Document Chat Demo Built on Next.js", 15, 5, "TypeScript", ["starter", "nextjs", "v2", "chat"]),
    makeSeedRepo("elizaOS", "characterfile", "A simple file format for character data", 320, 110, "TypeScript", ["character", "ai", "npc", "personality"]),
    makeSeedRepo("elizaOS", "awesome-eliza", "A curated list of awesome things related to Eliza", 190, 40, "Markdown", ["awesome", "eliza", "list"]),
    makeSeedRepo("elizaOS", "agentmemory", "Easy-to-use agent memory backed by chromadb + postgres", 90, 25, "Python", ["memory", "agent", "rag", "chromadb"]),
    makeSeedRepo("elizaOS", "knowledge", "Data: Ecosystem news, GitHub updates, discussion summaries for RAG", 66, 20, "Python", ["knowledge", "rag", "data", "elizaos"]),
    makeSeedRepo("elizaOS", "agent-twitter-client", "Twitter/X client for Eliza agents", 60, 25, "TypeScript", ["twitter", "x", "agent", "social"]),
    makeSeedRepo("elizaOS", "docs", "ElizaOS documentation", 4, 2, "MDX", ["docs", "documentation", "eliza"]),
    makeSeedRepo("elizaOS", "prr", "Sits on your PR and won't get up until it's ready", 5, 1, "TypeScript", ["pr", "review", "agent"]),
    makeSeedRepo("elizaOS", "otc-agent", "OTC trading agent", 8, 2, "TypeScript", ["trading", "otc", "agent"]),
    makeSeedRepo("elizaOS", "openclaw-adapter", "Run Eliza plugins inside OpenClaw — wallets, connectors", 37, 7, "TypeScript", ["openclaw", "adapter"]),
    makeSeedRepo("elizaOS", "benchmarks", "Benchmark suite for elizaOS agents", 5, 0, "Python", ["benchmark", "testing"]),
    makeSeedRepo("elizaOS", "examples", "Examples of how to use elizaOS", 4, 0, "TypeScript", ["examples", "tutorial"]),
    makeSeedRepo("elizaOS", "plugins-automation", "Automation scripts to manage the 150+ plugins in elizaos-plugins", 7, 2, "JavaScript", ["scripts", "automation"]),
    makeSeedRepo("elizaOS", "workgroups", "Dedicated to workgroups helping accelerate the Eliza ecosystem", 10, 3, "Markdown", ["community", "workgroups"]),
    makeSeedRepo("elizaOS", "registry", "elizaOS Plugin Registry", 20, 8, "TypeScript", ["registry", "plugins", "elizaos"]),
    // Agent projects
    makeSeedRepo("elizaOS", "spartan", "Your quant", 84, 15, "TypeScript", ["agent", "quant", "trading"]),
    makeSeedRepo("elizaOS", "the-org", "Agents for organizations", 52, 10, "TypeScript", ["agent", "organization", "swarm"]),
    makeSeedRepo("elizaOS", "otaku", "Autonomous DeFi trading and research agent", 27, 5, "JavaScript", ["defi", "trading", "agent", "autonomous"]),
    makeSeedRepo("elizaOS", "SWEagent", "Autonomous software engineering agent built in elizaOS", 22, 5, "TypeScript", ["swe", "agent", "coding"]),
    // Games & 3D
    makeSeedRepo("elizaOS", "eliza-3d-hyperfy-starter", "3D agent project with custom Hyperfy plugin for prototyping 3D MMO", 41, 12, "TypeScript", ["3d", "hyperfy", "game", "mmo"]),
    makeSeedRepo("elizaOS", "eliza-2004scape", "Eliza plays Runescape", 0, 0, "TypeScript", ["game", "runescape"]),
    // Multimedia & tools
    makeSeedRepo("elizaOS", "LiveVideoChat", "Live video chat with Eliza agents", 75, 15, "TypeScript", ["video", "chat", "realtime"]),
    makeSeedRepo("elizaOS", "LJSpeechTools", "Tools for making LJSpeech datasets", 26, 5, "Python", ["speech", "dataset", "tts"]),
    makeSeedRepo("elizaOS", "hat", "Add a cool hat to your image", 3, 1, "TypeScript", ["image", "fun"]),
    makeSeedRepo("elizaOS", "hats", "Hats protocol", 3, 1, "TypeScript", ["hats", "protocol"]),
    // Infrastructure
    makeSeedRepo("elizaOS", "roadmap", "ElizaOS public roadmap", 15, 3, "Markdown", ["roadmap", "planning"]),
    makeSeedRepo("elizaOS", "website", "ElizaOS website", 18, 5, "JavaScript", ["website"]),
    makeSeedRepo("elizaOS", "x402.elizaos.ai", "Dynamic x402 routing with intelligent content negotiation", 2, 1, "JavaScript", ["x402", "routing"]),
    makeSeedRepo("elizaOS", "vercel-api", "Next.js Vercel API routes for stuff we like", 1, 0, "TypeScript", ["api", "vercel"]),
    makeSeedRepo("elizaOS", "trust_scoreboard", "Trust scoring dashboard", 11, 3, "TypeScript", ["trust", "scoring"]),
    makeSeedRepo("elizaOS", "mcp-gateway", "MCP gateway for elizaOS", 12, 3, "TypeScript", ["mcp", "gateway"]),
    makeSeedRepo("elizaOS", "mobile", "ElizaOS Cloud app with Privy React Native starter", 1, 0, "TypeScript", ["mobile", "react-native"]),
    makeSeedRepo("elizaOS", "plugin-specification", "ElizaOS plugin specification", 1, 0, "TypeScript", ["plugin", "specification"]),
    makeSeedRepo("elizaOS", "test-repo", "Repo with simple issues to test swe-agent", 1, 0, "Python", ["testing"]),
    makeSeedRepo("elizaOS", "brandkit", "Assets, logos, and designs", 5, 2, "Markdown", ["brand", "design", "assets"]),
  ];

  // ─── elizaos-plugins org repos (268+ repos) ───
  const pluginRepos: GitHubRepo[] = [
    // Registry
    makeSeedRepo("elizaos-plugins", "registry", "JSON Registry for all plugins in the ElizaOS ecosystem", 50, 30, "TypeScript", ["registry", "plugins", "elizaos"]),
    // Adapters
    makeSeedRepo("elizaos-plugins", "adapter-mongodb", "MongoDB adapter for ElizaOS", 8, 3, "TypeScript", ["mongodb", "adapter", "database"]),
    makeSeedRepo("elizaos-plugins", "adapter-pglite", "PGLite adapter for ElizaOS", 5, 2, "TypeScript", ["pglite", "adapter", "database"]),
    makeSeedRepo("elizaos-plugins", "adapter-postgres", "PostgreSQL adapter for ElizaOS", 15, 6, "TypeScript", ["postgres", "adapter", "database"]),
    makeSeedRepo("elizaos-plugins", "adapter-qdrant", "Qdrant vector DB adapter", 6, 2, "TypeScript", ["qdrant", "adapter", "vector"]),
    makeSeedRepo("elizaos-plugins", "adapter-sqlite", "SQLite adapter for ElizaOS", 10, 4, "TypeScript", ["sqlite", "adapter", "database"]),
    makeSeedRepo("elizaos-plugins", "adapter-sqljs", "SQL.js adapter for ElizaOS", 4, 1, "TypeScript", ["sqljs", "adapter", "database"]),
    makeSeedRepo("elizaos-plugins", "adapter-supabase", "Supabase adapter for ElizaOS", 12, 5, "TypeScript", ["supabase", "adapter", "database"]),
    // Clients
    makeSeedRepo("elizaos-plugins", "client-auto", "Auto client for ElizaOS", 5, 2, "TypeScript", ["auto", "client"]),
    makeSeedRepo("elizaos-plugins", "client-discord", "Discord client for ElizaOS", 25, 12, "TypeScript", ["discord", "client", "connector"]),
    makeSeedRepo("elizaos-plugins", "client-farcaster", "Farcaster client", 8, 3, "TypeScript", ["farcaster", "client", "social"]),
    makeSeedRepo("elizaos-plugins", "client-github", "GitHub integration client", 12, 5, "TypeScript", ["github", "client"]),
    makeSeedRepo("elizaos-plugins", "client-lens", "Lens Protocol client", 7, 2, "TypeScript", ["lens", "client", "social"]),
    makeSeedRepo("elizaos-plugins", "client-slack", "Slack workspace client", 10, 4, "TypeScript", ["slack", "client", "connector"]),
    makeSeedRepo("elizaos-plugins", "client-telegram", "Telegram client for ElizaOS", 22, 10, "TypeScript", ["telegram", "client", "connector"]),
    makeSeedRepo("elizaos-plugins", "client-twitter", "Twitter/X client for ElizaOS", 35, 18, "TypeScript", ["twitter", "client", "connector"]),
    // Core plugins
    makeSeedRepo("elizaos-plugins", "plugin-node", "Node.js runtime plugin", 15, 8, "TypeScript", ["node", "runtime"]),
    makeSeedRepo("elizaos-plugins", "plugin-bootstrap", "Bootstrap/core actions plugin", 12, 6, "TypeScript", ["bootstrap", "core"]),
    makeSeedRepo("elizaos-plugins", "plugin-knowledge", "Knowledge management plugin", 10, 4, "TypeScript", ["knowledge", "rag"]),
    makeSeedRepo("elizaos-plugins", "plugin-sql", "SQL query plugin", 6, 2, "TypeScript", ["sql", "database"]),
    makeSeedRepo("elizaos-plugins", "plugin-pdf", "PDF text extraction plugin", 5, 2, "TypeScript", ["pdf", "document"]),
    makeSeedRepo("elizaos-plugins", "plugin-shell", "Shell execution plugin", 4, 1, "TypeScript", ["shell", "execution"]),
    makeSeedRepo("elizaos-plugins", "plugin-browser", "Web browsing plugin", 8, 3, "TypeScript", ["browser", "web"]),
    // AI model plugins
    makeSeedRepo("elizaos-plugins", "plugin-openai", "OpenAI model integration", 20, 9, "TypeScript", ["openai", "llm", "ai"]),
    makeSeedRepo("elizaos-plugins", "plugin-anthropic", "Anthropic Claude integration", 18, 7, "TypeScript", ["anthropic", "claude", "llm"]),
    makeSeedRepo("elizaos-plugins", "plugin-local-ai", "Local AI model support", 14, 5, "TypeScript", ["local", "llm", "ai"]),
    makeSeedRepo("elizaos-plugins", "plugin-google-genai", "Google Gemini integration", 10, 4, "TypeScript", ["google", "gemini", "llm"]),
    makeSeedRepo("elizaos-plugins", "plugin-groq", "Groq inference integration", 8, 3, "TypeScript", ["groq", "llm", "ai"]),
    makeSeedRepo("elizaos-plugins", "plugin-ollama", "Ollama local model support", 12, 5, "TypeScript", ["ollama", "local", "llm"]),
    makeSeedRepo("elizaos-plugins", "plugin-openrouter", "OpenRouter model gateway", 7, 3, "TypeScript", ["openrouter", "llm"]),
    makeSeedRepo("elizaos-plugins", "plugin-redpill", "Redpill model integration", 5, 2, "TypeScript", ["redpill", "llm"]),
    makeSeedRepo("elizaos-plugins", "plugin-venice", "Venice AI integration", 4, 1, "TypeScript", ["venice", "ai"]),
    makeSeedRepo("elizaos-plugins", "plugin-hyperbolic", "Hyperbolic AI integration", 5, 2, "TypeScript", ["hyperbolic", "ai"]),
    makeSeedRepo("elizaos-plugins", "plugin-bedrock", "AWS Bedrock integration", 6, 2, "TypeScript", ["bedrock", "aws", "llm"]),
    makeSeedRepo("elizaos-plugins", "plugin-cerebras", "Cerebras integration", 3, 1, "TypeScript", ["cerebras", "ai"]),
    makeSeedRepo("elizaos-plugins", "plugin-vercel-ai-gateway", "Vercel AI SDK gateway", 4, 1, "TypeScript", ["vercel", "ai"]),
    // Media generation
    makeSeedRepo("elizaos-plugins", "plugin-image-generation", "AI image generation", 16, 7, "TypeScript", ["image", "generation", "ai"]),
    makeSeedRepo("elizaos-plugins", "plugin-video-generation", "AI video generation", 10, 4, "TypeScript", ["video", "generation", "ai"]),
    makeSeedRepo("elizaos-plugins", "plugin-video-understanding", "Video analysis/understanding", 5, 2, "TypeScript", ["video", "analysis"]),
    makeSeedRepo("elizaos-plugins", "plugin-3d-generation", "3D model generation", 8, 3, "TypeScript", ["3d", "generation", "ai"]),
    makeSeedRepo("elizaos-plugins", "plugin-tts", "Text-to-speech", 8, 3, "TypeScript", ["tts", "speech", "audio"]),
    makeSeedRepo("elizaos-plugins", "plugin-elevenlabs", "ElevenLabs TTS integration", 6, 2, "TypeScript", ["elevenlabs", "tts", "audio"]),
    // Blockchain plugins
    makeSeedRepo("elizaos-plugins", "plugin-solana", "Solana blockchain integration", 30, 15, "TypeScript", ["solana", "crypto", "blockchain"]),
    makeSeedRepo("elizaos-plugins", "plugin-solana-agent-kit", "Solana Agent Kit integration", 15, 6, "TypeScript", ["solana", "agent-kit", "blockchain"]),
    makeSeedRepo("elizaos-plugins", "plugin-evm", "EVM/Ethereum blockchain support", 28, 14, "TypeScript", ["ethereum", "evm", "crypto"]),
    makeSeedRepo("elizaos-plugins", "plugin-bnb", "BNB Chain integration", 4, 2, "TypeScript", ["bnb", "blockchain"]),
    makeSeedRepo("elizaos-plugins", "plugin-starknet", "StarkNet integration", 8, 3, "TypeScript", ["starknet", "blockchain", "crypto"]),
    makeSeedRepo("elizaos-plugins", "plugin-near", "NEAR Protocol integration", 6, 2, "TypeScript", ["near", "blockchain", "crypto"]),
    makeSeedRepo("elizaos-plugins", "plugin-sui", "Sui blockchain integration", 5, 2, "TypeScript", ["sui", "blockchain", "crypto"]),
    makeSeedRepo("elizaos-plugins", "plugin-flow", "Flow blockchain integration", 4, 1, "TypeScript", ["flow", "blockchain"]),
    makeSeedRepo("elizaos-plugins", "plugin-ton", "TON blockchain integration", 5, 2, "TypeScript", ["ton", "blockchain"]),
    makeSeedRepo("elizaos-plugins", "plugin-aptos", "Aptos blockchain integration", 5, 2, "TypeScript", ["aptos", "blockchain"]),
    makeSeedRepo("elizaos-plugins", "plugin-cosmos", "Cosmos ecosystem integration", 4, 1, "TypeScript", ["cosmos", "blockchain"]),
    makeSeedRepo("elizaos-plugins", "plugin-conflux", "Conflux blockchain", 3, 1, "TypeScript", ["conflux", "blockchain"]),
    makeSeedRepo("elizaos-plugins", "plugin-cronoszkevm", "Cronos zkEVM", 3, 1, "TypeScript", ["cronos", "zkevm", "blockchain"]),
    makeSeedRepo("elizaos-plugins", "plugin-avalanche", "Avalanche blockchain", 4, 1, "TypeScript", ["avalanche", "blockchain"]),
    makeSeedRepo("elizaos-plugins", "plugin-icp", "Internet Computer Protocol", 5, 2, "TypeScript", ["icp", "blockchain"]),
    makeSeedRepo("elizaos-plugins", "plugin-multiversx", "MultiversX blockchain", 4, 1, "TypeScript", ["multiversx", "blockchain"]),
    makeSeedRepo("elizaos-plugins", "plugin-abstract", "Abstract chain integration", 3, 1, "TypeScript", ["abstract", "blockchain"]),
    makeSeedRepo("elizaos-plugins", "plugin-injective", "Injective protocol integration", 4, 1, "TypeScript", ["injective", "blockchain"]),
    makeSeedRepo("elizaos-plugins", "plugin-hedera", "Hedera Hashgraph integration", 5, 2, "TypeScript", ["hedera", "blockchain"]),
    makeSeedRepo("elizaos-plugins", "plugin-sei", "Sei blockchain integration", 4, 1, "TypeScript", ["sei", "blockchain"]),
    makeSeedRepo("elizaos-plugins", "plugin-quai", "Quai Network integration", 3, 1, "TypeScript", ["quai", "blockchain"]),
    makeSeedRepo("elizaos-plugins", "plugin-fuel", "Fuel blockchain integration", 3, 1, "TypeScript", ["fuel", "blockchain"]),
    makeSeedRepo("elizaos-plugins", "plugin-mina", "Mina Protocol integration", 3, 1, "TypeScript", ["mina", "blockchain"]),
    makeSeedRepo("elizaos-plugins", "plugin-massa", "Massa blockchain", 3, 1, "TypeScript", ["massa", "blockchain"]),
    makeSeedRepo("elizaos-plugins", "plugin-movement", "Movement Labs integration", 3, 1, "TypeScript", ["movement", "blockchain"]),
    makeSeedRepo("elizaos-plugins", "plugin-zksync-era", "zkSync Era L2 integration", 3, 1, "TypeScript", ["zksync", "l2"]),
    makeSeedRepo("elizaos-plugins", "plugin-story", "Story Protocol integration", 5, 2, "TypeScript", ["story", "ip"]),
    makeSeedRepo("elizaos-plugins", "plugin-holdstation", "HoldStation integration", 3, 1, "TypeScript", ["holdstation", "defi"]),
    makeSeedRepo("elizaos-plugins", "plugin-omniflix", "OmniFlix integration", 3, 1, "TypeScript", ["omniflix", "nft"]),
    makeSeedRepo("elizaos-plugins", "plugin-stargaze", "Stargaze NFT marketplace", 3, 1, "TypeScript", ["stargaze", "nft"]),
    // DeFi & trading plugins
    makeSeedRepo("elizaos-plugins", "plugin-coinbase", "Coinbase Commerce integration", 10, 5, "TypeScript", ["coinbase", "crypto", "payment"]),
    makeSeedRepo("elizaos-plugins", "plugin-coingecko", "CoinGecko price data", 8, 3, "TypeScript", ["coingecko", "price", "crypto"]),
    makeSeedRepo("elizaos-plugins", "plugin-coinmarketcap", "CoinMarketCap data", 5, 2, "TypeScript", ["coinmarketcap", "price"]),
    makeSeedRepo("elizaos-plugins", "plugin-hyperliquid", "Hyperliquid DEX trading", 8, 3, "TypeScript", ["hyperliquid", "dex", "trading"]),
    makeSeedRepo("elizaos-plugins", "plugin-rabbi-trader", "Crypto trading agent", 8, 4, "TypeScript", ["trading", "crypto", "defi"]),
    makeSeedRepo("elizaos-plugins", "plugin-binance", "Binance exchange integration", 6, 3, "TypeScript", ["binance", "exchange", "trading"]),
    makeSeedRepo("elizaos-plugins", "plugin-0x", "0x DEX aggregation", 5, 2, "TypeScript", ["0x", "dex", "swap"]),
    makeSeedRepo("elizaos-plugins", "plugin-defillama", "DeFi Llama analytics", 4, 2, "TypeScript", ["defillama", "defi", "analytics"]),
    makeSeedRepo("elizaos-plugins", "plugin-definews", "DeFi news aggregator", 3, 1, "TypeScript", ["defi", "news"]),
    makeSeedRepo("elizaos-plugins", "plugin-birdeye", "Birdeye DeFi analytics", 4, 2, "TypeScript", ["birdeye", "defi"]),
    makeSeedRepo("elizaos-plugins", "plugin-pyth-data", "Pyth Network oracle data", 3, 1, "TypeScript", ["pyth", "oracle"]),
    makeSeedRepo("elizaos-plugins", "plugin-squid-router", "Squid cross-chain router", 3, 1, "TypeScript", ["squid", "crosschain"]),
    makeSeedRepo("elizaos-plugins", "plugin-nft-generation", "NFT creation and minting", 6, 2, "TypeScript", ["nft", "generation", "crypto"]),
    makeSeedRepo("elizaos-plugins", "plugin-okx", "OKX exchange integration", 4, 2, "TypeScript", ["okx", "exchange"]),
    makeSeedRepo("elizaos-plugins", "plugin-helius", "Helius Solana RPC/data", 5, 2, "TypeScript", ["helius", "solana"]),
    makeSeedRepo("elizaos-plugins", "plugin-lpinfo", "LP/liquidity pool info", 3, 1, "TypeScript", ["lp", "defi"]),
    // Social & messaging plugins
    makeSeedRepo("elizaos-plugins", "plugin-discord", "Discord server integration", 25, 12, "TypeScript", ["discord", "plugin", "connector"]),
    makeSeedRepo("elizaos-plugins", "plugin-telegram", "Telegram connector", 22, 10, "TypeScript", ["telegram", "plugin", "connector"]),
    makeSeedRepo("elizaos-plugins", "plugin-twitter", "Twitter/X integration", 35, 18, "TypeScript", ["twitter", "plugin", "connector"]),
    makeSeedRepo("elizaos-plugins", "plugin-whatsapp", "WhatsApp connector", 12, 5, "TypeScript", ["whatsapp", "plugin", "connector"]),
    makeSeedRepo("elizaos-plugins", "plugin-farcaster", "Farcaster social protocol", 8, 3, "TypeScript", ["farcaster", "social", "web3"]),
    makeSeedRepo("elizaos-plugins", "plugin-lensNetwork", "Lens Protocol integration", 5, 2, "TypeScript", ["lens", "social", "web3"]),
    makeSeedRepo("elizaos-plugins", "plugin-xmtp", "XMTP messaging protocol", 5, 2, "TypeScript", ["xmtp", "messaging"]),
    makeSeedRepo("elizaos-plugins", "plugin-echochambers", "Echo chambers integration", 3, 1, "TypeScript", ["social", "chat"]),
    makeSeedRepo("elizaos-plugins", "plugin-livekit", "LiveKit audio/video", 4, 1, "TypeScript", ["livekit", "audio", "video"]),
    // Dev tools & infra plugins
    makeSeedRepo("elizaos-plugins", "plugin-github", "GitHub integration", 12, 5, "TypeScript", ["github", "plugin", "dev"]),
    makeSeedRepo("elizaos-plugins", "plugin-giphy", "Giphy GIF integration", 3, 1, "TypeScript", ["giphy", "gif", "media"]),
    makeSeedRepo("elizaos-plugins", "plugin-web-search", "Web search capability", 9, 4, "TypeScript", ["search", "web", "browsing"]),
    makeSeedRepo("elizaos-plugins", "plugin-chart", "Chart generation", 4, 1, "TypeScript", ["chart", "visualization"]),
    makeSeedRepo("elizaos-plugins", "plugin-linear", "Linear issue tracker", 4, 1, "TypeScript", ["linear", "issues"]),
    makeSeedRepo("elizaos-plugins", "plugin-obsidian", "Obsidian vault integration", 5, 2, "TypeScript", ["obsidian", "notes"]),
    makeSeedRepo("elizaos-plugins", "plugin-rss", "RSS feed reader", 3, 1, "TypeScript", ["rss", "feed"]),
    makeSeedRepo("elizaos-plugins", "plugin-e2b", "E2B code sandbox", 4, 1, "TypeScript", ["e2b", "sandbox"]),
    makeSeedRepo("elizaos-plugins", "plugin-gitbook", "GitBook integration", 3, 1, "TypeScript", ["gitbook", "docs"]),
    makeSeedRepo("elizaos-plugins", "plugin-autocoder", "Auto code generation", 5, 2, "TypeScript", ["coding", "automation"]),
    makeSeedRepo("elizaos-plugins", "plugin-mcp", "Model Context Protocol", 6, 2, "TypeScript", ["mcp", "protocol"]),
    makeSeedRepo("elizaos-plugins", "plugin-wolfram", "Wolfram Alpha integration", 4, 1, "TypeScript", ["wolfram", "math"]),
    makeSeedRepo("elizaos-plugins", "plugin-open-weather", "OpenWeather API", 3, 1, "TypeScript", ["weather", "api"]),
    makeSeedRepo("elizaos-plugins", "plugin-sportradar", "Sports data integration", 3, 1, "TypeScript", ["sports", "data"]),
    // Security & TEE
    makeSeedRepo("elizaos-plugins", "plugin-tee", "Trusted Execution Environment", 7, 3, "TypeScript", ["tee", "security"]),
    makeSeedRepo("elizaos-plugins", "plugin-tee-log", "TEE logging plugin", 3, 1, "TypeScript", ["tee", "logging"]),
    makeSeedRepo("elizaos-plugins", "plugin-tee-marlin", "TEE Marlin integration", 3, 1, "TypeScript", ["tee", "marlin"]),
    makeSeedRepo("elizaos-plugins", "plugin-dcap", "DCAP attestation", 3, 1, "TypeScript", ["dcap", "attestation"]),
    makeSeedRepo("elizaos-plugins", "plugin-sgx", "Intel SGX integration", 3, 1, "TypeScript", ["sgx", "security"]),
    makeSeedRepo("elizaos-plugins", "plugin-opacity", "Opacity verification", 3, 1, "TypeScript", ["opacity", "verification"]),
    makeSeedRepo("elizaos-plugins", "plugin-gitcoin-passport", "Gitcoin Passport identity", 4, 1, "TypeScript", ["gitcoin", "identity"]),
    // Web3 tools
    makeSeedRepo("elizaos-plugins", "plugin-goat", "GOAT tooling integration", 6, 2, "TypeScript", ["goat", "tools"]),
    makeSeedRepo("elizaos-plugins", "plugin-thirdweb", "Thirdweb SDK integration", 5, 2, "TypeScript", ["thirdweb", "web3"]),
    makeSeedRepo("elizaos-plugins", "plugin-safe", "Safe (Gnosis) multisig", 4, 1, "TypeScript", ["safe", "multisig"]),
    makeSeedRepo("elizaos-plugins", "plugin-clanker", "Clanker token launcher", 3, 1, "TypeScript", ["clanker", "token"]),
    makeSeedRepo("elizaos-plugins", "plugin-gelato", "Gelato relay/automation", 4, 1, "TypeScript", ["gelato", "automation"]),
    makeSeedRepo("elizaos-plugins", "plugin-irys", "Irys permanent storage", 4, 1, "TypeScript", ["irys", "storage"]),
    makeSeedRepo("elizaos-plugins", "plugin-storage-s3", "S3 storage plugin", 3, 1, "TypeScript", ["s3", "storage"]),
    makeSeedRepo("elizaos-plugins", "plugin-relay", "Relay protocol", 3, 1, "TypeScript", ["relay", "protocol"]),
    // Infra & misc plugins
    makeSeedRepo("elizaos-plugins", "plugin-0g", "0G network integration", 4, 1, "TypeScript", ["0g", "network"]),
    makeSeedRepo("elizaos-plugins", "plugin-akash", "Akash Network compute", 4, 1, "TypeScript", ["akash", "compute"]),
    makeSeedRepo("elizaos-plugins", "plugin-spheron", "Spheron decentralized infra", 3, 1, "TypeScript", ["spheron", "infra"]),
    makeSeedRepo("elizaos-plugins", "plugin-autonome", "Autonome platform", 3, 1, "TypeScript", ["autonome", "platform"]),
    makeSeedRepo("elizaos-plugins", "plugin-allora", "Allora network", 3, 1, "TypeScript", ["allora", "ai"]),
    makeSeedRepo("elizaos-plugins", "plugin-depin", "DePIN integration", 3, 1, "TypeScript", ["depin", "iot"]),
    makeSeedRepo("elizaos-plugins", "plugin-primus", "Primus verification", 3, 1, "TypeScript", ["primus", "verification"]),
    makeSeedRepo("elizaos-plugins", "plugin-avail", "Avail DA layer", 3, 1, "TypeScript", ["avail", "da"]),
    makeSeedRepo("elizaos-plugins", "plugin-babylon", "Babylon staking", 3, 1, "TypeScript", ["babylon", "staking"]),
    makeSeedRepo("elizaos-plugins", "plugin-genlayer", "GenLayer integration", 3, 1, "TypeScript", ["genlayer", "ai"]),
    makeSeedRepo("elizaos-plugins", "plugin-anyone", "Anyone network", 3, 1, "TypeScript", ["anyone", "privacy"]),
    makeSeedRepo("elizaos-plugins", "plugin-ankr", "Ankr RPC/data", 4, 1, "TypeScript", ["ankr", "rpc"]),
    // Agent & automation plugins
    makeSeedRepo("elizaos-plugins", "plugin-action-bench", "Action benchmarking", 3, 1, "TypeScript", ["benchmark", "actions"]),
    makeSeedRepo("elizaos-plugins", "plugin-agent-factory", "Agent creation factory", 5, 2, "TypeScript", ["agent", "factory"]),
    makeSeedRepo("elizaos-plugins", "plugin-analytics", "Analytics and telemetry", 4, 1, "TypeScript", ["analytics", "telemetry"]),
    makeSeedRepo("elizaos-plugins", "plugin-auton8n", "n8n workflow automation", 4, 1, "TypeScript", ["n8n", "automation"]),
    makeSeedRepo("elizaos-plugins", "plugin-elizacloud", "ElizaCloud hosting", 3, 1, "TypeScript", ["cloud", "hosting"]),
    makeSeedRepo("elizaos-plugins", "plugin-ferePro", "Fere Pro integration", 3, 1, "TypeScript", ["fere", "pro"]),
    makeSeedRepo("elizaos-plugins", "plugin-edwin", "Edwin DeFi agent", 3, 1, "TypeScript", ["edwin", "defi"]),
    makeSeedRepo("elizaos-plugins", "plugin-goplus", "GoPlus security", 3, 1, "TypeScript", ["goplus", "security"]),
    makeSeedRepo("elizaos-plugins", "plugin-arkham", "Arkham analytics", 3, 1, "TypeScript", ["arkham", "analytics"]),
    makeSeedRepo("elizaos-plugins", "plugin-8004", "8004 integration", 3, 1, "TypeScript", ["8004"]),
    makeSeedRepo("elizaos-plugins", "plugin-asterai", "AsterAI integration", 3, 1, "TypeScript", ["asterai", "ai"]),
    makeSeedRepo("elizaos-plugins", "plugin-letzai", "LetzAI integration", 3, 1, "TypeScript", ["letzai", "ai"]),
    makeSeedRepo("elizaos-plugins", "plugin-intiface", "Intiface integration", 3, 1, "TypeScript", ["intiface"]),
    // Special plugins
    makeSeedRepo("elizaos-plugins", "plugin-wrapped", "End of year fun - wrapped summary", 5, 1, "TypeScript", ["wrapped", "fun"]),
    makeSeedRepo("elizaos-plugins", "plugin-attract", "Attract mode for ElizaOS", 3, 1, "TypeScript", ["attract", "demo"]),
    makeSeedRepo("elizaos-plugins", "plugin-coding-agent", "Coding agent via PTY", 3, 1, "TypeScript", ["coding", "agent"]),
    makeSeedRepo("elizaos-plugins", "plugin-ui", "Plugin UI SDK", 3, 1, "TypeScript", ["ui", "sdk"]),
    makeSeedRepo("elizaos-plugins", "plugin-repoprompt", "RepoPrompt CLI integration", 3, 1, "TypeScript", ["repoprompt", "cli"]),
    makeSeedRepo("elizaos-plugins", "plugin-pi-ai", "Pi AI credential bridge", 3, 1, "TypeScript", ["pi-ai", "credentials"]),
    makeSeedRepo("elizaos-plugins", "plugin-claude-code-workbench", "Claude Code companion workflow", 3, 1, "TypeScript", ["claude", "code"]),
    makeSeedRepo("elizaos-plugins", "plugin-computer-use", "Computer use (screen control)", 4, 1, "TypeScript", ["computer-use", "automation"]),
    makeSeedRepo("elizaos-plugins", "plugin-firecrawl", "Firecrawl web scraping", 4, 1, "TypeScript", ["firecrawl", "scraping"]),
    makeSeedRepo("elizaos-plugins", "plugin-arthera", "Arthera chain integration", 3, 1, "TypeScript", ["arthera", "blockchain"]),
    makeSeedRepo("elizaos-plugins", "plugin-membase", "Membase storage", 3, 1, "TypeScript", ["membase", "storage"]),
    makeSeedRepo("elizaos-plugins", "plugin-lightlink", "LightLink integration", 3, 1, "TypeScript", ["lightlink", "blockchain"]),
    makeSeedRepo("elizaos-plugins", "plugin-viction", "Viction chain", 3, 1, "TypeScript", ["viction", "blockchain"]),
    makeSeedRepo("elizaos-plugins", "plugin-sonic", "Sonic chain", 3, 1, "TypeScript", ["sonic", "blockchain"]),
  ];

  // ─── Community & third-party repos (from topic search + registry) ───
  const communityRepos: GitHubRepo[] = [
    // ─── milady-ai org (major associated project) ───
    makeSeedRepo("milady-ai", "milady", "terminally online — personal AI assistant built on elizaOS", 500, 80, "TypeScript", ["elizaos", "agent", "ai", "personal-assistant", "milady"], { homepage: "https://milady.ai/" }),
    makeSeedRepo("milady-ai", "trust-dashboard", "Trust scoring leaderboard and contributor analytics for milady", 15, 3, "TypeScript", ["trust", "leaderboard", "milady"]),
    makeSeedRepo("milady-ai", "avatars", "VRM Avatars modeled after milady", 8, 2, "TypeScript", ["avatar", "vrm", "3d", "milady"]),
    makeSeedRepo("milady-ai", "ai.milady.Milaidy", "Flatpak manifest for Milaidy — submit to Flathub", 3, 1, "TypeScript", ["flatpak", "linux", "milady"]),
    makeSeedRepo("milady-ai", "homebrew-tap", "Homebrew tap for Milaidy — personal AI assistant", 3, 1, "Ruby", ["homebrew", "macos", "milady"]),
    makeSeedRepo("milady-ai", "milady-workspace", "Use this for development of milaidy", 3, 1, "Shell", ["dev", "workspace", "milady"]),
    makeSeedRepo("milady-ai", "flathub", "Flathub issue tracker and new submissions", 2, 0, "TypeScript", ["flathub", "milady"]),
    makeSeedRepo("milady-ai", "apt", "APT repository for Milaidy — personal AI assistant", 2, 0, "Shell", ["apt", "linux", "milady"]),
    // ─── Major community projects ───
    makeSeedRepo("thejoven", "awesome-eliza", "A curated list of awesome things related to eliza framework", 150, 30, "Markdown", ["awesome", "eliza", "list", "elizaos"]),
    makeSeedRepo("valory-xyz", "agents-fun-eliza", "Autonomous agent for Agents.fun ecosystem built on Eliza", 25, 8, "Python", ["agent", "elizaos", "autonomous"]),
    makeSeedRepo("Agent-Town", "milady", "Automated cuteness — Agent Town fork of milady", 10, 3, "TypeScript", ["agent", "milady", "elizaos"]),
    // Third-party registry plugins
    makeSeedRepo("1BDO", "plugin-delta", "Delta integration for ElizaOS", 3, 1, "TypeScript", ["delta", "elizaos-plugin"]),
    makeSeedRepo("arthur-orderly", "arthur-eliza-plugin", "Arthur DEX plugin for ElizaOS", 4, 1, "TypeScript", ["dex", "elizaos-plugin"]),
    makeSeedRepo("AsterPay", "plugin-payments", "AsterPay payment integration", 5, 2, "TypeScript", ["payments", "elizaos-plugin"]),
    makeSeedRepo("bealers", "plugin-mattermost", "Mattermost connector for ElizaOS", 4, 1, "TypeScript", ["mattermost", "elizaos-plugin"]),
    makeSeedRepo("BlockRunAI", "elizaos-plugin-blockrun", "BlockRun AI game plugin", 3, 1, "TypeScript", ["game", "elizaos-plugin"]),
    makeSeedRepo("tdnupe3", "coinrailz-eliza-plugin", "Coinrailz trading plugin", 3, 1, "TypeScript", ["trading", "elizaos-plugin"]),
    makeSeedRepo("redstone-finance", "client-clara", "Clara client by Redstone Finance", 5, 2, "TypeScript", ["redstone", "elizaos-plugin"]),
    makeSeedRepo("takoprotocol", "client-tako", "Tako Protocol client", 4, 1, "TypeScript", ["tako", "social", "elizaos-plugin"]),
    makeSeedRepo("aiqubits", "client-wechat", "WeChat client for ElizaOS", 6, 2, "TypeScript", ["wechat", "china", "elizaos-plugin"]),
    makeSeedRepo("ephemeraHQ", "client-xmtp", "XMTP messaging client", 8, 3, "TypeScript", ["xmtp", "messaging", "elizaos-plugin"]),
    makeSeedRepo("payainetwork", "client-twitter-api-access", "Twitter API access client", 4, 1, "TypeScript", ["twitter", "api", "elizaos-plugin"]),
    makeSeedRepo("APRO-com", "plugin-ATTPs", "ATTPs protocol integration", 5, 2, "TypeScript", ["attps", "elizaos-plugin"]),
    makeSeedRepo("beacon-protocol", "plugin-beacon", "Beacon Protocol integration", 4, 1, "TypeScript", ["beacon", "elizaos-plugin"]),
    makeSeedRepo("Bink-AI", "elizaos-plugin-binkai", "Bink AI integration", 5, 2, "TypeScript", ["bink", "ai", "elizaos-plugin"]),
    makeSeedRepo("bio-xyz", "plugin-bioagent", "BioAgent for biological research", 6, 2, "TypeScript", ["bio", "research", "elizaos-plugin"]),
    makeSeedRepo("bio-xyz", "plugin-birdeye", "Birdeye analytics by bio.xyz", 4, 1, "TypeScript", ["birdeye", "defi", "elizaos-plugin"]),
    makeSeedRepo("ChuXo", "plugin-bitquery", "Bitquery blockchain data", 3, 1, "TypeScript", ["bitquery", "data", "elizaos-plugin"]),
    makeSeedRepo("blessnetwork", "elizaos-bless-plugin", "Bless Network integration", 4, 1, "TypeScript", ["bless", "elizaos-plugin"]),
    makeSeedRepo("brand-new-vision", "plugin-bnv-me-id", "BNV Me.ID identity", 3, 1, "TypeScript", ["identity", "elizaos-plugin"]),
    makeSeedRepo("relipasoft", "plugin-cardano", "Cardano blockchain integration", 6, 2, "TypeScript", ["cardano", "blockchain", "elizaos-plugin"]),
    makeSeedRepo("pranavjadhav1363", "plugin-ccxt", "CCXT multi-exchange trading", 5, 2, "TypeScript", ["ccxt", "trading", "elizaos-plugin"]),
    makeSeedRepo("CompassLabs", "plugin-compass", "Compass DeFi integration", 4, 1, "TypeScript", ["compass", "defi", "elizaos-plugin"]),
    makeSeedRepo("carv-protocol", "plugin-d.a.t.a", "CARV DATA protocol", 5, 2, "TypeScript", ["carv", "data", "elizaos-plugin"]),
    makeSeedRepo("Datai-Network", "plugin-datai", "Datai Network analytics", 4, 1, "TypeScript", ["datai", "analytics", "elizaos-plugin"]),
    makeSeedRepo("gabrielantonyxaviour", "eliza-plugin-debridge", "deBridge cross-chain", 5, 2, "TypeScript", ["debridge", "crosschain", "elizaos-plugin"]),
    makeSeedRepo("donbagger", "plugin-dexpaprika", "DEXPaprika analytics", 3, 1, "TypeScript", ["dexpaprika", "dex", "elizaos-plugin"]),
    makeSeedRepo("fixes-world", "plugin-di", "Dependency injection plugin", 3, 1, "TypeScript", ["di", "elizaos-plugin"]),
    makeSeedRepo("fixes-world", "plugin-flow", "Flow blockchain by Fixes.world", 4, 1, "TypeScript", ["flow", "blockchain", "elizaos-plugin"]),
    makeSeedRepo("fixes-world", "plugin-flow-advanced", "Advanced Flow integration", 3, 1, "TypeScript", ["flow", "advanced", "elizaos-plugin"]),
    makeSeedRepo("EnsoBuild", "plugin-enso", "Enso DeFi aggregation", 5, 2, "TypeScript", ["enso", "defi", "elizaos-plugin"]),
    makeSeedRepo("t3rn", "plugin-t3rn-executor", "t3rn cross-chain executor", 4, 1, "TypeScript", ["t3rn", "crosschain", "elizaos-plugin"]),
    makeSeedRepo("AntoineVergne", "plugin-farcaster-local-hub", "Farcaster local hub", 3, 1, "TypeScript", ["farcaster", "hub", "elizaos-plugin"]),
    makeSeedRepo("tobySolutions", "plugin-firecrawl", "Firecrawl web scraper", 4, 1, "TypeScript", ["firecrawl", "scraping", "elizaos-plugin"]),
    makeSeedRepo("PaymagicXYZ", "plugin-gigbot", "GigBot gig economy plugin", 3, 1, "TypeScript", ["gigbot", "payments", "elizaos-plugin"]),
    makeSeedRepo("grixprotocol", "plugin-grix", "Grix Protocol options", 4, 1, "TypeScript", ["grix", "options", "elizaos-plugin"]),
    makeSeedRepo("mcp-dao", "plugin-holoworld", "HoloWorld 3D avatar", 4, 1, "TypeScript", ["holoworld", "3d", "elizaos-plugin"]),
    makeSeedRepo("iExecBlockchainComputing", "plugin-iexec", "iExec off-chain compute", 5, 2, "TypeScript", ["iexec", "compute", "elizaos-plugin"]),
    makeSeedRepo("isaacx0", "plugin-isaacx", "IsaacX integration", 3, 1, "TypeScript", ["isaacx", "elizaos-plugin"]),
    makeSeedRepo("kaiachain", "kaia-eliza-plugin", "Kaia blockchain plugin", 5, 2, "TypeScript", ["kaia", "blockchain", "elizaos-plugin"]),
    makeSeedRepo("lightlink-network", "plugin-lightlink", "LightLink chain", 4, 1, "TypeScript", ["lightlink", "blockchain", "elizaos-plugin"]),
    makeSeedRepo("developerfred", "mbd-farcaster", "MBD Farcaster integration", 3, 1, "TypeScript", ["mbd", "farcaster", "elizaos-plugin"]),
    makeSeedRepo("merkle-trade", "merkle-eliza-plugin", "Merkle Trade DEX", 5, 2, "TypeScript", ["merkle", "trading", "elizaos-plugin"]),
    makeSeedRepo("messari", "plugin-messari-ai-toolkit", "Messari AI research toolkit", 8, 3, "TypeScript", ["messari", "research", "elizaos-plugin"]),
    makeSeedRepo("nknorg", "eliza-plugin-nkn", "NKN network messaging", 4, 1, "TypeScript", ["nkn", "messaging", "elizaos-plugin"]),
    makeSeedRepo("tskoyo", "plugin-notion", "Notion integration", 5, 2, "TypeScript", ["notion", "productivity", "elizaos-plugin"]),
    makeSeedRepo("okto-hq", "eliza-plugin", "Okto wallet plugin", 6, 2, "TypeScript", ["okto", "wallet", "elizaos-plugin"]),
    makeSeedRepo("orderlynetwork", "plugin-orderly", "Orderly Network DEX", 5, 2, "TypeScript", ["orderly", "dex", "elizaos-plugin"]),
    makeSeedRepo("aipop-fun", "plugin-para", "Para integration", 3, 1, "TypeScript", ["para", "elizaos-plugin"]),
    makeSeedRepo("payainetwork", "plugin-payai", "PayAI payment network", 4, 1, "TypeScript", ["payai", "payments", "elizaos-plugin"]),
    makeSeedRepo("automata-network", "elizaos-plugin-proof-of-agent", "Proof of Agent attestation", 8, 3, "TypeScript", ["proof", "attestation", "elizaos-plugin"]),
    makeSeedRepo("PundiAI", "plugin-pundiai-dataset", "PundiAI dataset integration", 4, 1, "TypeScript", ["pundiai", "data", "elizaos-plugin"]),
    makeSeedRepo("Coiin-Blockchain", "plugin-raiinmaker", "Raiinmaker integration", 4, 1, "TypeScript", ["raiinmaker", "elizaos-plugin"]),
    makeSeedRepo("recallnet", "plugin-recall", "Recall Network memory", 5, 2, "TypeScript", ["recall", "memory", "elizaos-plugin"]),
    makeSeedRepo("r3vl", "plugin-reveel-payid", "Reveel PayID integration", 3, 1, "TypeScript", ["reveel", "payments", "elizaos-plugin"]),
    makeSeedRepo("rss3-network", "elizaos-plugin-rss3", "RSS3 open information", 5, 2, "TypeScript", ["rss3", "data", "elizaos-plugin"]),
    makeSeedRepo("5afe", "plugin-safe", "Safe (Gnosis) multisig", 6, 2, "TypeScript", ["safe", "multisig", "elizaos-plugin"]),
    makeSeedRepo("DimaKush", "plugin-siwe", "Sign-In with Ethereum", 3, 1, "TypeScript", ["siwe", "auth", "elizaos-plugin"]),
    makeSeedRepo("storacha", "elizaos-plugin", "Storacha decentralized storage", 4, 1, "TypeScript", ["storacha", "storage", "elizaos-plugin"]),
    makeSeedRepo("Gen3Games", "plugin-trn", "TRN gaming chain", 4, 1, "TypeScript", ["trn", "gaming", "elizaos-plugin"]),
    makeSeedRepo("TrustaLabs", "plugin-trustgo", "TrustGo identity scoring", 4, 1, "TypeScript", ["trustgo", "identity", "elizaos-plugin"]),
    makeSeedRepo("boolkeys", "plugin-twilio", "Twilio SMS/voice", 4, 1, "TypeScript", ["twilio", "sms", "elizaos-plugin"]),
    makeSeedRepo("BuildOnViction", "plugin-viction", "Viction chain integration", 3, 1, "TypeScript", ["viction", "blockchain", "elizaos-plugin"]),
    makeSeedRepo("warp-contracts", "plugin-clara-twitter", "Clara Twitter by Warp", 4, 1, "TypeScript", ["clara", "twitter", "elizaos-plugin"]),
    makeSeedRepo("wellaios", "plugin-youtube-to-text", "YouTube to text", 4, 1, "TypeScript", ["youtube", "transcription", "elizaos-plugin"]),
    makeSeedRepo("prismadic", "elizaos-plugin-youtube-transcription", "YouTube transcription", 3, 1, "TypeScript", ["youtube", "transcription", "elizaos-plugin"]),
    makeSeedRepo("ben-dh3", "plugin-zapper", "Zapper portfolio integration", 4, 1, "TypeScript", ["zapper", "portfolio", "elizaos-plugin"]),
    makeSeedRepo("zypher-network", "plugin-zytron", "Zytron gaming chain", 3, 1, "TypeScript", ["zytron", "gaming", "elizaos-plugin"]),
    makeSeedRepo("erdGeclaw", "plugin-base-signals", "Base chain signal monitoring", 3, 1, "TypeScript", ["base", "signals", "elizaos-plugin"]),
    makeSeedRepo("Esscrypt", "plugin-polkadot", "Polkadot blockchain integration", 5, 2, "TypeScript", ["polkadot", "blockchain", "elizaos-plugin"]),
    makeSeedRepo("xdc-community", "plugin-xdc", "XDC Network integration", 4, 1, "TypeScript", ["xdc", "blockchain", "elizaos-plugin"]),
    makeSeedRepo("token-metrics", "plugin-tokenmetrics", "Token Metrics AI analytics", 6, 2, "TypeScript", ["tokenmetrics", "analytics", "elizaos-plugin"]),
    makeSeedRepo("Tonyflam", "plugin-openchat", "OpenChat integration", 3, 1, "TypeScript", ["openchat", "chat", "elizaos-plugin"]),
    makeSeedRepo("takasaki404", "plugin-aimo-router", "Aimo router plugin", 3, 1, "TypeScript", ["aimo", "router", "elizaos-plugin"]),
    makeSeedRepo("10inchdev", "plugin-moltbazaar", "MoltBazaar marketplace", 3, 1, "TypeScript", ["marketplace", "elizaos-plugin"]),
    makeSeedRepo("wpoulin", "plugin-octav", "Octav analytics", 3, 1, "TypeScript", ["octav", "analytics", "elizaos-plugin"]),
    makeSeedRepo("otaku-x402", "elizaos-plugin-otaku-x402", "Otaku x402 integration", 3, 1, "TypeScript", ["otaku", "elizaos-plugin"]),
    makeSeedRepo("mascotai", "plugin-connections", "MascotAI connections plugin", 4, 1, "TypeScript", ["mascotai", "social", "elizaos-plugin"]),
    makeSeedRepo("NuggetsLtd", "eliza-plugin-nuggets", "Nuggets identity verification", 4, 1, "TypeScript", ["nuggets", "identity", "elizaos-plugin"]),
    makeSeedRepo("onbonsai", "plugin-bonsai", "Bonsai AI on Lens", 5, 2, "TypeScript", ["bonsai", "lens", "elizaos-plugin"]),
    makeSeedRepo("ProofGate", "proofgate-eliza-plugin", "ProofGate verification", 3, 1, "TypeScript", ["proofgate", "verification", "elizaos-plugin"]),
    makeSeedRepo("thopatevijay", "plugin-sonic", "Sonic chain integration", 3, 1, "TypeScript", ["sonic", "blockchain", "elizaos-plugin"]),
    makeSeedRepo("near-agent", "elizaos-plugin-multichain", "Multi-chain agent by NEAR", 5, 2, "TypeScript", ["multichain", "near", "elizaos-plugin"]),
    makeSeedRepo("bowtiedbluefin", "plugin-morpheus", "Morpheus DeFi integration", 4, 1, "TypeScript", ["morpheus", "defi", "elizaos-plugin"]),
    makeSeedRepo("bowtiedbluefin", "plugin-morpho", "Morpho lending integration", 4, 1, "TypeScript", ["morpho", "lending", "elizaos-plugin"]),
    makeSeedRepo("standujar", "plugin-composio", "Composio tool integration", 4, 1, "TypeScript", ["composio", "tools", "elizaos-plugin"]),
    makeSeedRepo("Okay-Bet", "plugin-polymarket", "Polymarket prediction markets", 6, 2, "TypeScript", ["polymarket", "prediction", "elizaos-plugin"]),
    makeSeedRepo("Kudo-Archi", "plugin-kudo", "Kudo architecture plugin", 3, 1, "TypeScript", ["kudo", "elizaos-plugin"]),
    makeSeedRepo("kamiyo-ai", "kamiyo-protocol", "Kamiyo AI protocol for Eliza", 5, 2, "TypeScript", ["kamiyo", "ai", "elizaos-plugin"]),
    makeSeedRepo("Mazzz-zzz", "plugin-elizaos-compchembridge", "Computational chemistry bridge", 3, 1, "TypeScript", ["chemistry", "science", "elizaos-plugin"]),
    makeSeedRepo("matteo-brandolino", "plugin-moralis-v2", "Moralis Web3 API v2", 4, 1, "TypeScript", ["moralis", "web3", "elizaos-plugin"]),
    makeSeedRepo("amit0365", "plugin-computer-use", "Computer use automation", 4, 1, "TypeScript", ["computer-use", "automation", "elizaos-plugin"]),
    // Community ecosystem projects (from topic search)
    makeSeedRepo("automata-network", "elizaos-plugins-registry", "Automata fork of plugin registry", 5, 2, "TypeScript", ["registry", "elizaos"]),
    makeSeedRepo("NethermindEth", "elizaos-plugin-registry", "Nethermind plugin registry fork", 4, 1, "TypeScript", ["registry", "elizaos"]),
  ];

  return {
    elizaOSRepos,
    pluginRepos,
    communityRepos,
    registryPluginCount: 220,
  };
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
    let communityRepos: GitHubRepo[] = [];
    let registryPluginCount = 0;
    let source = "live";

    try {
      console.log("[ecosystem-api] Attempting live GitHub fetch...");
      const liveData = await fetchAllEcosystemRepos();
      elizaOSRepos = liveData.elizaOSRepos;
      pluginRepos = liveData.pluginRepos;
      communityRepos = liveData.communityRepos;
      registryPluginCount = liveData.registryPluginCount;

      // If we got very few results, the API likely failed silently
      if (elizaOSRepos.length + pluginRepos.length < 5) {
        console.warn("[ecosystem-api] Too few results from GitHub, using seed data");
        throw new Error("Insufficient data from GitHub API");
      }

      console.log(
        `[ecosystem-api] Live fetch success: ${elizaOSRepos.length} + ${pluginRepos.length} + ${communityRepos.length} repos`
      );
    } catch (apiError) {
      console.warn("[ecosystem-api] GitHub API failed, falling back to seed data:", apiError);
      const seed = getSeedData();
      elizaOSRepos = seed.elizaOSRepos;
      pluginRepos = seed.pluginRepos;
      communityRepos = seed.communityRepos;
      registryPluginCount = seed.registryPluginCount;
      source = "seed";
    }

    const data = await buildEcosystemData(elizaOSRepos, pluginRepos, communityRepos, registryPluginCount);

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
      const data = await buildEcosystemData(seed.elizaOSRepos, seed.pluginRepos, seed.communityRepos, seed.registryPluginCount);
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
