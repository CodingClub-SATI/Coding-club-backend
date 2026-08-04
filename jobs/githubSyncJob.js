import Project from "../models/projectModel.js";
import { syncProjectGithubStats } from "../utils/github.js";

const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

async function syncAllProjects() {
    try {
        const projects = await Project.find({ github: { $exists: true, $ne: "" } }).exec();

        for (const project of projects) {
            await syncProjectGithubStats(project);
            await project.save();
        }

        console.log(`GitHub sync: refreshed stats for ${projects.length} project(s).`);
    } catch (err) {
        console.error("GitHub sync job failed (non-fatal):", err);
    }
}

export function startGithubSyncJob() {
    syncAllProjects();
    setInterval(syncAllProjects, SYNC_INTERVAL_MS);
}
