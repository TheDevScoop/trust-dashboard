import type { GitHubRepo, GitHubContributor } from "./ecosystem-types";

const GITHUB_API = "https://api.github.com";
const ELIZAOS_ORG = "elizaOS";
const PLUGINS_ORG = "elizaos-plugins";
const ASSOCIATED_ORGS = ["milady-ai", "m3-org", "Agent-Town"];

const REGISTRY_RAW_URL =
  "https://raw.githubusercontent.com/elizaos-plugins/registry/main/index.json";

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "elizaos-ecosystem-graph",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn("[github-client] No GITHUB_TOKEN set. Rate limit: 60 req/hr.");
  }
  return headers;
}

async function fetchAllPages<T>(url: string, maxPages = 10): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  const headers = getHeaders();

  while (page <= maxPages) {
    const separator = url.includes("?") ? "&" : "?";
    const fullUrl = `${url}${separator}per_page=100&page=${page}`;
    console.log(`[github-client] Fetching page ${page}: ${fullUrl}`);

    let resp: Response;
    try {
      resp = await fetch(fullUrl, { headers });
    } catch (err) {
      console.error(`[github-client] Network error fetching ${fullUrl}:`, err);
      break;
    }

    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      console.error(
        `[github-client] API error ${resp.status}: ${resp.statusText}`,
        body.slice(0, 200)
      );
      if (resp.status === 403 || resp.status === 429) {
        console.warn("[github-client] Rate limited, returning partial results");
        break;
      }
      break;
    }

    let data: T[];
    try {
      data = await resp.json();
    } catch {
      console.error("[github-client] Failed to parse JSON response");
      break;
    }

    if (!Array.isArray(data) || data.length === 0) break;
    results.push(...data);
    console.log(`[github-client] Got ${data.length} items (total: ${results.length})`);

    const linkHeader = resp.headers.get("link");
    if (!linkHeader || !linkHeader.includes('rel="next"')) break;
    page++;
  }

  return results;
}

export async function fetchOrgRepos(org: string): Promise<GitHubRepo[]> {
  console.log(`[github-client] Fetching repos for org: ${org}`);
  const repos = await fetchAllPages<GitHubRepo>(
    `${GITHUB_API}/orgs/${org}/repos?sort=updated&type=public`
  );
  console.log(`[github-client] Fetched ${repos.length} repos from ${org}`);
  return repos;
}

interface SearchResult {
  items: GitHubRepo[];
  total_count: number;
}

async function searchReposByTopic(topic: string, maxPages = 3): Promise<GitHubRepo[]> {
  const results: GitHubRepo[] = [];
  const headers = getHeaders();

  for (let page = 1; page <= maxPages; page++) {
    const url = `${GITHUB_API}/search/repositories?q=topic:${encodeURIComponent(topic)}&sort=stars&order=desc&per_page=100&page=${page}`;
    console.log(`[github-client] Topic search '${topic}' page ${page}`);

    try {
      const resp = await fetch(url, { headers });
      if (!resp.ok) {
        if (resp.status === 403 || resp.status === 429) {
          console.warn("[github-client] Rate limited on topic search");
          break;
        }
        break;
      }
      const data: SearchResult = await resp.json();
      if (!data.items || data.items.length === 0) break;
      results.push(...data.items);
      if (results.length >= data.total_count) break;
    } catch (err) {
      console.error(`[github-client] Topic search error:`, err);
      break;
    }
  }

  return results;
}

async function fetchRegistryIndex(): Promise<Record<string, string>> {
  try {
    console.log("[github-client] Fetching plugin registry index.json...");
    const resp = await fetch(REGISTRY_RAW_URL, {
      headers: { "User-Agent": "elizaos-ecosystem-graph" },
    });
    if (!resp.ok) {
      console.warn(`[github-client] Registry fetch failed: ${resp.status}`);
      return {};
    }
    const data = await resp.json();
    console.log(`[github-client] Registry has ${Object.keys(data).length} entries`);
    return data as Record<string, string>;
  } catch (err) {
    console.warn("[github-client] Failed to fetch registry:", err);
    return {};
  }
}

