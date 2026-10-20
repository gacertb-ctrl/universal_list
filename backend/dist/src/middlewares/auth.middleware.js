"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../config/db"));
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null) || (req.cookies && req.cookies.token);
        if (!token) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({ success: false, message: 'Invalid or expired authentication token' });
        return;
    }
};
exports.authenticate = authenticate;
const authorize = (roles) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'Not authenticated' });
                return;
            }
            const roleIdInt = typeof req.user.roleId === 'number' ? req.user.roleId : parseInt(String(req.user.roleId), 10);
            const userRole = await db_1.default.role.findUnique({ where: { id: roleIdInt } });
            if (!userRole || !roles.includes(userRole.name)) {
                res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions for this action' });
                return;
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.authorize = authorize;
