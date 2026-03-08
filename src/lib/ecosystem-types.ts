export type NodeCategory =
  | "core"
  | "official-tool"
  | "plugin"
  | "community"
  | "documentation"
  | "game"
  | "adapter"
  | "client"
  | "infrastructure"
  | "community-plugin";

export interface EcosystemNode {
  id: string;
  name: string;
  fullName: string;
  description: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  language: string | null;
  topics: string[];
  updatedAt: string;
  createdAt: string;
  category: NodeCategory;
  couplingScore: number;
  homepage: string | null;
  isFork: boolean;
  defaultBranch: string;
  contributors: ContributorInfo[];
  // D3 simulation adds these at runtime
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface ContributorInfo {
  login: string;
  avatarUrl: string;
  contributions: number;
}

export interface EcosystemEdge {
  source: string;
  target: string;
  strength: number;
  type: "dependency" | "topic" | "org" | "fork";
}

export interface CouplingBreakdown {
  nameSimilarity: number;
  dependencyCoupling: number;
  orgProximity: number;
  activityRecency: number;
  communitySignal: number;
  forkRelationship: number;
}

export interface EcosystemData {
  nodes: EcosystemNode[];
  edges: EcosystemEdge[];
  meta: {
    totalRepos: number;
    totalStars: number;
    totalForks: number;
    fetchedAt: string;
    elizaOSRepoCount: number;
    pluginRepoCount: number;
    communityRepoCount: number;
    registryPluginCount: number;
  };
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  topics: string[];
  updated_at: string;
  created_at: string;
  pushed_at: string;
  fork: boolean;
  default_branch: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export interface GitHubContributor {
  login: string;
  avatar_url: string;
  contributions: number;
}
