import * as disasterService from '../services/disaster.service.js';

export const getAllDisasters = async (req, res, next) => {
  try {
    const { active } = req.query;
    const filters = {};
    if (active !== undefined) {
      filters.active = active === 'true';
    }

    const disasters = await disasterService.getAllDisasters(filters);
    res.status(200).json({
      success: true,
      results: disasters.length,
      data: {
        disasters,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDisasterById = async (req, res, next) => {
  try {
    const disaster = await disasterService.getDisasterById(req.params.id);
    res.status(200).json({
      success: true,
      data: {
        disaster,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createDisaster = async (req, res, next) => {
  try {
    const disaster = await disasterService.createDisaster(req.body);
    res.status(201).json({
      success: true,
      message: 'Disaster event declared and alerts broadcasted',
      data: {
        disaster,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateDisaster = async (req, res, next) => {
  try {
    const disaster = await disasterService.updateDisaster(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Disaster event updated successfully',
      data: {
        disaster,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDisaster = async (req, res, next) => {
  try {
    await disasterService.deleteDisaster(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Disaster event removed successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
