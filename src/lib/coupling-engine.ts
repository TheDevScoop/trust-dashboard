import type {
  GitHubRepo,
  EcosystemNode,
  EcosystemEdge,
  NodeCategory,
  EcosystemData,
  ContributorInfo,
  GitHubContributor,
} from "./ecosystem-types";

const CORE_REPO_NAME = "eliza";
const ELIZA_KEYWORDS = [
  "eliza",
  "elizaos",
  "ai16z",
  "agent",
  "ai-agent",
  "autonomous",
  "plugin",
  "agentic",
];

type RepoSource = "elizaOS" | "elizaos-plugins" | "community";

function categorizeRepo(repo: GitHubRepo, source: RepoSource): NodeCategory {
  const name = repo.name.toLowerCase();
  const ownerLogin = repo.owner.login.toLowerCase();

  // Core eliza repo
  if (ownerLogin === "elizaos" && name === CORE_REPO_NAME) return "core";

  // Documentation repos
  if (
    name.includes("doc") ||
    name.includes("github.io") ||
    name.includes("website") ||
    name.includes("landing") ||
    name.includes("awesome")
  ) {
    return "documentation";
  }

  // Plugin repos
  if (source === "elizaos-plugins" || name.startsWith("plugin-")) return "plugin";
  
  // Official tools from main org
  if (source === "elizaOS") return "official-tool";

  // Everything else is community
  return "community";
}

function calcNameSimilarity(repo: GitHubRepo): number {
  const name = repo.name.toLowerCase();
  const desc = (repo.description || "").toLowerCase();
  const topics = (repo.topics || []).map((t) => t.toLowerCase());

  let score = 0;
  for (const kw of ELIZA_KEYWORDS) {
    if (name.includes(kw)) score += 15;
    if (desc.includes(kw)) score += 5;
    if (topics.some((t) => t.includes(kw))) score += 10;
  }
  return Math.min(score, 100);
}

function calcActivityRecency(repo: GitHubRepo): number {
  const updatedAt = new Date(repo.pushed_at || repo.updated_at).getTime();
  const now = Date.now();
  const daysSinceUpdate = (now - updatedAt) / (1000 * 60 * 60 * 24);

  if (daysSinceUpdate < 7) return 100;
  if (daysSinceUpdate < 30) return 80;
  if (daysSinceUpdate < 90) return 60;
  if (daysSinceUpdate < 180) return 40;
  if (daysSinceUpdate < 365) return 20;
  return 5;
}

function calcCommunitySignal(
  repo: GitHubRepo,
  maxStars: number,
  maxForks: number
): number {
  const starScore =
    maxStars > 0 ? (repo.stargazers_count / maxStars) * 100 : 0;
  const forkScore =
    maxForks > 0 ? (repo.forks_count / maxForks) * 100 : 0;
  return Math.min(starScore * 0.7 + forkScore * 0.3, 100);
}

function calcOrgProximity(source: RepoSource, ownerLogin: string): number {
  if (source === "elizaOS" || ownerLogin.toLowerCase() === "elizaos") return 90;
  if (source === "elizaos-plugins" || ownerLogin.toLowerCase() === "elizaos-plugins") return 70;
  
  // Check if community repo owner is known contributor
  // (would need contributor data to fully implement)
  return 20;
}

function calcForkRelationship(repo: GitHubRepo): number {
  return repo.fork ? 60 : 0;
}

function calcDependencyCouplingHeuristic(repo: GitHubRepo): number {
  const name = repo.name.toLowerCase();
  const desc = (repo.description || "").toLowerCase();
  const topics = (repo.topics || []).map(t => t.toLowerCase());

  let score = 0;

  // Direct eliza references
  if (name === "eliza" || name === "elizaos") score += 100;
  if (name.includes("eliza-") || name.includes("-eliza")) score += 35;
  if (name.startsWith("plugin-")) score += 40;

  // Description patterns
  if (desc.includes("@elizaos/") || desc.includes("@ai16z/")) score += 35;
  if (desc.includes("plugin for eliza") || desc.includes("elizaos plugin")) score += 30;
  if (desc.includes("eliza agent") || desc.includes("elizaos agent")) score += 25;
  if (desc.includes("built on eliza") || desc.includes("built with eliza")) score += 30;

  // Topic matches
  if (topics.includes("elizaos")) score += 25;
  if (topics.includes("eliza")) score += 20;
  if (topics.includes("ai16z")) score += 15;

  // Starter/template repos
  if (name.includes("starter") || name.includes("template")) score += 20;

  return Math.min(score, 100);
}

function computeCouplingScore(
  repo: GitHubRepo,
  source: RepoSource,
  maxStars: number,
  maxForks: number
): number {
  const ownerLogin = repo.owner.login.toLowerCase();
  
  // Core repo always 100
  if (ownerLogin === "elizaos" && repo.name.toLowerCase() === CORE_REPO_NAME) {
    return 100;
  }

  const weights = {
    nameSimilarity: 0.2,
    dependencyCoupling: 0.25,
    orgProximity: 0.2,
    activityRecency: 0.15,
    communitySignal: 0.1,
    forkRelationship: 0.1,
  };

  const scores = {
    nameSimilarity: calcNameSimilarity(repo),
    dependencyCoupling: calcDependencyCouplingHeuristic(repo),
    orgProximity: calcOrgProximity(source, repo.owner.login),
    activityRecency: calcActivityRecency(repo),
    communitySignal: calcCommunitySignal(repo, maxStars, maxForks),
    forkRelationship: calcForkRelationship(repo),
  };

  return Math.round(
    Object.entries(weights).reduce(
      (sum, [key, weight]) => sum + scores[key as keyof typeof scores] * weight,
      0
    )
  );
}

