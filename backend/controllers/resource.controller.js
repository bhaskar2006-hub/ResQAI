import * as resourceService from '../services/resource.service.js';

export const getAllResources = async (req, res, next) => {
  try {
    const { type, status } = req.query;
    const filters = {};
    if (type) filters.type = type;
    if (status) filters.status = status;

    const resources = await resourceService.getAllResources(filters);
    res.status(200).json({
      success: true,
      results: resources.length,
      data: {
        resources,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getResourceById = async (req, res, next) => {
  try {
    const resource = await resourceService.getResourceById(req.params.id);
    res.status(200).json({
      success: true,
      data: {
        resource,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createResource = async (req, res, next) => {
  try {
    const resource = await resourceService.createResource(req.body);
    res.status(201).json({
      success: true,
      message: 'Resource created successfully',
      data: {
        resource,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateResource = async (req, res, next) => {
  try {
    const resource = await resourceService.updateResource(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Resource updated successfully',
      data: {
        resource,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteResource = async (req, res, next) => {
  try {
    await resourceService.deleteResource(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Resource deleted successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
