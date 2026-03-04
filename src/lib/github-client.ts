import type { GitHubRepo, GitHubContributor } from "./ecosystem-types";

const GITHUB_API = "https://api.github.com";
const ELIZAOS_ORG = "elizaOS";
const PLUGINS_ORG = "elizaos-plugins";

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "elizaos-ecosystem-graph",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function fetchAllPages<T>(url: string, maxPages = 10): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  const headers = getHeaders();

  while (page <= maxPages) {
    const separator = url.includes("?") ? "&" : "?";
    const resp = await fetch(`${url}${separator}per_page=100&page=${page}`, {
      headers,
      next: { revalidate: 300 },
    });

    if (!resp.ok) {
      if (resp.status === 403) {
        console.warn(
          "[github-client] Rate limited, returning partial results"
        );
        break;
      }
      throw new Error(`GitHub API error: ${resp.status} ${resp.statusText}`);
    }

    const data: T[] = await resp.json();
    if (data.length === 0) break;
    results.push(...data);

    const linkHeader = resp.headers.get("link");
    if (!linkHeader || !linkHeader.includes('rel="next"')) break;
    page++;
  }

  return results;
}

export async function fetchOrgRepos(org: string): Promise<GitHubRepo[]> {
  return fetchAllPages<GitHubRepo>(
    `${GITHUB_API}/orgs/${org}/repos?sort=updated&type=public`
  );
}

export async function fetchRepoContributors(
  fullName: string,
  limit = 5
): Promise<GitHubContributor[]> {
  try {
    const headers = getHeaders();
    const resp = await fetch(
      `${GITHUB_API}/repos/${fullName}/contributors?per_page=${limit}`,
      { headers, next: { revalidate: 600 } }
    );
    if (!resp.ok) return [];
    return resp.json();
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
      { headers, next: { revalidate: 600 } }
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
  const [elizaOSRepos, pluginRepos] = await Promise.all([
    fetchOrgRepos(ELIZAOS_ORG),
    fetchOrgRepos(PLUGINS_ORG),
  ]);

  return { elizaOSRepos, pluginRepos };
}
