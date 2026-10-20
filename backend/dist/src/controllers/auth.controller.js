"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.logout = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../config/db"));
const auth_validator_1 = require("../validators/auth.validator");
const register = async (req, res, next) => {
    try {
        const validatedData = auth_validator_1.registerSchema.parse(req.body);
        const existingUser = await db_1.default.user.findUnique({ where: { email: validatedData.email } });
        if (existingUser) {
            res.status(400).json({ success: false, message: 'Email already registered' });
            return;
        }
        const hashedPassword = await bcrypt_1.default.hash(validatedData.password, 10);
        // Get default role (e.g., Technician or Guest)
        let defaultRole = await db_1.default.role.findUnique({ where: { name: 'Technician' } });
        if (!defaultRole) {
            defaultRole = await db_1.default.role.create({ data: { name: 'Technician' } });
        }
        const user = await db_1.default.user.create({
            data: {
                name: validatedData.name,
                email: validatedData.email,
                password: hashedPassword,
                roleId: defaultRole.id,
            },
        });
        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: { id: user.id, name: user.name, email: user.email },
        });
    }
    catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({ success: false, errors: error.errors });
            return;
        }
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const validatedData = auth_validator_1.loginSchema.parse(req.body);
        const user = await db_1.default.user.findUnique({
            where: { email: validatedData.email },
            include: { role: true },
        });
        if (!user || !(await bcrypt_1.default.compare(validatedData.password, user.password))) {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
            return;
        }
        if (user.status !== 'active') {
            res.status(403).json({ success: false, message: 'Account is disabled' });
            return;
        }
        await db_1.default.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });
        const token = jsonwebtoken_1.default.sign({ id: user.id, roleId: user.roleId }, process.env.JWT_SECRET, { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role.name,
            },
        });
    }
    catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({ success: false, errors: error.errors });
            return;
        }
        next(error);
    }
};
exports.login = login;
const logout = (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ success: true, message: 'Logged out successfully' });
};
exports.logout = logout;
const me = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }
        const userId = typeof req.user.id === 'number' ? req.user.id : parseInt(String(req.user.id), 10);
        const user = await db_1.default.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, status: true, role: true, lastLogin: true, createdAt: true },
        });
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        res.status(200).json({ success: true, data: user });
    }
    catch (error) {
        next(error);
    }
};
exports.me = me;
