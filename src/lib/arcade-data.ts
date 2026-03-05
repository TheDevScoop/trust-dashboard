/**
 * Arcade mode data — contributors as fighters, repos as level nodes,
 * plugins as power-ups on the overworld map.
 */

export interface ArcadeFighter {
  username: string;
  avatarUrl: string;
  title: string; // MK-style title like "Shaolin Monk"
  tier: "boss" | "champion" | "warrior" | "rookie";
  stats: {
    prsMerged: number;
    reviewsGiven: number;
    issuesClosed: number;
    linesChanged: number;
    commits: number;
    socialScore: number;
  };
  /** Total elizaEffect score */
  score: number;
  /** Which repos they contribute to (repo names) */
  repos: string[];
  /** Special move name */
  specialMove: string;
}

export interface ArcadeLevelNode {
  repo: string;
  displayName: string;
  description: string;
  org: "elizaOS" | "elizaos-plugins" | "milady-ai" | "community";
  stars: number;
  category: "core" | "official-tool" | "plugin" | "documentation" | "community" | "game" | "infrastructure";
  /** Position on overworld map (grid coords) */
  x: number;
  y: number;
  /** Connected to these other repos via paths */
  connections: string[];
  /** Whether the level is "cleared" (active) or locked */
  status: "cleared" | "active" | "locked";
  /** Overworld sprite type */
  sprite: "castle" | "fortress" | "tower" | "house" | "hut" | "cave" | "bridge" | "star";
}

export interface ArcadePluginPowerUp {
  repo: string;
  displayName: string;
  group: "social" | "blockchain" | "ai" | "media" | "defi" | "dev" | "infra";
  /** Which path this power-up bounces on (from -> to repo) */
  pathFrom: string;
  pathTo: string;
}

// ── Fighters (mock contributor leaderboard) ─────────────────────────
export const ARCADE_FIGHTERS: ArcadeFighter[] = [
  {
    username: "shakkernerd",
    avatarUrl: "https://avatars.githubusercontent.com/u/186240462?v=4",
    title: "The Architect",
    tier: "boss",
    stats: { prsMerged: 847, reviewsGiven: 1203, issuesClosed: 312, linesChanged: 284920, commits: 2104, socialScore: 95 },
    score: 9850,
    repos: ["eliza", "eliza-starter", "characterfile", "agent-twitter-client", "agentmemory"],
    specialMove: "INFINITE RECURSION",
  },
  {
    username: "lalalune",
    avatarUrl: "https://avatars.githubusercontent.com/u/18406958?v=4",
    title: "Shadow Coder",
    tier: "boss",
    stats: { prsMerged: 623, reviewsGiven: 890, issuesClosed: 245, linesChanged: 198400, commits: 1567, socialScore: 92 },
    score: 8920,
    repos: ["eliza", "characterfile", "eliza-docs", "knowledge-base"],
    specialMove: "MERGE CONFLICT FURY",
  },
  {
    username: "odilitime",
    avatarUrl: "https://avatars.githubusercontent.com/u/3917806?v=4",
    title: "Core Guardian",
    tier: "champion",
    stats: { prsMerged: 412, reviewsGiven: 567, issuesClosed: 189, linesChanged: 145600, commits: 934, socialScore: 78 },
    score: 7340,
    repos: ["eliza", "plugin-discord", "plugin-telegram", "agentmemory"],
    specialMove: "DAEMON SLASH",
  },
  {
    username: "sirkitree",
    avatarUrl: "https://avatars.githubusercontent.com/u/203840?v=4",
    title: "Plugin Master",
    tier: "champion",
    stats: { prsMerged: 389, reviewsGiven: 445, issuesClosed: 156, linesChanged: 112300, commits: 823, socialScore: 82 },
    score: 6890,
    repos: ["eliza", "plugin-solana", "plugin-evm", "plugin-coinbase"],
    specialMove: "CHAIN REACTION",
  },
  {
    username: "madjin",
    avatarUrl: "https://avatars.githubusercontent.com/u/32600939?v=4",
    title: "The Documenter",
    tier: "champion",
    stats: { prsMerged: 298, reviewsGiven: 412, issuesClosed: 201, linesChanged: 89700, commits: 712, socialScore: 88 },
    score: 6450,
    repos: ["eliza-docs", "awesome-eliza", "elizaos.github.io", "eliza"],
    specialMove: "KNOWLEDGE BOMB",
  },
  {
    username: "ponderingdemocritus",
    avatarUrl: "https://avatars.githubusercontent.com/u/104963430?v=4",
    title: "Chain Walker",
    tier: "champion",
    stats: { prsMerged: 267, reviewsGiven: 334, issuesClosed: 123, linesChanged: 78900, commits: 645, socialScore: 71 },
    score: 5780,
    repos: ["plugin-starknet", "eliza", "plugin-evm", "plugin-near"],
    specialMove: "BLOCK FINALITY",
  },
  {
    username: "monilpat",
    avatarUrl: "https://avatars.githubusercontent.com/u/24598211?v=4",
    title: "Social Blade",
    tier: "warrior",
    stats: { prsMerged: 234, reviewsGiven: 289, issuesClosed: 98, linesChanged: 67800, commits: 534, socialScore: 85 },
    score: 5230,
    repos: ["plugin-twitter", "agent-twitter-client", "eliza", "plugin-farcaster"],
    specialMove: "VIRAL THREAD",
  },
  {
    username: "HashWarlock",
    avatarUrl: "https://avatars.githubusercontent.com/u/35318572?v=4",
    title: "TEE Phantom",
    tier: "warrior",
    stats: { prsMerged: 201, reviewsGiven: 256, issuesClosed: 87, linesChanged: 56700, commits: 478, socialScore: 64 },
    score: 4670,
    repos: ["plugin-tee", "eliza", "plugin-node", "plugin-bootstrap"],
    specialMove: "ENCLAVE STRIKE",
  },
  {
    username: "cygaar",
    avatarUrl: "https://avatars.githubusercontent.com/u/6921283?v=4",
    title: "Gas Optimizer",
    tier: "warrior",
    stats: { prsMerged: 189, reviewsGiven: 223, issuesClosed: 76, linesChanged: 45600, commits: 412, socialScore: 69 },
    score: 4320,
    repos: ["plugin-evm", "plugin-arbitrum", "plugin-zksync", "eliza"],
    specialMove: "GAS WAR",
  },
  {
    username: "v1xingyue",
    avatarUrl: "https://avatars.githubusercontent.com/u/3867171?v=4",
    title: "Eastern Wind",
    tier: "warrior",
    stats: { prsMerged: 178, reviewsGiven: 198, issuesClosed: 65, linesChanged: 43200, commits: 389, socialScore: 58 },
    score: 3980,
    repos: ["plugin-sui", "plugin-aptos", "eliza", "plugin-ton"],
    specialMove: "CONSENSUS KICK",
  },
  {
    username: "twilwa",
    avatarUrl: "https://avatars.githubusercontent.com/u/67237082?v=4",
    title: "Swarm Queen",
    tier: "warrior",
    stats: { prsMerged: 156, reviewsGiven: 201, issuesClosed: 89, linesChanged: 38900, commits: 345, socialScore: 76 },
    score: 3740,
    repos: ["eliza", "plugin-discord", "plugin-slack", "agentmemory"],
    specialMove: "HIVE MIND",
  },
  {
    username: "tcm390",
    avatarUrl: "https://avatars.githubusercontent.com/u/130168970?v=4",
    title: "Memory Keeper",
    tier: "warrior",
    stats: { prsMerged: 145, reviewsGiven: 178, issuesClosed: 56, linesChanged: 34500, commits: 312, socialScore: 52 },
    score: 3420,
    repos: ["agentmemory", "knowledge-base", "eliza", "plugin-local-ai"],
    specialMove: "TOTAL RECALL",
  },
  {
    username: "yodamaster726",
    avatarUrl: "https://avatars.githubusercontent.com/u/143759514?v=4",
    title: "Force Wielder",
    tier: "warrior",
    stats: { prsMerged: 134, reviewsGiven: 156, issuesClosed: 48, linesChanged: 31200, commits: 287, socialScore: 61 },
    score: 3180,
    repos: ["eliza", "plugin-openai", "plugin-anthropic", "eliza-starter"],
    specialMove: "PROMPT INJECTION",
  },
  {
    username: "oxSaturn",
    avatarUrl: "https://avatars.githubusercontent.com/u/47497089?v=4",
    title: "Ring Master",
    tier: "warrior",
    stats: { prsMerged: 123, reviewsGiven: 145, issuesClosed: 42, linesChanged: 28900, commits: 267, socialScore: 55 },
    score: 2940,
    repos: ["plugin-solana", "plugin-coinbase", "plugin-rabbi-trader", "eliza"],
    specialMove: "ORBITAL STRIKE",
  },
  {
    username: "0xHaze",
    avatarUrl: "https://avatars.githubusercontent.com/u/100860923?v=4",
    title: "The Unseen",
    tier: "rookie",
    stats: { prsMerged: 98, reviewsGiven: 112, issuesClosed: 34, linesChanged: 23400, commits: 212, socialScore: 48 },
    score: 2560,
    repos: ["plugin-nft-generation", "plugin-image-generation", "eliza"],
    specialMove: "PIXEL BLAST",
  },
  {
    username: "tomguluson92",
    avatarUrl: "https://avatars.githubusercontent.com/u/9469562?v=4",
    title: "Bridge Builder",
    tier: "rookie",
    stats: { prsMerged: 87, reviewsGiven: 98, issuesClosed: 29, linesChanged: 19800, commits: 189, socialScore: 44 },
    score: 2280,
    repos: ["plugin-cosmos", "plugin-avalanche", "plugin-flow", "eliza"],
    specialMove: "CROSS-CHAIN COMBO",
  },
  {
    username: "alextitonis",
    avatarUrl: "https://avatars.githubusercontent.com/u/88630565?v=4",
    title: "Script Ninja",
    tier: "rookie",
    stats: { prsMerged: 76, reviewsGiven: 89, issuesClosed: 23, linesChanged: 16700, commits: 167, socialScore: 39 },
    score: 1980,
    repos: ["plugin-github", "plugin-web-search", "prr", "eliza"],
    specialMove: "GIT FORCE PUSH",
  },
  {
    username: "juanc004",
    avatarUrl: "https://avatars.githubusercontent.com/u/141294247?v=4",
    title: "Fresh Blood",
    tier: "rookie",
    stats: { prsMerged: 65, reviewsGiven: 78, issuesClosed: 18, linesChanged: 14200, commits: 145, socialScore: 35 },
    score: 1720,
    repos: ["plugin-whatsapp", "plugin-telegram", "eliza"],
    specialMove: "MESSAGE STORM",
  },
  {
    username: "bealers",
    avatarUrl: "https://avatars.githubusercontent.com/u/427099?v=4",
    title: "Testing Ground",
    tier: "rookie",
    stats: { prsMerged: 54, reviewsGiven: 67, issuesClosed: 15, linesChanged: 11800, commits: 123, socialScore: 31 },
    score: 1480,
    repos: ["benchmarks", "examples", "eliza", "eliza-docs"],
    specialMove: "ASSERT TRUE",
  },
  {
    username: "leomercier",
    avatarUrl: "https://avatars.githubusercontent.com/u/133539012?v=4",
    title: "Pixel Mage",
    tier: "rookie",
    stats: { prsMerged: 43, reviewsGiven: 56, issuesClosed: 12, linesChanged: 9400, commits: 98, socialScore: 27 },
    score: 1220,
    repos: ["plugin-lens", "plugin-giphy", "plugin-video-generation"],
    specialMove: "LENS FLARE",
  },
];

