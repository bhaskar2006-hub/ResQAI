import * as userService from '../services/user.service.js';
import AppError from '../utils/appError.js';

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json({
      success: true,
      results: users.length,
      data: {
        users,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // A user can only access their own profile unless they are an ADMIN
    if (req.user.id !== id && req.user.role !== 'ADMIN') {
      return next(new AppError('You do not have permission to view this user profile', 403));
    }

    const user = await userService.getUserById(id);
    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // A user can only edit their own profile unless they are an ADMIN
    if (req.user.id !== id && req.user.role !== 'ADMIN') {
      return next(new AppError('You do not have permission to edit this user profile', 403));
    }

    // Prevent non-admins from upgrading their own role
    if (req.body.role && req.user.role !== 'ADMIN') {
      return next(new AppError('Only Admins can update roles', 403));
    }

    const updatedUser = await userService.updateUser(id, req.body);
    res.status(200).json({
      success: true,
      message: 'User profile updated successfully',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // A user can only delete their own profile unless they are an ADMIN
    if (req.user.id !== id && req.user.role !== 'ADMIN') {
      return next(new AppError('You do not have permission to delete this user profile', 403));
    }

    await userService.deleteUser(id);
    res.status(200).json({
      success: true,
      message: 'User profile deleted successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
