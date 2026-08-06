import mongoose from "mongoose";
import z from "zod";
import { addPublicId, addArchivable, hideMongoInternals } from "../utils/schemaPlugins.js";
import { urlField } from "../utils/zodHelpers.js";

const photoSchema = new mongoose.Schema({
    src: { type: String, required: true },
    caption: { type: String },
    featured: { type: Boolean, default: false }
}, { _id: false });

addPublicId(photoSchema, { unique: false }); // uniqueness enforced within the album via the images.id index below

const albumSchema = new mongoose.Schema({
    title: { type: String, required: true },
    date: { type: String },
    cover: { type: String },
    images: [photoSchema]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

albumSchema.virtual('imageCount').get(function () {
    return this.images.length;
});

albumSchema.index(
    { title: 1, date: 1 },
    { unique: true, partialFilterExpression: { date: { $exists: true } } }
);

albumSchema.index({ 'images.id': 1 }, { unique: true, sparse: true });

addPublicId(albumSchema);
addArchivable(albumSchema);
hideMongoInternals(albumSchema);

// Mirrors `src/features/gallery/constants.js` on the frontend (same name)
// so the client-side "cap reached" UI matches what the server enforces.
export const MAX_FEATURED_PER_ALBUM = 10;

export default mongoose.model('Album', albumSchema, 'albums');

export const createAlbumSchema = z.object({
    title: z.string().min(1).max(200),
    date: z.string().max(50).optional(),
    cover: urlField()
}).strict();

export const updateAlbumSchema = createAlbumSchema.partial().extend({
    archived: z.boolean().optional()
}).strict();

const photoInputSchema = z.object({
    src: urlField('required'),
    caption: z.string().max(300).optional(),
    featured: z.boolean().optional()
}).strict();

export const addPhotosSchema = z.object({
    photos: z.array(photoInputSchema).min(1).max(50)
}).strict();

export const updatePhotoSchema = photoInputSchema.partial().strict();