// ── Overworld level nodes ───────────────────────────────────────────
export const LEVEL_NODES: ArcadeLevelNode[] = [
  // Row 0 — center: core
  { repo: "eliza", displayName: "ELIZA CASTLE", description: "Autonomous agents for everyone", org: "elizaOS", stars: 17680, category: "core", x: 7, y: 4, connections: ["eliza-starter", "characterfile", "agentmemory", "agent-twitter-client", "elizaos.github.io", "eliza-docs", "plugin-node", "plugin-bootstrap"], status: "cleared", sprite: "castle" },

  // Row 1 — inner ring: major repos
  { repo: "eliza-starter", displayName: "STARTER FORT", description: "Starter template for building agents", org: "elizaOS", stars: 240, category: "official-tool", x: 4, y: 2, connections: ["eliza", "characterfile", "examples"], status: "cleared", sprite: "fortress" },
  { repo: "characterfile", displayName: "CHARACTER SHRINE", description: "Character data file format", org: "elizaOS", stars: 320, category: "official-tool", x: 10, y: 2, connections: ["eliza", "eliza-starter"], status: "cleared", sprite: "tower" },
  { repo: "agentmemory", displayName: "MEMORY VAULT", description: "Agent memory w/ chromadb + postgres", org: "elizaOS", stars: 90, category: "official-tool", x: 3, y: 5, connections: ["eliza", "knowledge-base"], status: "cleared", sprite: "cave" },
  { repo: "agent-twitter-client", displayName: "TWITTER TOWER", description: "Twitter/X client for agents", org: "elizaOS", stars: 60, category: "official-tool", x: 11, y: 5, connections: ["eliza", "plugin-twitter"], status: "cleared", sprite: "tower" },
  { repo: "elizaos.github.io", displayName: "WEB CITADEL", description: "Website and Leaderboard", org: "elizaOS", stars: 45, category: "documentation", x: 5, y: 7, connections: ["eliza", "eliza-docs", "awesome-eliza"], status: "cleared", sprite: "fortress" },
  { repo: "eliza-docs", displayName: "SCROLL LIBRARY", description: "Documentation for elizaOS", org: "elizaOS", stars: 30, category: "documentation", x: 9, y: 7, connections: ["eliza", "elizaos.github.io"], status: "cleared", sprite: "house" },

  // Row 2 — outer: smaller repos
  { repo: "knowledge-base", displayName: "KNOWLEDGE CAVE", description: "Knowledge base for memory", org: "elizaOS", stars: 18, category: "official-tool", x: 1, y: 4, connections: ["agentmemory"], status: "active", sprite: "cave" },
  { repo: "token-manager", displayName: "TOKEN TREASURY", description: "Token balance management", org: "elizaOS", stars: 15, category: "official-tool", x: 13, y: 4, connections: ["plugin-solana", "plugin-evm"], status: "active", sprite: "house" },
  { repo: "prr", displayName: "PR DOJO", description: "PR review agent", org: "elizaOS", stars: 3, category: "official-tool", x: 1, y: 7, connections: ["eliza", "plugin-github"], status: "active", sprite: "hut" },
  { repo: "awesome-eliza", displayName: "AWESOME ARCHIVE", description: "Curated resource list", org: "elizaOS", stars: 190, category: "documentation", x: 7, y: 8, connections: ["elizaos.github.io"], status: "cleared", sprite: "house" },
  { repo: "examples", displayName: "TRAINING GROUNDS", description: "Usage examples", org: "elizaOS", stars: 4, category: "official-tool", x: 2, y: 1, connections: ["eliza-starter"], status: "active", sprite: "hut" },
  { repo: "benchmarks", displayName: "BENCHMARK ARENA", description: "Benchmark suite", org: "elizaOS", stars: 5, category: "official-tool", x: 13, y: 1, connections: ["eliza"], status: "locked", sprite: "hut" },
  { repo: "runtime-config", displayName: "CONFIG BUNKER", description: "Runtime configuration", org: "elizaOS", stars: 8, category: "official-tool", x: 13, y: 7, connections: ["eliza", "plugin-node"], status: "active", sprite: "hut" },
  { repo: "openclaw-adapter", displayName: "OPENCLAW BRIDGE", description: "OpenClaw adapter", org: "elizaOS", stars: 37, category: "official-tool", x: 0, y: 1, connections: ["eliza"], status: "locked", sprite: "bridge" },
  { repo: "eliza-2004scape", displayName: "RUNESCAPE REALM", description: "Eliza plays Runescape", org: "elizaOS", stars: 0, category: "community", x: 14, y: 8, connections: ["eliza"], status: "locked", sprite: "cave" },

  // Plugin level nodes (key ones that appear on map)
  { repo: "plugin-node", displayName: "NODE ENGINE", description: "Node.js runtime plugin", org: "elizaos-plugins", stars: 15, category: "plugin", x: 5, y: 3, connections: ["eliza", "plugin-bootstrap"], status: "cleared", sprite: "star" },
  { repo: "plugin-bootstrap", displayName: "BOOTSTRAP CORE", description: "Core actions plugin", org: "elizaos-plugins", stars: 12, category: "plugin", x: 9, y: 3, connections: ["eliza", "plugin-node"], status: "cleared", sprite: "star" },
  { repo: "plugin-discord", displayName: "DISCORD GATE", description: "Discord connector", org: "elizaos-plugins", stars: 25, category: "plugin", x: 2, y: 3, connections: ["eliza", "plugin-slack"], status: "cleared", sprite: "star" },
  { repo: "plugin-telegram", displayName: "TELEGRAM GATE", description: "Telegram connector", org: "elizaos-plugins", stars: 22, category: "plugin", x: 12, y: 3, connections: ["eliza", "plugin-whatsapp"], status: "cleared", sprite: "star" },
  { repo: "plugin-twitter", displayName: "TWITTER GATE", description: "Twitter/X connector", org: "elizaos-plugins", stars: 35, category: "plugin", x: 12, y: 6, connections: ["agent-twitter-client"], status: "cleared", sprite: "star" },
  { repo: "plugin-solana", displayName: "SOLANA CHAIN", description: "Solana blockchain", org: "elizaos-plugins", stars: 30, category: "plugin", x: 0, y: 6, connections: ["token-manager", "plugin-coinbase"], status: "cleared", sprite: "star" },
  { repo: "plugin-evm", displayName: "EVM CHAIN", description: "EVM/Ethereum support", org: "elizaos-plugins", stars: 28, category: "plugin", x: 14, y: 6, connections: ["token-manager", "plugin-arbitrum"], status: "cleared", sprite: "star" },
  { repo: "plugin-openai", displayName: "OPENAI NEXUS", description: "OpenAI models", org: "elizaos-plugins", stars: 20, category: "plugin", x: 6, y: 1, connections: ["eliza", "plugin-anthropic"], status: "cleared", sprite: "star" },
  { repo: "plugin-anthropic", displayName: "CLAUDE NEXUS", description: "Anthropic Claude", org: "elizaos-plugins", stars: 18, category: "plugin", x: 8, y: 1, connections: ["eliza", "plugin-openai"], status: "cleared", sprite: "star" },
  { repo: "plugin-github", displayName: "GITHUB FORGE", description: "GitHub integration", org: "elizaos-plugins", stars: 12, category: "plugin", x: 0, y: 8, connections: ["prr"], status: "active", sprite: "star" },
  { repo: "plugin-coinbase", displayName: "COINBASE BANK", description: "Coinbase Commerce", org: "elizaos-plugins", stars: 10, category: "plugin", x: 0, y: 3, connections: ["plugin-solana"], status: "active", sprite: "star" },
  { repo: "plugin-slack", displayName: "SLACK CHANNEL", description: "Slack connector", org: "elizaos-plugins", stars: 10, category: "plugin", x: 3, y: 8, connections: ["plugin-discord"], status: "active", sprite: "star" },
  { repo: "plugin-whatsapp", displayName: "WHATSAPP LINK", description: "WhatsApp connector", org: "elizaos-plugins", stars: 12, category: "plugin", x: 11, y: 8, connections: ["plugin-telegram"], status: "active", sprite: "star" },
  { repo: "plugin-arbitrum", displayName: "ARBITRUM L2", description: "Arbitrum integration", org: "elizaos-plugins", stars: 3, category: "plugin", x: 14, y: 3, connections: ["plugin-evm"], status: "locked", sprite: "star" },
  { repo: "plugin-image-generation", displayName: "IMG GEN LAB", description: "AI image generation", org: "elizaos-plugins", stars: 16, category: "plugin", x: 7, y: 0, connections: ["plugin-openai"], status: "active", sprite: "star" },

  // ── Major associated projects ──────────────────────────────────────
  { repo: "milady", displayName: "MILADY CITADEL", description: "terminally online — personal AI on elizaOS", org: "milady-ai", stars: 500, category: "community", x: 4, y: 0, connections: ["eliza", "plugin-node", "plugin-discord"], status: "cleared", sprite: "castle" },
  { repo: "spartan", displayName: "SPARTAN ARENA", description: "Your quant — trading agent", org: "elizaOS", stars: 84, category: "official-tool", x: 12, y: 0, connections: ["eliza", "plugin-solana", "plugin-evm"], status: "cleared", sprite: "fortress" },
  { repo: "the-org", displayName: "THE ORG HQ", description: "Agents for organizations", org: "elizaOS", stars: 52, category: "official-tool", x: 0, y: 4, connections: ["eliza", "plugin-discord", "plugin-slack"], status: "cleared", sprite: "fortress" },
  { repo: "LiveVideoChat", displayName: "VIDEO SANCTUM", description: "Live video chat with agents", org: "elizaOS", stars: 75, category: "official-tool", x: 10, y: 0, connections: ["eliza", "plugin-livekit"], status: "cleared", sprite: "tower" },
  { repo: "SWEagent", displayName: "SWE FORGE", description: "Autonomous software engineering agent", org: "elizaOS", stars: 22, category: "official-tool", x: 14, y: 4, connections: ["eliza", "plugin-github"], status: "active", sprite: "tower" },
  { repo: "mcp-gateway", displayName: "MCP GATEWAY", description: "Model Context Protocol gateway", org: "elizaOS", stars: 12, category: "infrastructure", x: 6, y: 8, connections: ["eliza", "plugin-mcp"], status: "active", sprite: "bridge" },
  { repo: "trust_scoreboard", displayName: "TRUST TOWER", description: "Trust scoring dashboard", org: "elizaOS", stars: 11, category: "infrastructure", x: 8, y: 8, connections: ["eliza", "elizaos.github.io"], status: "active", sprite: "tower" },
  { repo: "eliza-3d-hyperfy-starter", displayName: "3D HYPERWORLD", description: "3D MMO agent with Hyperfy", org: "elizaOS", stars: 41, category: "game", x: 14, y: 2, connections: ["eliza"], status: "active", sprite: "cave" },
];

