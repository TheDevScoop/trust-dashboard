import type { GitHubRepo, GitHubContributor } from "./ecosystem-types";

const GITHUB_API = "https://api.github.com";
const ELIZAOS_ORG = "elizaOS";
const PLUGINS_ORG = "elizaos-plugins";

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
      // For other errors, stop pagination but don't throw - return what we have
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
}> {
  console.log("[github-client] Starting full ecosystem fetch...");
  const [elizaOSRepos, pluginRepos] = await Promise.all([
    fetchOrgRepos(ELIZAOS_ORG),
    fetchOrgRepos(PLUGINS_ORG),
  ]);

  console.log(
    `[github-client] Total: ${elizaOSRepos.length} elizaOS + ${pluginRepos.length} plugins = ${
      elizaOSRepos.length + pluginRepos.length
    } repos`
  );

  return { elizaOSRepos, pluginRepos };
}
