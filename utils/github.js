const GITHUB_API_BASE = "https://api.github.com/repos";

function parseOwnerRepo(githubUrl) {
    if (!githubUrl) return null;
    try {
        const url = new URL(githubUrl);
        if (!/(^|\.)github\.com$/.test(url.hostname)) return null;

        const [owner, repo] = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
        if (!owner || !repo) return null;

        return { owner, repo: repo.replace(/\.git$/, "") };
    } catch {
        return null; // not a valid URL at all
    }
}

export async function syncProjectGithubStats(project) {
    const parsed = parseOwnerRepo(project.github);
    if (!parsed) return;

    try {
        const headers = { Accept: "application/vnd.github+json" };
        if (process.env.GITHUB_TOKEN) {
            headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
        }

        const response = await fetch(`${GITHUB_API_BASE}/${parsed.owner}/${parsed.repo}`, { headers });
        if (!response.ok) return; // 404 / rate-limited / private repo, etc.

        const data = await response.json();
        if (typeof data.stargazers_count === "number") project.stars = data.stargazers_count;
        if (typeof data.forks_count === "number") project.forks = data.forks_count;
    } catch (err) {
        console.error("GitHub sync failed (non-fatal):", err.message);
    }
}
