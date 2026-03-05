import type { GitHubRepo, GitHubContributor } from "./ecosystem-types";

const GITHUB_API = "https://api.github.com";
const ELIZAOS_ORG = "elizaOS";
const PLUGINS_ORG = "elizaos-plugins";

// Search queries to find ALL elizaOS ecosystem repos
const SEARCH_QUERIES = [
  "topic:elizaos",
  "topic:eliza+topic:agent",
  "elizaos+in:name,description",
  "eliza+agent+in:name,description",
  "@elizaos+in:readme",
  "ai16z+eliza+in:name,description",
];

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "elizaos-ecosystem-graph",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn("[github-client] No GITHUB_TOKEN set. Rate limit: 60 req/hr. Search API may fail.");
  }
  return headers;
}

async function safeFetch(url: string, headers: HeadersInit): Promise<Response | null> {
  try {
    console.log(`[github-client] Fetching: ${url}`);
    const resp = await fetch(url, { headers });
    
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      console.error(`[github-client] API error ${resp.status} for ${url}:`, body.slice(0, 200));
      
      if (resp.status === 403 || resp.status === 429) {
        const resetHeader = resp.headers.get("X-RateLimit-Reset");
        const resetTime = resetHeader ? new Date(parseInt(resetHeader) * 1000).toISOString() : "unknown";
        console.error(`[github-client] Rate limited. Resets at: ${resetTime}`);
      }
      return null;
    }
    return resp;
  } catch (err) {
    console.error(`[github-client] Network error for ${url}:`, err);
    return null;
  }
}

async function fetchAllPages<T>(url: string, maxPages = 10): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  const headers = getHeaders();

  while (page <= maxPages) {
    const separator = url.includes("?") ? "&" : "?";
    const fullUrl = `${url}${separator}per_page=100&page=${page}`;
    
    const resp = await safeFetch(fullUrl, headers);
    if (!resp) break;

    let data: T[];
    try {
      data = await resp.json();
    } catch {
      console.error("[github-client] Failed to parse JSON response");
      break;
    }

    if (!Array.isArray(data) || data.length === 0) break;
    results.push(...data);
    console.log(`[github-client] Page ${page}: got ${data.length} items (total: ${results.length})`);

    const linkHeader = resp.headers.get("link");
    if (!linkHeader || !linkHeader.includes('rel="next"')) break;
    page++;
  }

  return results;
}

export async function fetchOrgRepos(org: string): Promise<GitHubRepo[]> {
  console.log(`[github-client] Fetching org repos: ${org}`);
  const repos = await fetchAllPages<GitHubRepo>(
    `${GITHUB_API}/orgs/${org}/repos?sort=updated&type=public`
  );
  console.log(`[github-client] Fetched ${repos.length} repos from ${org}`);
  return repos;
}

interface SearchResult {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepo[];
}

async function searchRepos(query: string, maxPages = 5): Promise<GitHubRepo[]> {
  const results: GitHubRepo[] = [];
  const headers = getHeaders();
  
  for (let page = 1; page <= maxPages; page++) {
    const url = `${GITHUB_API}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=100&page=${page}`;
    
    const resp = await safeFetch(url, headers);
    if (!resp) break;

    let data: SearchResult;
    try {
      data = await resp.json();
    } catch {
      console.error("[github-client] Failed to parse search response");
      break;
    }

    if (!data.items || data.items.length === 0) break;
    results.push(...data.items);
    console.log(`[github-client] Search "${query}" page ${page}: ${data.items.length} items (total: ${results.length}/${data.total_count})`);

    // Stop if we have all results or hit the 1000 item limit
    if (results.length >= data.total_count || results.length >= 1000) break;
    
    // Rate limit protection for search API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}

export async function fetchRepoContributors(
  fullName: string,
  limit = 5
): Promise<GitHubContributor[]> {
  const headers = getHeaders();
  const resp = await safeFetch(
    `${GITHUB_API}/repos/${fullName}/contributors?per_page=${limit}`,
    headers
  );
  if (!resp) return [];
  
  try {
    const data = await resp.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function fetchAllEcosystemRepos(): Promise<{
  elizaOSRepos: GitHubRepo[];
  pluginRepos: GitHubRepo[];
  communityRepos: GitHubRepo[];
}> {
  console.log("[github-client] Starting comprehensive ecosystem fetch...");
  
  // Step 1: Fetch official org repos (these are authoritative)
  const [elizaOSRepos, pluginRepos] = await Promise.all([
    fetchOrgRepos(ELIZAOS_ORG),
    fetchOrgRepos(PLUGINS_ORG),
  ]);

  console.log(`[github-client] Official orgs: ${elizaOSRepos.length} elizaOS + ${pluginRepos.length} plugins`);

  // Step 2: Use search API to find community repos
  const seenIds = new Set<number>([
    ...elizaOSRepos.map(r => r.id),
    ...pluginRepos.map(r => r.id),
  ]);

  const communityRepos: GitHubRepo[] = [];

  // Run searches sequentially to avoid rate limits
  for (const query of SEARCH_QUERIES) {
    console.log(`[github-client] Searching: ${query}`);
    const searchResults = await searchRepos(query, 3); // 3 pages = up to 300 results per query
    
    for (const repo of searchResults) {
      if (!seenIds.has(repo.id)) {
        seenIds.add(repo.id);
        communityRepos.push(repo);
      }
    }
    
    // Small delay between search queries
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`[github-client] Found ${communityRepos.length} additional community repos`);
  console.log(
    `[github-client] Total ecosystem: ${elizaOSRepos.length + pluginRepos.length + communityRepos.length} repos`
  );

  return { elizaOSRepos, pluginRepos, communityRepos };
}

// Fetch top contributors for multiple repos in parallel (with limits)
export async function fetchContributorsForRepos(
  repos: GitHubRepo[],
  maxRepos = 30,
  contributorsPerRepo = 5
): Promise<Map<string, GitHubContributor[]>> {
  const topRepos = repos
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, maxRepos);

  console.log(`[github-client] Fetching contributors for top ${topRepos.length} repos...`);

  const contributorMap = new Map<string, GitHubContributor[]>();
  
  // Batch in groups of 5 to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < topRepos.length; i += batchSize) {
    const batch = topRepos.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (repo) => {
        const contributors = await fetchRepoContributors(repo.full_name, contributorsPerRepo);
        return { fullName: repo.full_name, contributors };
      })
    );
    
    for (const { fullName, contributors } of results) {
      contributorMap.set(fullName, contributors);
    }
    
    // Small delay between batches
    if (i + batchSize < topRepos.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`[github-client] Fetched contributors for ${contributorMap.size} repos`);
  return contributorMap;
}