// ── Plugin power-ups on paths ───────────────────────────────────────
export const PLUGIN_POWERUPS: ArcadePluginPowerUp[] = [
  { repo: "plugin-starknet", displayName: "StarkNet", group: "blockchain", pathFrom: "plugin-evm", pathTo: "eliza" },
  { repo: "plugin-near", displayName: "NEAR", group: "blockchain", pathFrom: "plugin-solana", pathTo: "eliza" },
  { repo: "plugin-sui", displayName: "Sui", group: "blockchain", pathFrom: "plugin-evm", pathTo: "token-manager" },
  { repo: "plugin-flow", displayName: "Flow", group: "blockchain", pathFrom: "plugin-solana", pathTo: "eliza" },
  { repo: "plugin-aptos", displayName: "Aptos", group: "blockchain", pathFrom: "plugin-evm", pathTo: "eliza" },
  { repo: "plugin-cosmos", displayName: "Cosmos", group: "blockchain", pathFrom: "plugin-solana", pathTo: "plugin-evm" },
  { repo: "plugin-avalanche", displayName: "Avalanche", group: "blockchain", pathFrom: "plugin-evm", pathTo: "eliza" },
  { repo: "plugin-zksync", displayName: "zkSync", group: "blockchain", pathFrom: "plugin-arbitrum", pathTo: "plugin-evm" },
  { repo: "plugin-bnb", displayName: "BNB", group: "blockchain", pathFrom: "plugin-evm", pathTo: "plugin-coinbase" },
  { repo: "plugin-ton", displayName: "TON", group: "blockchain", pathFrom: "plugin-telegram", pathTo: "eliza" },
  { repo: "plugin-conflux", displayName: "Conflux", group: "blockchain", pathFrom: "plugin-evm", pathTo: "eliza" },
  { repo: "plugin-cronoszkevm", displayName: "Cronos", group: "blockchain", pathFrom: "plugin-evm", pathTo: "eliza" },
  { repo: "plugin-multiversx", displayName: "MultiversX", group: "blockchain", pathFrom: "plugin-evm", pathTo: "eliza" },
  { repo: "plugin-icp", displayName: "ICP", group: "blockchain", pathFrom: "eliza", pathTo: "plugin-evm" },
  { repo: "plugin-story", displayName: "Story", group: "blockchain", pathFrom: "plugin-nft-generation", pathTo: "eliza" },
  { repo: "plugin-local-ai", displayName: "Local AI", group: "ai", pathFrom: "plugin-openai", pathTo: "eliza" },
  { repo: "plugin-allora", displayName: "Allora", group: "ai", pathFrom: "plugin-openai", pathTo: "eliza" },
  { repo: "plugin-tts", displayName: "TTS", group: "media", pathFrom: "eliza", pathTo: "plugin-discord" },
  { repo: "plugin-video-generation", displayName: "Video Gen", group: "media", pathFrom: "plugin-image-generation", pathTo: "eliza" },
  { repo: "plugin-giphy", displayName: "Giphy", group: "media", pathFrom: "plugin-discord", pathTo: "plugin-telegram" },
  { repo: "plugin-rabbi-trader", displayName: "Rabbi Trader", group: "defi", pathFrom: "plugin-solana", pathTo: "plugin-coinbase" },
  { repo: "plugin-birdeye", displayName: "Birdeye", group: "defi", pathFrom: "plugin-solana", pathTo: "eliza" },
  { repo: "plugin-pyth", displayName: "Pyth", group: "defi", pathFrom: "plugin-solana", pathTo: "eliza" },
  { repo: "plugin-nft-generation", displayName: "NFT Mint", group: "defi", pathFrom: "plugin-solana", pathTo: "plugin-image-generation" },
  { repo: "plugin-0g", displayName: "0G", group: "defi", pathFrom: "eliza", pathTo: "plugin-solana" },
  { repo: "plugin-farcaster", displayName: "Farcaster", group: "social", pathFrom: "plugin-twitter", pathTo: "eliza" },
  { repo: "plugin-lens", displayName: "Lens", group: "social", pathFrom: "plugin-farcaster", pathTo: "eliza" },
  { repo: "plugin-web-search", displayName: "Web Search", group: "dev", pathFrom: "eliza", pathTo: "plugin-openai" },
  { repo: "plugin-goat", displayName: "GOAT", group: "dev", pathFrom: "eliza", pathTo: "plugin-evm" },
  { repo: "plugin-tee", displayName: "TEE", group: "infra", pathFrom: "eliza", pathTo: "plugin-node" },
  { repo: "plugin-coding-agent", displayName: "Coding Agent", group: "dev", pathFrom: "eliza", pathTo: "plugin-github" },
  { repo: "plugin-ui", displayName: "Plugin UI", group: "dev", pathFrom: "eliza", pathTo: "plugin-bootstrap" },
  { repo: "plugin-repoprompt", displayName: "RepoPrompt", group: "dev", pathFrom: "plugin-github", pathTo: "eliza" },
  { repo: "plugin-pi-ai", displayName: "Pi AI", group: "ai", pathFrom: "plugin-anthropic", pathTo: "eliza" },
  { repo: "plugin-claude-code-workbench", displayName: "Claude Code", group: "dev", pathFrom: "plugin-anthropic", pathTo: "plugin-github" },
  { repo: "registry", displayName: "Registry", group: "infra", pathFrom: "eliza", pathTo: "plugin-node" },
  // New power-ups for milady + new repos
  { repo: "plugin-hyperliquid", displayName: "Hyperliquid", group: "defi", pathFrom: "spartan", pathTo: "plugin-evm" },
  { repo: "plugin-binance", displayName: "Binance", group: "defi", pathFrom: "spartan", pathTo: "plugin-coinbase" },
  { repo: "plugin-coingecko", displayName: "CoinGecko", group: "defi", pathFrom: "spartan", pathTo: "eliza" },
  { repo: "plugin-livekit", displayName: "LiveKit", group: "media", pathFrom: "LiveVideoChat", pathTo: "eliza" },
  { repo: "plugin-elevenlabs", displayName: "ElevenLabs", group: "media", pathFrom: "plugin-tts", pathTo: "eliza" },
  { repo: "plugin-mcp", displayName: "MCP", group: "infra", pathFrom: "mcp-gateway", pathTo: "eliza" },
  { repo: "plugin-linear", displayName: "Linear", group: "dev", pathFrom: "SWEagent", pathTo: "plugin-github" },
  { repo: "plugin-ollama", displayName: "Ollama", group: "ai", pathFrom: "plugin-local-ai", pathTo: "milady" },
  { repo: "plugin-3d-generation", displayName: "3D Gen", group: "media", pathFrom: "eliza-3d-hyperfy-starter", pathTo: "plugin-image-generation" },
];

