import { TeamMember, Leadership } from "../models/teamModel.js";
import { singletonGetHandler, singletonUpdateHandler } from "../utils/crudHandlers.js";

const SINGLETON_KEY = "globalLeadership";

// ADMIN ROUTES: LEADERSHIP MAPPING
export const getLeadership = singletonGetHandler(Leadership, {
    singletonKey: SINGLETON_KEY,
    context: "Error fetching leadership",
    buildDefault: () => ({ convenors: [], coConvenors: [], departmentHeads: {} }),
});

export const updateLeadership = singletonUpdateHandler(Leadership, {
    singletonKey: SINGLETON_KEY,
    context: "Error updating leadership",
    validate: async (req) => {
        const referencedIds = [
            ...(req.body.convenors || []),
            ...(req.body.coConvenors || []),
            ...Object.values(req.body.departmentHeads || {})
        ];

        if (referencedIds.length > 0) {
            const uniqueIds = [...new Set(referencedIds)];
            const existingCount = await TeamMember.countDocuments({ id: { $in: uniqueIds } });
            if (existingCount !== uniqueIds.length) {
                return { status: 400, message: "One or more referenced member IDs do not exist." };
            }
        }
    },
});
