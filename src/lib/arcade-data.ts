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
  org: "elizaOS" | "elizaos-plugins";
  stars: number;
  category: "core" | "official-tool" | "plugin" | "documentation" | "community";
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
];

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
