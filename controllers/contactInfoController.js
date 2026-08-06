import ContactInfo, { SOCIAL_KEYS } from "../models/contactInfoModel.js";
import { toSetUpdate } from "../utils/updateHelpers.js";
import { singletonGetHandler, singletonUpdateHandler } from "../utils/crudHandlers.js";

const SINGLETON_KEY = "globalConfig";

const buildDefaultContactInfo = () => ({
    email: '',
    phone: '',
    youtube: '',
    ...SOCIAL_KEYS.reduce((fields, key) => {
        fields[key] = { url: '', showOnSidebar: false, showOnFooter: false };
        return fields;
    }, {})
});

export const getContactInfo = singletonGetHandler(ContactInfo, {
    singletonKey: SINGLETON_KEY,
    context: "Error fetching contact info",
    buildDefault: buildDefaultContactInfo,
});

export const updateContactInfo = singletonUpdateHandler(ContactInfo, {
    singletonKey: SINGLETON_KEY,
    context: "Error updating contact info",
    buildUpdate: (req) => toSetUpdate(req.body),
    options: { setDefaultsOnInsert: true },
});
