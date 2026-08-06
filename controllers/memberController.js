import { TeamMember, Batch, Leadership } from "../models/teamModel.js";
import { toSetUpdate } from "../utils/updateHelpers.js";
import { deleteImageFromCatboxBestEffort } from "./catboxImageController.js";
import { createHandler, updateHandler, removeHandler } from "../utils/crudHandlers.js";

// ADMIN ROUTES: MEMBERS
export const addMember = createHandler(TeamMember, {
    context: "Error adding member",
    duplicateMessage: "That member already exists",
    validate: async (req) => {
        const batchExists = await Batch.exists({ batch: req.body.batch });
        if (!batchExists) {
            return { status: 400, message: `Batch '${req.body.batch}' does not exist. Create it first.` };
        }
    },
});

export const updateMember = updateHandler(TeamMember, {
    notFoundMessage: "Member not found",
    context: "Error updating member",
    duplicateMessage: "That member already exists",
    validate: async (req) => {
        if (req.body.batch) {
            const batchExists = await Batch.exists({ batch: req.body.batch });
            if (!batchExists) {
                return { status: 400, message: `Batch '${req.body.batch}' does not exist. Create it first.` };
            }
        }
    },
    beforeUpdate: (req) => (
        req.body.avatarUrl !== undefined
            ? TeamMember.findOne({ id: req.params.id }).select("avatarUrl").lean().exec()
            : null
    ),
    buildUpdate: (req) => toSetUpdate(req.body),
    afterUpdate: (updated, req, previousMember) => {
        if (previousMember?.avatarUrl && previousMember.avatarUrl !== req.body.avatarUrl) {
            deleteImageFromCatboxBestEffort(previousMember.avatarUrl);
        }
    },
});

export const removeMember = removeHandler(TeamMember, {
    notFoundMessage: "Member not found",
    context: "Error removing member",
    onRemoved: async (removed) => {
        deleteImageFromCatboxBestEffort(removed.avatarUrl);
        await cleanupLeadershipReferences(removed.id);
    },
    respond: (removed, res) => res.status(200).json({ message: "Member removed successfully" }),
});

async function cleanupLeadershipReferences(memberId) {
    try {
        const leadershipDoc = await Leadership.findOne({ singleton: "globalLeadership" }).lean().exec();
        if (!leadershipDoc) return;

        const update = { $pull: { convenors: memberId, coConvenors: memberId } };

        const unsetOps = {};
        for (const [dept, id] of Object.entries(leadershipDoc.departmentHeads || {})) {
            if (id === memberId) unsetOps[`departmentHeads.${dept}`] = "";
        }
        if (Object.keys(unsetOps).length > 0) update.$unset = unsetOps;

        await Leadership.updateOne({ singleton: "globalLeadership" }, update);
    } catch (err) {
        console.error("Failed to clean up leadership references for removed member (non-fatal):", err);
    }
}