function parseRegistryEntry(value: string): { org: string; repo: string } | null {
  // Format: "github:org/repo" or "github:org/repo#branch:path"
  const match = value.match(/^github:([^/]+)\/([^#]+)/);
  if (!match) return null;
  return { org: match[1], repo: match[2] };
}

async function fetchRepoInfo(fullName: string): Promise<GitHubRepo | null> {
  try {
    const headers = getHeaders();
    const resp = await fetch(`${GITHUB_API}/repos/${fullName}`, { headers });
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

export async function fetchRepoContributors(
  fullName: string,
  limit = 5
): Promise<GitHubContributor[]> {
  try {
    const headers = getHeaders();
    const resp = await fetch(
      `${GITHUB_API}/repos/${fullName}/contributors?per_page=${limit}`,
      { headers }
    );
    if (!resp.ok) return [];
    const data = await resp.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function fetchRepoPackageJson(
  fullName: string
): Promise<Record<string, unknown> | null> {
  try {
    const headers = getHeaders();
    const resp = await fetch(
      `${GITHUB_API}/repos/${fullName}/contents/package.json`,
      { headers }
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data.content) {
      const decoded = Buffer.from(data.content, "base64").toString("utf-8");
      return JSON.parse(decoded);
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchAllEcosystemRepos(): Promise<{
  elizaOSRepos: GitHubRepo[];
  pluginRepos: GitHubRepo[];
  communityRepos: GitHubRepo[];
  registryPluginCount: number;
}> {
  console.log("[github-client] Starting full ecosystem fetch...");

  // Fetch org repos, associated orgs, topic repos, and registry in parallel
  const [elizaOSRepos, pluginOrgRepos, topicElizaos, topicElizaosPlugin, registry, ...associatedOrgResults] =
    await Promise.all([
      fetchOrgRepos(ELIZAOS_ORG),
      fetchOrgRepos(PLUGINS_ORG),
      searchReposByTopic("elizaos", 3),
      searchReposByTopic("elizaos-plugin", 2),
      fetchRegistryIndex(),
      ...ASSOCIATED_ORGS.map((org) => fetchOrgRepos(org).catch(() => [] as GitHubRepo[])),
    ]);

  const registryPluginCount = Object.keys(registry).length;

  // Deduplicate: build a set of full_names we already have
  const knownFullNames = new Set<string>();
  for (const r of elizaOSRepos) knownFullNames.add(r.full_name.toLowerCase());
  for (const r of pluginOrgRepos) knownFullNames.add(r.full_name.toLowerCase());

  // Community repos = associated orgs + topic search results NOT in core orgs
  const communityRepos: GitHubRepo[] = [];
  const seenCommunity = new Set<string>();

  // Add associated org repos first (milady-ai, m3-org, etc.)
  for (const orgRepos of associatedOrgResults) {
    for (const repo of orgRepos) {
      const key = repo.full_name.toLowerCase();
      if (knownFullNames.has(key) || seenCommunity.has(key)) continue;
      seenCommunity.add(key);
      communityRepos.push(repo);
    }
  }

  const allTopicRepos = [...topicElizaos, ...topicElizaosPlugin];
  for (const repo of allTopicRepos) {
    const key = repo.full_name.toLowerCase();
    if (knownFullNames.has(key) || seenCommunity.has(key)) continue;
    seenCommunity.add(key);
    communityRepos.push(repo);
  }

  // Also fetch select third-party registry plugins not yet captured
  const thirdPartyEntries: string[] = [];
  for (const [, value] of Object.entries(registry)) {
    const parsed = parseRegistryEntry(value);
    if (!parsed) continue;
    const fullName = `${parsed.org}/${parsed.repo}`;
    const key = fullName.toLowerCase();
    if (
      knownFullNames.has(key) ||
      seenCommunity.has(key) ||
      parsed.org.toLowerCase() === "elizaos-plugins"
    ) {
      continue;
    }
    thirdPartyEntries.push(fullName);
  }

  // Fetch up to 30 third-party registry repos (rate limit conscious)
  const toFetch = thirdPartyEntries.slice(0, 30);
  if (toFetch.length > 0) {
    console.log(
      `[github-client] Fetching ${toFetch.length} third-party registry repos...`
    );
    const thirdPartyRepos = await Promise.all(toFetch.map(fetchRepoInfo));
    for (const repo of thirdPartyRepos) {
      if (repo && !seenCommunity.has(repo.full_name.toLowerCase())) {
        seenCommunity.add(repo.full_name.toLowerCase());
        communityRepos.push(repo);
      }
    }
  }

  console.log(
    `[github-client] Total: ${elizaOSRepos.length} elizaOS + ${pluginOrgRepos.length} plugins + ${communityRepos.length} community = ${
      elizaOSRepos.length + pluginOrgRepos.length + communityRepos.length
    } repos (registry: ${registryPluginCount} entries)`
  );

  return {
    elizaOSRepos,
    pluginRepos: pluginOrgRepos,
    communityRepos,
    registryPluginCount,
  };
}