// ── Repo Grades (non-core repos scored across dimensions) ───────────
export type RepoGradeLetter = "S" | "A" | "B" | "C" | "D" | "F";

export interface RepoGrade {
  repo: string;
  displayName: string;
  org: "elizaOS" | "elizaos-plugins" | "milady-ai" | "community";
  category: "official-tool" | "plugin" | "documentation" | "community" | "game" | "infrastructure";
  overallGrade: RepoGradeLetter;
  overallScore: number; // 0-100
  /** Age in days since repo creation */
  ageDays: number;
  /** elizaEffect score — only meaningful for repos < 60 days old */
  elizaEffect: number | null;
  dimensions: {
    activity: { grade: RepoGradeLetter; score: number; detail: string };
    community: { grade: RepoGradeLetter; score: number; detail: string };
    quality: { grade: RepoGradeLetter; score: number; detail: string };
    adoption: { grade: RepoGradeLetter; score: number; detail: string };
    maintenance: { grade: RepoGradeLetter; score: number; detail: string };
  };
  stats: {
    stars: number;
    forks: number;
    contributors: number;
    openIssues: number;
    lastCommitDaysAgo: number;
    weeklyCommits: number;
  };
}

function gradeFromScore(score: number): RepoGradeLetter {
  if (score >= 90) return "S";
  if (score >= 75) return "A";
  if (score >= 60) return "B";
  if (score >= 45) return "C";
  if (score >= 30) return "D";
  return "F";
}

function makeRepoGrade(
  repo: string,
  displayName: string,
  org: RepoGrade["org"],
  category: RepoGrade["category"],
  stats: RepoGrade["stats"],
  dims: { activity: number; community: number; quality: number; adoption: number; maintenance: number },
  details: { activity: string; community: string; quality: string; adoption: string; maintenance: string },
  ageDays: number = 365,
): RepoGrade {
  const overall = Math.round(
    dims.activity * 0.25 + dims.community * 0.2 + dims.quality * 0.2 + dims.adoption * 0.2 + dims.maintenance * 0.15
  );
  // elizaEffect only for repos under 2 months old — measures early momentum
  const elizaEffect = ageDays < 60
    ? Math.round(
        (stats.weeklyCommits * 120) +
        (stats.stars * 25) +
        (stats.contributors * 200) +
        (stats.forks * 80) +
        (dims.activity * 8) +
        (dims.community * 6) +
        ((60 - ageDays) * 5) // recency bonus
      )
    : null;
  return {
    repo,
    ageDays,
    elizaEffect,
    displayName,
    org,
    category,
    overallGrade: gradeFromScore(overall),
    overallScore: overall,
    dimensions: {
      activity: { grade: gradeFromScore(dims.activity), score: dims.activity, detail: details.activity },
      community: { grade: gradeFromScore(dims.community), score: dims.community, detail: details.community },
      quality: { grade: gradeFromScore(dims.quality), score: dims.quality, detail: details.quality },
      adoption: { grade: gradeFromScore(dims.adoption), score: dims.adoption, detail: details.adoption },
      maintenance: { grade: gradeFromScore(dims.maintenance), score: dims.maintenance, detail: details.maintenance },
    },
    stats,
  };
}

