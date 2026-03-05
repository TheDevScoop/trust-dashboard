import type {
  GitHubRepo,
  EcosystemNode,
  EcosystemEdge,
  NodeCategory,
  EcosystemData,
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
];

function categorizeRepo(repo: GitHubRepo, orgName: string): NodeCategory {
  const name = repo.name.toLowerCase();

  if (orgName === "elizaOS" && name === CORE_REPO_NAME) return "core";

  if (
    name.includes("doc") ||
    name.includes("github.io") ||
    name.includes("website") ||
    name.includes("landing") ||
    name.includes("awesome")
  ) {
    return "documentation";
  }

  if (orgName === "elizaos-plugins" || name.startsWith("plugin-")) return "plugin";
  if (orgName === "elizaOS") return "official-tool";

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

function calcOrgProximity(orgName: string): number {
  if (orgName === "elizaOS") return 80;
  if (orgName === "elizaos-plugins") return 50;
  return 20;
}

function calcForkRelationship(repo: GitHubRepo): number {
  return repo.fork ? 60 : 0;
}

// Heuristic-based dependency coupling (no API calls needed)
function calcDependencyCouplingHeuristic(repo: GitHubRepo): number {
  const name = repo.name.toLowerCase();
  const desc = (repo.description || "").toLowerCase();

  let score = 0;

  // Plugin repos almost certainly depend on @elizaos/core
  if (name.startsWith("plugin-")) score += 40;

  // Name patterns suggesting tight coupling
  if (name.includes("eliza-") || name.includes("-eliza")) score += 30;
  if (name === "eliza" || name === "elizaos") score += 100;

  // Description hints
  if (desc.includes("@elizaos/") || desc.includes("@ai16z/")) score += 30;
  if (desc.includes("plugin for eliza") || desc.includes("elizaos plugin")) score += 25;
  if (desc.includes("eliza agent") || desc.includes("elizaos agent")) score += 20;

  // Starter/template repos are tightly coupled
  if (name.includes("starter") || name.includes("template")) score += 25;

  return Math.min(score, 100);
}

function computeCouplingScore(
  repo: GitHubRepo,
  orgName: string,
  maxStars: number,
  maxForks: number
): number {
  if (orgName === "elizaOS" && repo.name.toLowerCase() === CORE_REPO_NAME) {
    return 100;
  }

  const weights = {
    nameSimilarity: 0.2,
    dependencyCoupling: 0.25,
    orgProximity: 0.15,
    activityRecency: 0.15,
    communitySignal: 0.1,
    forkRelationship: 0.15,
  };

  const scores = {
    nameSimilarity: calcNameSimilarity(repo),
    dependencyCoupling: calcDependencyCouplingHeuristic(repo),
    orgProximity: calcOrgProximity(orgName),
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

  for (const node of nodes) {
    if (node.id === coreNode.id) continue;

    // All nodes connect to core with strength proportional to coupling
    if (node.couplingScore > 10) {
      edges.push({
        source: coreNode.id,
        target: node.id,
        strength: node.couplingScore / 100,
        type: "org",
      });
    }

    // Connect repos that share topics (limit to avoid too many edges)
    if (node.topics.length >= 2) {
      for (const other of nodes) {
        if (other.id <= node.id || other.id === coreNode.id) continue;
        if (other.topics.length < 2) continue;
        const sharedTopics = node.topics.filter((t) =>
          other.topics.includes(t)
        );
        if (sharedTopics.length >= 2) {
          edges.push({
            source: node.id,
            target: other.id,
            strength: Math.min(sharedTopics.length * 0.15, 0.6),
            type: "topic",
          });
        }
      }
    }
  }

  return edges;
}

export async function buildEcosystemData(
  elizaOSRepos: GitHubRepo[],
  pluginRepos: GitHubRepo[]
): Promise<EcosystemData> {
  console.log(
    `[coupling-engine] Building ecosystem data from ${elizaOSRepos.length} + ${pluginRepos.length} repos`
  );

  const allRepos = [
    ...elizaOSRepos.map((r) => ({ repo: r, org: "elizaOS" })),
    ...pluginRepos.map((r) => ({ repo: r, org: "elizaos-plugins" })),
  ];

  const maxStars = Math.max(
    ...allRepos.map((r) => r.repo.stargazers_count),
    1
  );
  const maxForks = Math.max(...allRepos.map((r) => r.repo.forks_count), 1);

  const nodes: EcosystemNode[] = allRepos.map(({ repo, org }) => ({
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
    category: categorizeRepo(repo, org),
    couplingScore: computeCouplingScore(repo, org, maxStars, maxForks),
    homepage: repo.homepage,
    isFork: repo.fork,
    defaultBranch: repo.default_branch,
    contributors: [],
  }));

  // Sort by coupling score descending
  nodes.sort((a, b) => b.couplingScore - a.couplingScore);

  const edges = buildEdges(nodes);

  const totalStars = allRepos.reduce(
    (sum, { repo }) => sum + repo.stargazers_count,
    0
  );
  const totalForks = allRepos.reduce(
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
      totalRepos: allRepos.length,
      totalStars,
      totalForks,
      fetchedAt: new Date().toISOString(),
      elizaOSRepoCount: elizaOSRepos.length,
      pluginRepoCount: pluginRepos.length,
    },
  };
}
