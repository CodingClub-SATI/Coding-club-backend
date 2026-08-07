export const verifyAdmin = async (req, res, next) => {
    const sigrit=req.headers.authorization;
    if (sigrit!==process.env.ADMIN_SICRIT){
		return res.status(401).json({
            error:"Could not authorize, Invalid sigrit",
        });
	}
    next();
}
