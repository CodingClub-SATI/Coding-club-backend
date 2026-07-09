export const validateEventAsset = (req, res, next) => {
    const { asset } = req.params;
    const allowedAssets = ["logoURL", "bannerURL"];
    if (!allowedAssets.includes(asset)) {
        return res.status(400).json({
            message: "Invalid event asset. Allowed values are 'logoURL' and 'bannerURL'.",
        });
    }
    next();
};