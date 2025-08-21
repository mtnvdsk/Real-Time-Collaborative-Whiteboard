const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

exports.authMiddleware = (req, res, next) => {
    // Read token from Authorization header: "Bearer <token>"
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    if (!authHeader) {
        return res.status(401).json({ error: "Access Denied: No Token Provided" });
    }

    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Standardize fields from token
        req.userId = decoded.userId || decoded.id || decoded._id || decoded.email;
        req.userEmail = decoded.email;
        next();
    } catch (error) {
        res.status(401).json({ error: "Invalid Token" });
    }
};
