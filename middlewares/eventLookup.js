import Event from "../models/eventModel.js";

export async function loadEventOr404(req, res) {
    if (!req.params.id) {
        res.status(400).json({ message: "Event ID is required" });
        return null;
    }
    const event = await Event.findOne({ id: req.params.id }).exec();
    if (!event) {
        res.status(404).json({ message: "Event not found" });
        return null;
    }
    return event;
}