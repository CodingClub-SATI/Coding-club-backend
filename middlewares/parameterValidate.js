export const EVENT_ASSET_FIELD_MAP = {
    logoURL: "logoUrl",
    bannerURL: "bannerUrl",
};

export const validateEventAsset = (req, res, next) => {
    const { asset } = req.params;
    if (!Object.prototype.hasOwnProperty.call(EVENT_ASSET_FIELD_MAP, asset)) {
        return res.status(400).json({
            message: "Invalid event asset. Allowed values are 'logoURL' and 'bannerURL'.",
        });
    }
    next();
};