export const REPO_GRADES: RepoGrade[] = [
  // ── elizaOS org (non-core) ────────────────────────────────────────
  makeRepoGrade("eliza-starter", "Starter Template", "elizaOS", "official-tool",
    { stars: 240, forks: 180, contributors: 28, openIssues: 12, lastCommitDaysAgo: 3, weeklyCommits: 8 },
    { activity: 78, community: 72, quality: 82, adoption: 80, maintenance: 85 },
    { activity: "8 commits/week, active development", community: "28 contributors, growing", quality: "Clean template, well-documented", adoption: "240 stars, heavily forked", maintenance: "Updated 3 days ago" },
  ),
  makeRepoGrade("characterfile", "Character Format", "elizaOS", "official-tool",
    { stars: 320, forks: 110, contributors: 19, openIssues: 8, lastCommitDaysAgo: 7, weeklyCommits: 4 },
    { activity: 62, community: 65, quality: 88, adoption: 85, maintenance: 75 },
    { activity: "4 commits/week, stable pace", community: "19 contributors", quality: "Simple, well-designed format", adoption: "320 stars, widely used", maintenance: "Updated last week" },
  ),
  makeRepoGrade("agentmemory", "Agent Memory", "elizaOS", "official-tool",
    { stars: 90, forks: 25, contributors: 12, openIssues: 15, lastCommitDaysAgo: 5, weeklyCommits: 6 },
    { activity: 70, community: 55, quality: 72, adoption: 58, maintenance: 68 },
    { activity: "6 commits/week", community: "12 contributors", quality: "Solid chromadb integration", adoption: "90 stars, niche usage", maintenance: "Active, some open issues" },
  ),
  makeRepoGrade("agent-twitter-client", "Twitter Client", "elizaOS", "official-tool",
    { stars: 60, forks: 25, contributors: 14, openIssues: 22, lastCommitDaysAgo: 2, weeklyCommits: 11 },
    { activity: 85, community: 60, quality: 65, adoption: 55, maintenance: 62 },
    { activity: "11 commits/week, very active", community: "14 contributors", quality: "API rate limits need work", adoption: "60 stars, growing", maintenance: "22 open issues" },
  ),
  makeRepoGrade("awesome-eliza", "Awesome List", "elizaOS", "documentation",
    { stars: 190, forks: 40, contributors: 32, openIssues: 5, lastCommitDaysAgo: 1, weeklyCommits: 3 },
    { activity: 55, community: 80, quality: 90, adoption: 78, maintenance: 92 },
    { activity: "Community-driven updates", community: "32 contributors, very open", quality: "Well-organized, curated", adoption: "190 stars, reference material", maintenance: "Very well maintained" },
  ),
  makeRepoGrade("elizaos.github.io", "Website", "elizaOS", "documentation",
    { stars: 45, forks: 50, contributors: 22, openIssues: 8, lastCommitDaysAgo: 1, weeklyCommits: 14 },
    { activity: 90, community: 70, quality: 78, adoption: 52, maintenance: 88 },
    { activity: "14 commits/week, rapid iteration", community: "22 contributors", quality: "Modern design, good UX", adoption: "Public-facing, key infra", maintenance: "Continuously deployed" },
  ),
  makeRepoGrade("eliza-docs", "Documentation", "elizaOS", "documentation",
    { stars: 30, forks: 15, contributors: 18, openIssues: 14, lastCommitDaysAgo: 2, weeklyCommits: 7 },
    { activity: 72, community: 65, quality: 70, adoption: 48, maintenance: 65 },
    { activity: "7 commits/week", community: "18 doc contributors", quality: "Comprehensive but gaps exist", adoption: "Essential reference", maintenance: "Some stale sections" },
  ),
  makeRepoGrade("knowledge-base", "Knowledge Base", "elizaOS", "official-tool",
    { stars: 18, forks: 8, contributors: 6, openIssues: 9, lastCommitDaysAgo: 12, weeklyCommits: 2 },
    { activity: 42, community: 35, quality: 60, adoption: 32, maintenance: 45 },
    { activity: "2 commits/week, slow", community: "6 contributors", quality: "Decent RAG pipeline", adoption: "18 stars, early stage", maintenance: "Needs attention" },
  ),
  makeRepoGrade("token-manager", "Token Manager", "elizaOS", "official-tool",
    { stars: 15, forks: 5, contributors: 5, openIssues: 7, lastCommitDaysAgo: 14, weeklyCommits: 1 },
    { activity: 35, community: 30, quality: 55, adoption: 28, maintenance: 40 },
    { activity: "1 commit/week", community: "5 contributors", quality: "Basic balance tracking", adoption: "15 stars", maintenance: "2 weeks since update" },
  ),
  makeRepoGrade("prr", "PR Review Agent", "elizaOS", "official-tool",
    { stars: 3, forks: 1, contributors: 3, openIssues: 4, lastCommitDaysAgo: 21, weeklyCommits: 0 },
    { activity: 18, community: 15, quality: 45, adoption: 12, maintenance: 22 },
    { activity: "Inactive, no weekly commits", community: "3 contributors", quality: "Prototype stage", adoption: "3 stars, minimal", maintenance: "3 weeks stale" },
  ),
  makeRepoGrade("openclaw-adapter", "OpenClaw Adapter", "elizaOS", "official-tool",
    { stars: 37, forks: 7, contributors: 4, openIssues: 3, lastCommitDaysAgo: 30, weeklyCommits: 0 },
    { activity: 15, community: 22, quality: 50, adoption: 38, maintenance: 18 },
    { activity: "No recent commits", community: "4 contributors", quality: "Functional adapter", adoption: "37 stars, niche", maintenance: "1 month stale" },
  ),
  makeRepoGrade("examples", "Examples", "elizaOS", "official-tool",
    { stars: 4, forks: 0, contributors: 4, openIssues: 2, lastCommitDaysAgo: 10, weeklyCommits: 1 },
    { activity: 30, community: 25, quality: 55, adoption: 15, maintenance: 35 },
    { activity: "Sporadic updates", community: "4 contributors", quality: "Basic examples", adoption: "4 stars, underused", maintenance: "Needs more examples" },
  ),
  makeRepoGrade("benchmarks", "Benchmarks", "elizaOS", "official-tool",
    { stars: 5, forks: 0, contributors: 2, openIssues: 1, lastCommitDaysAgo: 45, weeklyCommits: 0 },
    { activity: 10, community: 12, quality: 40, adoption: 15, maintenance: 12 },
    { activity: "Dormant", community: "2 contributors", quality: "Early framework", adoption: "5 stars", maintenance: "45 days since update" },
  ),
  makeRepoGrade("runtime-config", "Runtime Config", "elizaOS", "official-tool",
    { stars: 8, forks: 2, contributors: 3, openIssues: 3, lastCommitDaysAgo: 18, weeklyCommits: 0 },
    { activity: 22, community: 18, quality: 52, adoption: 22, maintenance: 28 },
    { activity: "Rarely updated", community: "3 contributors", quality: "Basic config system", adoption: "8 stars", maintenance: "Nearly 3 weeks stale" },
  ),
  makeRepoGrade("eliza-2004scape", "Runescape Eliza", "elizaOS", "community",
    { stars: 0, forks: 0, contributors: 1, openIssues: 0, lastCommitDaysAgo: 60, weeklyCommits: 0 },
    { activity: 5, community: 5, quality: 30, adoption: 5, maintenance: 5 },
    { activity: "Experimental, inactive", community: "Solo project", quality: "Fun concept, early code", adoption: "No stars yet", maintenance: "2 months stale" },
  ),

  // ── elizaos-plugins org ───────────────────────────────────────────
  makeRepoGrade("registry", "Plugin Registry", "elizaos-plugins", "plugin",
    { stars: 50, forks: 30, contributors: 15, openIssues: 6, lastCommitDaysAgo: 1, weeklyCommits: 12 },
    { activity: 88, community: 65, quality: 82, adoption: 72, maintenance: 90 },
    { activity: "12 commits/week, critical infra", community: "15 contributors", quality: "Well-structured registry", adoption: "Core dependency", maintenance: "Continuously updated" },
  ),
  makeRepoGrade("plugin-discord", "Discord Plugin", "elizaos-plugins", "plugin",
    { stars: 25, forks: 12, contributors: 11, openIssues: 8, lastCommitDaysAgo: 3, weeklyCommits: 5 },
    { activity: 72, community: 58, quality: 78, adoption: 82, maintenance: 75 },
    { activity: "5 commits/week", community: "11 contributors", quality: "Stable, full-featured", adoption: "Most popular connector", maintenance: "Actively maintained" },
  ),
  makeRepoGrade("plugin-telegram", "Telegram Plugin", "elizaos-plugins", "plugin",
    { stars: 22, forks: 10, contributors: 9, openIssues: 6, lastCommitDaysAgo: 4, weeklyCommits: 4 },
    { activity: 65, community: 52, quality: 75, adoption: 78, maintenance: 72 },
    { activity: "4 commits/week", community: "9 contributors", quality: "Good bot API coverage", adoption: "High demand connector", maintenance: "Stable" },
  ),
  makeRepoGrade("plugin-twitter", "Twitter Plugin", "elizaos-plugins", "plugin",
    { stars: 35, forks: 18, contributors: 13, openIssues: 15, lastCommitDaysAgo: 1, weeklyCommits: 9 },
    { activity: 82, community: 62, quality: 68, adoption: 88, maintenance: 65 },
    { activity: "9 commits/week, high velocity", community: "13 contributors", quality: "Rate limit challenges", adoption: "Most starred plugin", maintenance: "15 open issues" },
  ),
  makeRepoGrade("plugin-solana", "Solana Plugin", "elizaos-plugins", "plugin",
    { stars: 30, forks: 15, contributors: 10, openIssues: 9, lastCommitDaysAgo: 2, weeklyCommits: 7 },
    { activity: 78, community: 55, quality: 75, adoption: 82, maintenance: 70 },
    { activity: "7 commits/week", community: "10 contributors", quality: "Solid wallet + TX support", adoption: "Core DeFi plugin", maintenance: "Active development" },
  ),
  makeRepoGrade("plugin-evm", "EVM Plugin", "elizaos-plugins", "plugin",
    { stars: 28, forks: 14, contributors: 11, openIssues: 10, lastCommitDaysAgo: 3, weeklyCommits: 6 },
    { activity: 72, community: 55, quality: 72, adoption: 78, maintenance: 68 },
    { activity: "6 commits/week", community: "11 contributors, multi-chain", quality: "Broad EVM coverage", adoption: "Essential for ETH ecosystem", maintenance: "Some issues backlog" },
  ),
  makeRepoGrade("plugin-openai", "OpenAI Plugin", "elizaos-plugins", "plugin",
    { stars: 20, forks: 9, contributors: 8, openIssues: 4, lastCommitDaysAgo: 5, weeklyCommits: 3 },
    { activity: 55, community: 48, quality: 85, adoption: 90, maintenance: 78 },
    { activity: "3 commits/week, stable", community: "8 contributors", quality: "Clean API wrapper", adoption: "Default LLM provider", maintenance: "Well-maintained" },
  ),
  makeRepoGrade("plugin-anthropic", "Anthropic Plugin", "elizaos-plugins", "plugin",
    { stars: 18, forks: 7, contributors: 6, openIssues: 3, lastCommitDaysAgo: 7, weeklyCommits: 2 },
    { activity: 48, community: 40, quality: 85, adoption: 75, maintenance: 78 },
    { activity: "2 commits/week", community: "6 contributors", quality: "Clean Claude integration", adoption: "Popular alternative LLM", maintenance: "Well-maintained" },
  ),
  makeRepoGrade("plugin-node", "Node Runtime", "elizaos-plugins", "plugin",
    { stars: 15, forks: 8, contributors: 7, openIssues: 3, lastCommitDaysAgo: 4, weeklyCommits: 3 },
    { activity: 55, community: 42, quality: 80, adoption: 85, maintenance: 80 },
    { activity: "3 commits/week", community: "7 contributors", quality: "Core runtime, solid", adoption: "Required dependency", maintenance: "Stable, low issues" },
  ),
  makeRepoGrade("plugin-bootstrap", "Bootstrap Plugin", "elizaos-plugins", "plugin",
    { stars: 12, forks: 6, contributors: 6, openIssues: 2, lastCommitDaysAgo: 6, weeklyCommits: 2 },
    { activity: 48, community: 38, quality: 78, adoption: 82, maintenance: 82 },
    { activity: "2 commits/week", community: "6 contributors", quality: "Core actions, reliable", adoption: "Default plugin", maintenance: "Stable" },
  ),
  makeRepoGrade("plugin-image-generation", "Image Gen", "elizaos-plugins", "plugin",
    { stars: 16, forks: 7, contributors: 5, openIssues: 6, lastCommitDaysAgo: 8, weeklyCommits: 2 },
    { activity: 45, community: 35, quality: 68, adoption: 62, maintenance: 55 },
    { activity: "2 commits/week", community: "5 contributors", quality: "Multiple backends", adoption: "Popular creative tool", maintenance: "Some stale issues" },
  ),
  makeRepoGrade("plugin-video-generation", "Video Gen", "elizaos-plugins", "plugin",
    { stars: 10, forks: 4, contributors: 3, openIssues: 5, lastCommitDaysAgo: 20, weeklyCommits: 0 },
    { activity: 22, community: 20, quality: 45, adoption: 35, maintenance: 28 },
    { activity: "Inactive recently", community: "3 contributors", quality: "Basic generation pipeline", adoption: "10 stars", maintenance: "3 weeks since update" },
  ),
  makeRepoGrade("plugin-tts", "Text-to-Speech", "elizaos-plugins", "plugin",
    { stars: 8, forks: 3, contributors: 3, openIssues: 4, lastCommitDaysAgo: 25, weeklyCommits: 0 },
    { activity: 18, community: 18, quality: 52, adoption: 30, maintenance: 22 },
    { activity: "No recent activity", community: "3 contributors", quality: "Basic TTS support", adoption: "8 stars", maintenance: "Needs refresh" },
  ),
  makeRepoGrade("plugin-coinbase", "Coinbase Plugin", "elizaos-plugins", "plugin",
    { stars: 10, forks: 5, contributors: 4, openIssues: 3, lastCommitDaysAgo: 15, weeklyCommits: 1 },
    { activity: 32, community: 28, quality: 65, adoption: 45, maintenance: 42 },
    { activity: "1 commit/week", community: "4 contributors", quality: "Commerce API integration", adoption: "Niche payment use", maintenance: "2 weeks gap" },
  ),
  makeRepoGrade("plugin-starknet", "StarkNet Plugin", "elizaos-plugins", "plugin",
    { stars: 8, forks: 3, contributors: 4, openIssues: 5, lastCommitDaysAgo: 12, weeklyCommits: 1 },
    { activity: 32, community: 28, quality: 58, adoption: 30, maintenance: 38 },
    { activity: "Sporadic commits", community: "4 contributors", quality: "Basic StarkNet support", adoption: "8 stars, niche", maintenance: "Needs work" },
  ),
  makeRepoGrade("plugin-near", "NEAR Plugin", "elizaos-plugins", "plugin",
    { stars: 6, forks: 2, contributors: 3, openIssues: 4, lastCommitDaysAgo: 18, weeklyCommits: 0 },
    { activity: 22, community: 20, quality: 50, adoption: 22, maintenance: 28 },
    { activity: "Inactive", community: "3 contributors", quality: "Basic NEAR integration", adoption: "6 stars", maintenance: "Nearly 3 weeks stale" },
  ),
  makeRepoGrade("plugin-sui", "Sui Plugin", "elizaos-plugins", "plugin",
    { stars: 5, forks: 2, contributors: 2, openIssues: 3, lastCommitDaysAgo: 22, weeklyCommits: 0 },
    { activity: 18, community: 15, quality: 48, adoption: 18, maintenance: 22 },
    { activity: "No recent commits", community: "2 contributors", quality: "Early Sui support", adoption: "5 stars", maintenance: "3+ weeks stale" },
  ),
  makeRepoGrade("plugin-whatsapp", "WhatsApp Plugin", "elizaos-plugins", "plugin",
    { stars: 12, forks: 5, contributors: 5, openIssues: 7, lastCommitDaysAgo: 10, weeklyCommits: 1 },
    { activity: 35, community: 32, quality: 58, adoption: 48, maintenance: 40 },
    { activity: "1 commit/week", community: "5 contributors", quality: "Business API support", adoption: "12 stars, demand growing", maintenance: "Some open issues" },
  ),
  makeRepoGrade("plugin-slack", "Slack Plugin", "elizaos-plugins", "plugin",
    { stars: 10, forks: 4, contributors: 4, openIssues: 5, lastCommitDaysAgo: 14, weeklyCommits: 1 },
    { activity: 30, community: 28, quality: 62, adoption: 42, maintenance: 35 },
    { activity: "Slow updates", community: "4 contributors", quality: "Workspace connector OK", adoption: "10 stars", maintenance: "2 weeks gap" },
  ),
  makeRepoGrade("plugin-farcaster", "Farcaster Plugin", "elizaos-plugins", "plugin",
    { stars: 8, forks: 3, contributors: 4, openIssues: 3, lastCommitDaysAgo: 8, weeklyCommits: 2 },
    { activity: 45, community: 32, quality: 62, adoption: 35, maintenance: 52 },
    { activity: "2 commits/week", community: "4 web3 social devs", quality: "Hub/Neynar integration", adoption: "Growing protocol", maintenance: "Decent" },
  ),
  makeRepoGrade("plugin-lens", "Lens Plugin", "elizaos-plugins", "plugin",
    { stars: 7, forks: 2, contributors: 3, openIssues: 4, lastCommitDaysAgo: 20, weeklyCommits: 0 },
    { activity: 20, community: 20, quality: 50, adoption: 25, maintenance: 25 },
    { activity: "Inactive", community: "3 contributors", quality: "V2 API coverage", adoption: "7 stars", maintenance: "3 weeks stale" },
  ),
  makeRepoGrade("plugin-github", "GitHub Plugin", "elizaos-plugins", "plugin",
    { stars: 12, forks: 5, contributors: 6, openIssues: 4, lastCommitDaysAgo: 5, weeklyCommits: 3 },
    { activity: 55, community: 40, quality: 72, adoption: 52, maintenance: 65 },
    { activity: "3 commits/week", community: "6 contributors", quality: "PR/Issue automation", adoption: "12 stars, dev-focused", maintenance: "Active" },
  ),
  makeRepoGrade("plugin-web-search", "Web Search", "elizaos-plugins", "plugin",
    { stars: 9, forks: 4, contributors: 4, openIssues: 3, lastCommitDaysAgo: 10, weeklyCommits: 1 },
    { activity: 35, community: 28, quality: 65, adoption: 45, maintenance: 48 },
    { activity: "1 commit/week", community: "4 contributors", quality: "Serpapi + custom scraping", adoption: "Key capability", maintenance: "OK" },
  ),
  makeRepoGrade("plugin-tee", "TEE Plugin", "elizaos-plugins", "plugin",
    { stars: 7, forks: 3, contributors: 3, openIssues: 5, lastCommitDaysAgo: 12, weeklyCommits: 1 },
    { activity: 32, community: 22, quality: 60, adoption: 28, maintenance: 38 },
    { activity: "Sporadic", community: "3 security-focused devs", quality: "SGX/TDX enclave support", adoption: "7 stars, niche", maintenance: "Needs attention" },
  ),
  makeRepoGrade("plugin-rabbi-trader", "Rabbi Trader", "elizaos-plugins", "plugin",
    { stars: 8, forks: 4, contributors: 3, openIssues: 6, lastCommitDaysAgo: 8, weeklyCommits: 2 },
    { activity: 45, community: 22, quality: 55, adoption: 35, maintenance: 42 },
    { activity: "2 commits/week", community: "3 DeFi devs", quality: "Basic trading strategies", adoption: "8 stars, crypto-native", maintenance: "Active but issues piling" },
  ),
  makeRepoGrade("plugin-nft-generation", "NFT Gen", "elizaos-plugins", "plugin",
    { stars: 6, forks: 2, contributors: 3, openIssues: 3, lastCommitDaysAgo: 15, weeklyCommits: 0 },
    { activity: 22, community: 20, quality: 48, adoption: 25, maintenance: 28 },
    { activity: "Inactive", community: "3 contributors", quality: "Basic minting flow", adoption: "6 stars", maintenance: "2+ weeks stale" },
  ),
  makeRepoGrade("plugin-local-ai", "Local AI", "elizaos-plugins", "plugin",
    { stars: 14, forks: 5, contributors: 4, openIssues: 8, lastCommitDaysAgo: 10, weeklyCommits: 1 },
    { activity: 35, community: 28, quality: 62, adoption: 55, maintenance: 38 },
    { activity: "1 commit/week", community: "4 contributors", quality: "Ollama/llama.cpp support", adoption: "Popular for local dev", maintenance: "8 open issues" },
  ),
  makeRepoGrade("plugin-giphy", "Giphy Plugin", "elizaos-plugins", "plugin",
    { stars: 3, forks: 1, contributors: 2, openIssues: 1, lastCommitDaysAgo: 30, weeklyCommits: 0 },
    { activity: 12, community: 12, quality: 55, adoption: 12, maintenance: 15 },
    { activity: "Dormant", community: "2 contributors", quality: "Simple API wrapper", adoption: "3 stars", maintenance: "1 month stale" },
  ),
  makeRepoGrade("plugin-goat", "GOAT Plugin", "elizaos-plugins", "plugin",
    { stars: 6, forks: 2, contributors: 3, openIssues: 2, lastCommitDaysAgo: 15, weeklyCommits: 0 },
    { activity: 22, community: 20, quality: 55, adoption: 25, maintenance: 28 },
    { activity: "Low activity", community: "3 contributors", quality: "Tool-use integration", adoption: "6 stars", maintenance: "2 weeks gap" },
  ),
  // Newer/smaller plugins — ageDays < 60 get elizaEffect scoring
  makeRepoGrade("plugin-coding-agent", "Coding Agent", "elizaos-plugins", "plugin",
    { stars: 0, forks: 0, contributors: 1, openIssues: 0, lastCommitDaysAgo: 5, weeklyCommits: 3 },
    { activity: 55, community: 8, quality: 45, adoption: 5, maintenance: 55 },
    { activity: "Active development", community: "Solo developer", quality: "PTY-based CLI spawn", adoption: "Brand new", maintenance: "Actively built" },
    18, // 18 days old
  ),
  makeRepoGrade("plugin-ui", "Plugin UI SDK", "elizaos-plugins", "plugin",
    { stars: 0, forks: 0, contributors: 1, openIssues: 0, lastCommitDaysAgo: 8, weeklyCommits: 2 },
    { activity: 45, community: 8, quality: 42, adoption: 5, maintenance: 45 },
    { activity: "In development", community: "Solo developer", quality: "Schema-driven renderers", adoption: "Pre-release", maintenance: "Active" },
    22, // 22 days old
  ),
  makeRepoGrade("plugin-repoprompt", "RepoPrompt", "elizaos-plugins", "plugin",
    { stars: 2, forks: 0, contributors: 1, openIssues: 1, lastCommitDaysAgo: 3, weeklyCommits: 4 },
    { activity: 62, community: 8, quality: 40, adoption: 8, maintenance: 58 },
    { activity: "4 commits/week, new project", community: "Solo developer", quality: "CLI integration early", adoption: "2 stars, brand new", maintenance: "Actively developed" },
    12, // 12 days old
  ),
  makeRepoGrade("plugin-pi-ai", "Pi AI Bridge", "elizaos-plugins", "plugin",
    { stars: 1, forks: 0, contributors: 1, openIssues: 0, lastCommitDaysAgo: 6, weeklyCommits: 2 },
    { activity: 45, community: 8, quality: 38, adoption: 5, maintenance: 48 },
    { activity: "Steady development", community: "Solo developer", quality: "Credential bridge MVP", adoption: "1 star, pre-launch", maintenance: "Active" },
    15, // 15 days old
  ),
  makeRepoGrade("plugin-claude-code-workbench", "Claude Code Workbench", "elizaos-plugins", "plugin",
    { stars: 3, forks: 1, contributors: 2, openIssues: 1, lastCommitDaysAgo: 2, weeklyCommits: 6 },
    { activity: 75, community: 15, quality: 52, adoption: 12, maintenance: 72 },
    { activity: "6 commits/week, rapid build", community: "2 early contributors", quality: "Companion workflow taking shape", adoption: "3 stars, early interest", maintenance: "Very active" },
    25, // 25 days old
  ),
  makeRepoGrade("plugin-allora", "Allora Plugin", "elizaos-plugins", "plugin",
    { stars: 3, forks: 1, contributors: 2, openIssues: 2, lastCommitDaysAgo: 20, weeklyCommits: 0 },
    { activity: 18, community: 12, quality: 45, adoption: 12, maintenance: 22 },
    { activity: "Low activity", community: "2 contributors", quality: "Basic integration", adoption: "3 stars", maintenance: "3 weeks stale" },
    45, // 45 days old — still gets elizaEffect
  ),
  makeRepoGrade("plugin-birdeye", "Birdeye Plugin", "elizaos-plugins", "plugin",
    { stars: 4, forks: 2, contributors: 2, openIssues: 1, lastCommitDaysAgo: 12, weeklyCommits: 1 },
    { activity: 30, community: 15, quality: 58, adoption: 18, maintenance: 35 },
    { activity: "Sporadic", community: "2 DeFi contributors", quality: "Token analytics API", adoption: "4 stars", maintenance: "OK" },
    52, // 52 days old — still gets elizaEffect
  ),
  makeRepoGrade("plugin-pyth", "Pyth Plugin", "elizaos-plugins", "plugin",
    { stars: 3, forks: 1, contributors: 2, openIssues: 2, lastCommitDaysAgo: 18, weeklyCommits: 0 },
    { activity: 18, community: 12, quality: 52, adoption: 15, maintenance: 25 },
    { activity: "Low activity", community: "2 oracle devs", quality: "Price feed integration", adoption: "3 stars", maintenance: "Needs update" },
    48, // 48 days old — still gets elizaEffect
  ),
  // ── milady-ai & new elizaOS repos ────────────────────────────────
  makeRepoGrade("milady", "Milady (milaidy)", "milady-ai" as RepoGrade["org"], "community",
    { stars: 500, forks: 80, contributors: 25, openIssues: 18, lastCommitDaysAgo: 1, weeklyCommits: 22 },
    { activity: 92, community: 78, quality: 82, adoption: 88, maintenance: 85 },
    { activity: "22 commits/week, extremely active", community: "25 contributors, fast growing", quality: "Production desktop app, multi-platform", adoption: "500 stars, biggest associated project", maintenance: "Continuously deployed" },
  ),
  makeRepoGrade("spartan", "Spartan Quant", "elizaOS", "official-tool",
    { stars: 84, forks: 15, contributors: 8, openIssues: 5, lastCommitDaysAgo: 2, weeklyCommits: 9 },
    { activity: 82, community: 48, quality: 75, adoption: 62, maintenance: 78 },
    { activity: "9 commits/week, heavy development", community: "8 contributors", quality: "Trading agent framework", adoption: "84 stars, growing fast", maintenance: "Actively maintained" },
  ),
  makeRepoGrade("the-org", "The Org", "elizaOS", "official-tool",
    { stars: 52, forks: 10, contributors: 6, openIssues: 8, lastCommitDaysAgo: 3, weeklyCommits: 7 },
    { activity: 78, community: 42, quality: 70, adoption: 52, maintenance: 72 },
    { activity: "7 commits/week", community: "6 contributors", quality: "Multi-agent orchestration", adoption: "52 stars, org-focused", maintenance: "Active development" },
  ),
  makeRepoGrade("LiveVideoChat", "Live Video Chat", "elizaOS", "official-tool",
    { stars: 75, forks: 15, contributors: 7, openIssues: 6, lastCommitDaysAgo: 5, weeklyCommits: 4 },
    { activity: 62, community: 45, quality: 72, adoption: 65, maintenance: 68 },
    { activity: "4 commits/week", community: "7 contributors", quality: "WebRTC + agent integration", adoption: "75 stars, unique feature", maintenance: "Stable, maintained" },
  ),
  makeRepoGrade("SWEagent", "SWE Agent", "elizaOS", "official-tool",
    { stars: 22, forks: 5, contributors: 4, openIssues: 3, lastCommitDaysAgo: 4, weeklyCommits: 5 },
    { activity: 68, community: 30, quality: 65, adoption: 38, maintenance: 65 },
    { activity: "5 commits/week, active", community: "4 contributors", quality: "Autonomous coding agent", adoption: "22 stars, developer-focused", maintenance: "Active" },
  ),
  makeRepoGrade("mcp-gateway", "MCP Gateway", "elizaOS", "infrastructure" as RepoGrade["category"],
    { stars: 12, forks: 3, contributors: 3, openIssues: 2, lastCommitDaysAgo: 6, weeklyCommits: 3 },
    { activity: 55, community: 25, quality: 68, adoption: 35, maintenance: 60 },
    { activity: "3 commits/week", community: "3 contributors", quality: "Model Context Protocol gateway", adoption: "12 stars", maintenance: "Active" },
  ),
  makeRepoGrade("trust_scoreboard", "Trust Scoreboard", "elizaOS", "infrastructure" as RepoGrade["category"],
    { stars: 11, forks: 3, contributors: 4, openIssues: 2, lastCommitDaysAgo: 7, weeklyCommits: 2 },
    { activity: 45, community: 28, quality: 62, adoption: 30, maintenance: 52 },
    { activity: "2 commits/week", community: "4 contributors", quality: "Trust scoring system", adoption: "11 stars", maintenance: "Steady" },
  ),
  makeRepoGrade("knowledge", "Knowledge Base", "elizaOS", "documentation",
    { stars: 66, forks: 20, contributors: 10, openIssues: 4, lastCommitDaysAgo: 1, weeklyCommits: 8 },
    { activity: 80, community: 55, quality: 78, adoption: 62, maintenance: 82 },
    { activity: "8 commits/week, daily updates", community: "10 contributors", quality: "RAG-ready ecosystem data", adoption: "66 stars, key infra", maintenance: "Continuously updated" },
  ),
  makeRepoGrade("eliza-3d-hyperfy-starter", "3D Hyperfy Starter", "elizaOS", "game" as RepoGrade["category"],
    { stars: 41, forks: 12, contributors: 5, openIssues: 3, lastCommitDaysAgo: 8, weeklyCommits: 2 },
    { activity: 45, community: 35, quality: 65, adoption: 42, maintenance: 48 },
    { activity: "2 commits/week", community: "5 contributors", quality: "3D MMO prototyping framework", adoption: "41 stars, unique niche", maintenance: "Periodic updates" },
  ),
  makeRepoGrade("LJSpeechTools", "LJ Speech Tools", "elizaOS", "official-tool",
    { stars: 26, forks: 5, contributors: 3, openIssues: 1, lastCommitDaysAgo: 20, weeklyCommits: 0 },
    { activity: 18, community: 20, quality: 62, adoption: 35, maintenance: 25 },
    { activity: "Low activity recently", community: "3 contributors", quality: "Speech dataset generation", adoption: "26 stars", maintenance: "3 weeks stale" },
  ),
].sort((a, b) => b.overallScore - a.overallScore);

