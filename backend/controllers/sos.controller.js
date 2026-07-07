import * as sosService from '../services/sos.service.js';
import AppError from '../utils/appError.js';

export const getAllSos = async (req, res, next) => {
  try {
    const filters = {};
    // Citizens can only view their own SOS reports
    if (req.user.role === 'CITIZEN') {
      filters.reporterId = req.user.id;
    }

    const sosReports = await sosService.getAllSosReports(filters);
    res.status(200).json({
      success: true,
      results: sosReports.length,
      data: {
        sosReports,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSosById = async (req, res, next) => {
  try {
    const sos = await sosService.getSosReportById(req.params.id);

    // Citizen can only access their own SOS reports
    if (req.user.role === 'CITIZEN' && sos.reporterId !== req.user.id) {
      return next(new AppError('You do not have permission to view this SOS report', 403));
    }

    res.status(200).json({
      success: true,
      data: {
        sos,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createSos = async (req, res, next) => {
  try {
    // Attach reporterId from authenticated user
    const sosData = {
      ...req.body,
      reporterId: req.user.id,
    };

    const sos = await sosService.createSosReport(sosData);
    res.status(201).json({
      success: true,
      message: 'SOS emergency report submitted successfully',
      data: {
        sos,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateSos = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sos = await sosService.getSosReportById(id);

    // Citizens can only modify/cancel their own SOS
    if (req.user.role === 'CITIZEN' && sos.reporterId !== req.user.id) {
      return next(new AppError('You do not have permission to update this SOS report', 403));
    }

    // Citizens can NOT change status to ASSIGNED/RESOLVED, only ADMIN, GOVERNMENT, NGO can do that
    if (req.body.status && req.user.role === 'CITIZEN') {
      return next(new AppError('Only responders/admins can change SOS status', 403));
    }

    const updatedSos = await sosService.updateSosReport(id, req.body);
    res.status(200).json({
      success: true,
      message: 'SOS report updated successfully',
      data: {
        sos: updatedSos,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSos = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sos = await sosService.getSosReportById(id);

    // Only Admin or the reporter can delete/cancel a report
    if (req.user.role !== 'ADMIN' && sos.reporterId !== req.user.id) {
      return next(new AppError('You do not have permission to delete this SOS report', 403));
    }

    await sosService.deleteSosReport(id);
    res.status(200).json({
      success: true,
      message: 'SOS report deleted/cancelled successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

export const getSosIntelligence = async (req, res, next) => {
  try {
    const { id } = req.params;
    const intelligence = await sosService.getSosIntelligence(id);
    res.status(200).json({
      success: true,
      data: intelligence,
    });
  } catch (error) {
    next(error);
  }
};
