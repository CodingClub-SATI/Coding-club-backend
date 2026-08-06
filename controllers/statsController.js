import Event from "../models/eventModel.js";
import Project from "../models/projectModel.js";
import { TeamMember, Batch } from "../models/teamModel.js";
import Contact from "../models/contactModel.js";
import { handleControllerError } from "../utils/errorHandler.js";

async function countActiveTeamMembers() {
    const activeBatches = await Batch.find({ archived: false }).lean().exec();
    if (activeBatches.length === 0) return 0;

    const activeBatchNames = activeBatches.map((b) => b.batch);
    return TeamMember.countDocuments({ batch: { $in: activeBatchNames } });
}

export const fetch = async (req, res) => {
    try {
        const [totalEvents, workshops, studentProjects, activeMembers] = await Promise.all([
            Event.countDocuments({ archived: { $ne: true } }),
            Event.countDocuments({ archived: { $ne: true }, type: "Workshop" }),
            Project.countDocuments(),
            countActiveTeamMembers()
        ]);

        return res.json({ totalEvents, activeMembers, studentProjects, workshops });
    } catch (error) {
        return handleControllerError(error, res, { context: "Error fetching public stats" });
    }
};

export const fetchAdmin = async (req, res) => {
    try {
        const [totalEvents, totalProjects, newContactMessages, totalMembers] = await Promise.all([
            Event.countDocuments(),
            Project.countDocuments(),
            Contact.countDocuments({ status: "New" }),
            countActiveTeamMembers()
        ]);

        return res.json({
            totalEvents,
            totalProjects,
            newContactMessages,
            totalMembers
        });
    } catch (error) {
        return handleControllerError(error, res, { context: "Error fetching admin stats" });
    }
};