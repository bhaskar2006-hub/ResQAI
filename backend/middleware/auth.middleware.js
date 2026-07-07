import { supabase, isSupabaseConfigured } from '../services/supabase.service.js';
import jwt from 'jsonwebtoken';
import prisma from '../services/prisma.service.js';
import AppError from '../utils/appError.js';

export const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    let currentUser;
    let decoded = null;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      // Ignore error: we will check Supabase fallback next
    }

    if (decoded) {
      currentUser = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      if (!currentUser) {
        return next(new AppError('The user belonging to this token no longer exists.', 401));
      }
    } else if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data?.user) {
          return next(new AppError('Invalid token or user session expired. Please log in again!', 401));
        }

        const supabaseUser = data.user;
        currentUser = await prisma.user.findUnique({
          where: { id: supabaseUser.id },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        });

        if (!currentUser) {
          currentUser = await prisma.user.create({
            data: {
              id: supabaseUser.id,
              email: supabaseUser.email || '',
              name: supabaseUser.user_metadata?.name || 'Supabase User',
              password: '',
              role: supabaseUser.user_metadata?.role || 'CITIZEN',
            },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          });
        }
      } catch (err) {
        return next(new AppError('Session validation failed. Please log in again!', 401));
      }
    } else {
      return next(new AppError('Invalid token or user session expired. Please log in again!', 401));
    }

    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};



export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array e.g. ['ADMIN', 'GOVERNMENT']
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};
