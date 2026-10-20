import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import { registerSchema, loginSchema } from '../validators/auth.validator';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email: validatedData.email } });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'Email already registered' });
      return;
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Get default role (e.g., Technician or Guest)
    let defaultRole = await prisma.role.findUnique({ where: { name: 'Technician' } });
    if (!defaultRole) {
      defaultRole = await prisma.role.create({ data: { name: 'Technician' } });
    }

    const user = await prisma.user.create({
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
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ success: false, errors: error.errors });
      return;
    }
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      include: { role: true },
    });

    if (!user || !(await bcrypt.compare(validatedData.password, user.password))) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({ success: false, message: 'Account is disabled' });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const token = jwt.sign(
      { id: user.id, roleId: user.roleId },
      process.env.JWT_SECRET as string,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
    );

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
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ success: false, errors: error.errors });
      return;
    }
    next(error);
  }
};

export const logout = (req: Request, res: Response): void => {
  res.clearCookie('token');
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

export const me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const userId = typeof req.user.id === 'number' ? req.user.id : parseInt(String(req.user.id), 10);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, status: true, role: true, lastLogin: true, createdAt: true },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
