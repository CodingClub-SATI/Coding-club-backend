import Event, { updateEventSchema } from "../models/eventModel.js";

export const create = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ message: "Event ID is required" });
        }
        const eventExist = await Event.findOne({ id }).exec();
        if (eventExist) {
            return res.status(400).json({ message: "Event already exists" });
        }
        const event = new Event(req.body);
        const savedEvent = await event.save();
        console.log("saved event", id);
        return res.status(201).json(savedEvent);
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ error: error.message });
        }
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const fetch = async (req, res) => {
    try {
        const events_list = await Event.find().exec();
        return res.json(events_list);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


export const update = async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            return res.status(400).json({ message: "Event ID is required" });
        }
        req.body.id = id;
        const updatedEvent = await Event.findOneAndUpdate(
            { id },
            req.body,
            {
                returnDocument: "after",
                runValidators: true
            }
        ).exec();
        if (!updatedEvent) {
            return res.status(404).json({ message: "Event does not exist" });
        }

        return res.status(200).json(updatedEvent);
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ error: error.message });
        }
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


export const remove = async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            return res.status(400).json({ message: "Event ID is required" });
        }
        const removedEvent = await Event.findOneAndDelete({
            id
        }).exec();
        if (!removedEvent) {
            return res.status(404).json({ message: "Event does not exist" });
        }
        return res.status(200).json(removedEvent);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};