function buildEdges(nodes: EcosystemNode[]): EcosystemEdge[] {
  const edges: EcosystemEdge[] = [];
  const coreNode = nodes.find((n) => n.category === "core");
  if (!coreNode) return edges;

  // Limit edge creation for performance
  const MAX_EDGES = 1500;
  let edgeCount = 0;

  // All non-core nodes connect to core with strength proportional to coupling
  for (const node of nodes) {
    if (node.id === coreNode.id) continue;
    if (edgeCount >= MAX_EDGES) break;

    if (node.couplingScore > 15) {
      edges.push({
        source: coreNode.id,
        target: node.id,
        strength: node.couplingScore / 100,
        type: "org",
      });
      edgeCount++;
    }
  }

  // Connect repos that share significant topics
  const topicIndex = new Map<string, EcosystemNode[]>();
  for (const node of nodes) {
    if (node.id === coreNode.id) continue;
    for (const topic of node.topics) {
      if (!topicIndex.has(topic)) topicIndex.set(topic, []);
      topicIndex.get(topic)!.push(node);
    }
  }

  // Only create topic edges for important shared topics
  const importantTopics = ["elizaos", "eliza", "agent", "plugin", "ai16z", "autonomous"];
  for (const topic of importantTopics) {
    const nodesWithTopic = topicIndex.get(topic) || [];
    if (nodesWithTopic.length < 2 || nodesWithTopic.length > 50) continue;

    for (let i = 0; i < nodesWithTopic.length && edgeCount < MAX_EDGES; i++) {
      for (let j = i + 1; j < nodesWithTopic.length && edgeCount < MAX_EDGES; j++) {
        const a = nodesWithTopic[i];
        const b = nodesWithTopic[j];
        
        // Don't duplicate edges
        const existingEdge = edges.find(
          e => (e.source === a.id && e.target === b.id) || 
               (e.source === b.id && e.target === a.id)
        );
        if (existingEdge) continue;

        edges.push({
          source: a.id,
          target: b.id,
          strength: 0.15,
          type: "topic",
        });
        edgeCount++;
      }
    }
  }

  return edges;
}

export async function buildEcosystemData(
  elizaOSRepos: GitHubRepo[],
  pluginRepos: GitHubRepo[],
  communityRepos: GitHubRepo[] = [],
  contributorMap: Map<string, GitHubContributor[]> = new Map()
): Promise<EcosystemData> {
  console.log(
    `[coupling-engine] Building ecosystem from ${elizaOSRepos.length} + ${pluginRepos.length} + ${communityRepos.length} repos`
  );

  const allRepos: { repo: GitHubRepo; source: RepoSource }[] = [
    ...elizaOSRepos.map((r) => ({ repo: r, source: "elizaOS" as RepoSource })),
    ...pluginRepos.map((r) => ({ repo: r, source: "elizaos-plugins" as RepoSource })),
    ...communityRepos.map((r) => ({ repo: r, source: "community" as RepoSource })),
  ];

  // Filter out repos with very low relevance
  const relevantRepos = allRepos.filter(({ repo, source }) => {
    // Always keep official org repos
    if (source !== "community") return true;
    
    // For community repos, require some elizaOS signal
    const name = repo.name.toLowerCase();
    const desc = (repo.description || "").toLowerCase();
    const topics = (repo.topics || []).map(t => t.toLowerCase());
    
    const hasElizaSignal = 
      name.includes("eliza") ||
      desc.includes("eliza") ||
      topics.some(t => t.includes("eliza") || t.includes("elizaos") || t.includes("ai16z"));
    
    return hasElizaSignal;
  });

  console.log(`[coupling-engine] Filtered to ${relevantRepos.length} relevant repos`);

  const maxStars = Math.max(
    ...relevantRepos.map((r) => r.repo.stargazers_count),
    1
  );
  const maxForks = Math.max(
    ...relevantRepos.map((r) => r.repo.forks_count), 
    1
  );

  const nodes: EcosystemNode[] = relevantRepos.map(({ repo, source }) => {
    const contributors = contributorMap.get(repo.full_name) || [];
    return {
      id: repo.full_name,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      openIssues: repo.open_issues_count,
      language: repo.language,
      topics: repo.topics || [],
      updatedAt: repo.updated_at,
      createdAt: repo.created_at,
      category: categorizeRepo(repo, source),
      couplingScore: computeCouplingScore(repo, source, maxStars, maxForks),
      homepage: repo.homepage,
      isFork: repo.fork,
      defaultBranch: repo.default_branch,
      contributors: contributors.map((c) => ({
        login: c.login,
        avatarUrl: c.avatar_url,
        contributions: c.contributions,
      })),
    };
  });

  // Sort by coupling score descending
  nodes.sort((a, b) => b.couplingScore - a.couplingScore);

  const edges = buildEdges(nodes);

  const totalStars = relevantRepos.reduce(
    (sum, { repo }) => sum + repo.stargazers_count,
    0
  );
  const totalForks = relevantRepos.reduce(
    (sum, { repo }) => sum + repo.forks_count,
    0
  );

  console.log(
    `[coupling-engine] Built ${nodes.length} nodes, ${edges.length} edges. Total stars: ${totalStars}`
  );

  return {
    nodes,
    edges,
    meta: {
      totalRepos: relevantRepos.length,
      totalStars,
      totalForks,
      fetchedAt: new Date().toISOString(),
      elizaOSRepoCount: elizaOSRepos.length,
      pluginRepoCount: pluginRepos.length,
    },
  };
}
