import { TeamMember, Batch, Leadership } from "../models/teamModel.js";
import { handleControllerError } from "../utils/errorHandler.js";
import { createHandler, updateHandler, removeHandler } from "../utils/crudHandlers.js";

// PUBLIC ROUTES
const PUBLIC_MEMBER_PROJECTION = "-enrollmentNumber";

export const getPublicRoster = async (req, res) => {
    try {
        const batches = await Batch.find({ archived: false }).lean().exec();
        const batchNames = batches.map(b => b.batch);
        const members = await TeamMember.find({ batch: { $in: batchNames } })
            .select(PUBLIC_MEMBER_PROJECTION)
            .lean()
            .exec();

        const batchesWithMembers = batches.map(b => ({
            ...b,
            members: members.filter(m => m.batch === b.batch)
        }));

        batchesWithMembers.sort((a, b) => b.batch.localeCompare(a.batch));

        const leadershipDoc = await Leadership.findOne({ singleton: "globalLeadership" }).lean().exec();
        let leadership = { convenors: [], coConvenors: [], departmentLeads: [] };

        if (leadershipDoc) {
            const convenorIds = leadershipDoc.convenors || [];
            const coConvenorIds = leadershipDoc.coConvenors || [];
            const deptHeadIds = Object.values(leadershipDoc.departmentHeads || {});
            const allLeaderIds = [...convenorIds, ...coConvenorIds, ...deptHeadIds];
            const leaderMembers = await TeamMember.find({ id: { $in: allLeaderIds } })
                .select(PUBLIC_MEMBER_PROJECTION)
                .lean()
                .exec();

            const idToMember = {};
            leaderMembers.forEach(m => idToMember[m.id] = m);

            leadership.convenors = convenorIds.map(id => idToMember[id]).filter(Boolean);
            leadership.coConvenors = coConvenorIds.map(id => idToMember[id]).filter(Boolean);

            const deptLeads = [];
            if (leadershipDoc.departmentHeads) {
                for (const [deptName, memberId] of Object.entries(leadershipDoc.departmentHeads)) {
                    const member = idToMember[memberId];
                    if (member) {
                        deptLeads.push({ ...member, clubPosition: deptName });
                    }
                }
            }
            leadership.departmentLeads = deptLeads;
        }

        return res.status(200).json({
            batches: batchesWithMembers,
            leadership
        });

    } catch (error) {
        return handleControllerError(error, res, { context: "Error fetching public roster" });
    }
};

// ADMIN ROUTES: BATCHES
export const getAdminBatches = async (req, res) => {
    try {
        const batches = await Batch.find().lean().exec();
        const members = await TeamMember.find().lean().exec();
        const leadershipDoc = await Leadership.findOne({ singleton: "globalLeadership" }).lean().exec();
        const leaderIds = new Set();

        if (leadershipDoc) {
            (leadershipDoc.convenors || []).forEach(id => leaderIds.add(id));
            (leadershipDoc.coConvenors || []).forEach(id => leaderIds.add(id));
            Object.values(leadershipDoc.departmentHeads || {}).forEach(id => leaderIds.add(id));
        }

        const batchesWithMembers = batches.map(b => {
            const batchMembers = members
                .filter(m => m.batch === b.batch)
                .map(m => ({ ...m, isLeadership: leaderIds.has(m.id) }));

            return {
                ...b,
                members: batchMembers,
                memberCount: batchMembers.length
            };
        });

        batchesWithMembers.sort((a, b) => b.batch.localeCompare(a.batch));

        return res.status(200).json({ batches: batchesWithMembers });
    } catch (error) {
        return handleControllerError(error, res, { context: "Error fetching admin batches" });
    }
};

export const createBatch = createHandler(Batch, {
    context: "Error creating batch",
    duplicateMessage: "That batch year already exists",
    buildData: (req) => ({ batch: req.body.batch, archived: false }),
    respond: (saved, res) => res.status(201).json({ ...saved.toObject(), members: [], memberCount: 0 }),
});

export const setBatchArchived = updateHandler(Batch, {
    paramName: "batch",
    filterField: "batch",
    notFoundMessage: "Batch not found",
    context: "Error archiving batch",
});

export const removeBatch = removeHandler(Batch, {
    paramName: "batch",
    filterField: "batch",
    notFoundMessage: "Batch not found",
    context: "Error removing batch",
    validate: async (req) => {
        const membersCount = await TeamMember.countDocuments({ batch: req.params.batch });
        if (membersCount > 0) {
            return { status: 400, message: "Cannot delete batch. It still has members assigned to it." };
        }
    },
    respond: (removed, res) => res.status(200).json({ message: "Batch removed successfully" }),
});
