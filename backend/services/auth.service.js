import { supabase, isSupabaseConfigured } from './supabase.service.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from './prisma.service.js';
import AppError from '../utils/appError.js';

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
};

export const signupUser = async (userData) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: userData.email },
  });

  if (existingUser) {
    throw new AppError('Email address is already in use.', 409);
  }

  let finalUserId = null;
  let token = null;

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name,
          role: userData.role,
        },
      },
    });

    if (error) {
      throw new AppError(`Supabase Auth Signup failed: ${error.message}`, 400);
    }
    
    finalUserId = data.user?.id;
    token = data.session?.access_token || null;
  }

  const hashedPassword = await hashPassword(userData.password);

  const newUser = await prisma.user.create({
    data: {
      id: finalUserId || undefined,
      email: userData.email,
      name: userData.name,
      password: hashedPassword,
      role: userData.role,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!token) {
    token = generateToken({ id: newUser.id, role: newUser.role });
  }

  return { user: newUser, token };
};

export const googleLoginUser = async (accessToken) => {
  if (!isSupabaseConfigured || !supabase) {
    throw new AppError('Supabase is not configured. Google login is unavailable.', 501);
  }

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data?.user) {
    throw new AppError('Invalid Google authentication token.', 401);
  }

  const supabaseUser = data.user;
  const email = supabaseUser.email;

  if (!email) {
    throw new AppError('Google account must have an email address.', 400);
  }

  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        id: supabaseUser.id,
        email,
        name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || email.split('@')[0],
        password: '',
        role: 'CITIZEN',
      },
    });
  }

  const appToken = generateToken({ id: user.id, role: user.role });
  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token: appToken };
};

export const loginUser = async (email, password) => {
  let user = null;

  // Try local auth first (bcrypt against Prisma DB)
  user = await prisma.user.findUnique({
    where: { email },
  });

  if (user) {
    if (!(await comparePassword(password, user.password))) {
      throw new AppError('Incorrect email or password.', 401);
    }

    const token = generateToken({ id: user.id, role: user.role });

    // Optionally sync login with Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signInWithPassword({ email, password });
      } catch {
        // Supabase sync is non-critical — local auth already succeeded
      }
    }

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  // User not found locally — try Supabase Auth as fallback
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new AppError('Incorrect email or password.', 401);
    }

    if (data.user) {
      user = await prisma.user.create({
        data: {
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.user_metadata?.name || email.split('@')[0],
          password: '',
          role: data.user.user_metadata?.role || 'CITIZEN',
        },
      });

      const token = generateToken({ id: user.id, role: user.role });
      const { password: _, ...userWithoutPassword } = user;
      return { user: userWithoutPassword, token };
    }
  }

  throw new AppError('Incorrect email or password.', 401);
};

