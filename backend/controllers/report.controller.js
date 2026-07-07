import * as reportService from '../services/report.service.js';

export const getAllReports = async (req, res, next) => {
  try {
    const reports = await reportService.getAllReports();
    res.status(200).json({
      success: true,
      results: reports.length,
      data: {
        reports,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createReport = async (req, res, next) => {
  try {
    const reportData = {
      ...req.body,
      reporterId: req.user.id,
    };
    const report = await reportService.createReport(reportData);
    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: {
        report,
      },
    });
  } catch (error) {
    next(error);
  }
};