export const GRADE_COLORS: Record<RepoGradeLetter, string> = {
  S: "#ff0040",
  A: "#ffd700",
  B: "#22d3ee",
  C: "#34d399",
  D: "#f97316",
  F: "#64748b",
};

// ── Helper: get all repos for a given grade ─────────────────────────
export function getReposByGrade(grade: RepoGradeLetter): RepoGrade[] {
  return REPO_GRADES.filter((r) => r.overallGrade === grade);
}

// ── Helper: get unique repo list for leaderboard filtering ──────────
export function getAllRepoNames(): string[] {
  const repos = new Set<string>();
  ARCADE_FIGHTERS.forEach((f) => f.repos.forEach((r) => repos.add(r)));
  return Array.from(repos).sort();
}

// ── Color maps ──────────────────────────────────────────────────────
export const TIER_COLORS: Record<ArcadeFighter["tier"], string> = {
  boss: "#ff0040",
  champion: "#ffd700",
  warrior: "#00ccff",
  rookie: "#88ff88",
};

export const SPRITE_COLORS: Record<ArcadeLevelNode["sprite"], string> = {
  castle: "#ff0040",
  fortress: "#ff8800",
  tower: "#3b82f6",
  house: "#34d399",
  hut: "#94a3b8",
  cave: "#a78bfa",
  bridge: "#fbbf24",
  star: "#22d3ee",
};

export const GROUP_COLORS: Record<ArcadePluginPowerUp["group"], string> = {
  social: "#f472b6",
  blockchain: "#a78bfa",
  ai: "#22d3ee",
  media: "#fbbf24",
  defi: "#34d399",
  dev: "#60a5fa",
  infra: "#94a3b8",
};

// ── Helper: get fighters for a specific repo ────────────────────────
export function getFightersForRepo(repo: string): ArcadeFighter[] {
  return ARCADE_FIGHTERS.filter((f) => f.repos.includes(repo)).sort((a, b) => b.score - a.score);
}

// ── Helper: get level node by repo name ─────────────────────────────
export function getLevelNode(repo: string): ArcadeLevelNode | undefined {
  return LEVEL_NODES.find((n) => n.repo === repo);
}
