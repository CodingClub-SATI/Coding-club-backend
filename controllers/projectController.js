import Project from "../models/projectModel.js";
import { paginatedFind, asString } from "../utils/queryHelpers.js";
import { syncProjectGithubStats } from "../utils/github.js";
import { handleControllerError } from "../utils/errorHandler.js";
import { createHandler, updateHandler, removeHandler } from "../utils/crudHandlers.js";

export const create = createHandler(Project, {
    context: "Error creating project",
    duplicateMessage: "Project already exists",
    beforeSave: (instance) => syncProjectGithubStats(instance),
});

export const fetch = async (req, res) => {
    try {
        const filter = {};
        const category = asString(req.query.category);
        if (category && category !== "All") {
            filter.category = category;
        }

        let query = Project.find(filter);
        if (req.query.sort === "stars") {
            query = query.sort({ stars: -1 });
        }

        const result = await paginatedFind(query, Project, filter, req.query);
        return res.json(result);
    } catch (error) {
        return handleControllerError(error, res, { context: "Error fetching projects" });
    }
};

export const update = updateHandler(Project, {
    notFoundMessage: "Project does not exist",
    context: "Error updating project",
    duplicateMessage: "Project already exists",
    beforeUpdate: async (req) => {
        if (req.body.github) {
            const existing = await Project.findOne({ id: req.params.id }).lean().exec();
            if (existing && existing.github !== req.body.github) {
                await syncProjectGithubStats(req.body);
            }
        }
    },
});

export const remove = removeHandler(Project, {
    notFoundMessage: "Project does not exist",
    context: "Error deleting project",
});