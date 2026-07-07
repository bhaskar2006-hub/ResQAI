import * as shelterService from '../services/shelter.service.js';

export const getAllShelters = async (req, res, next) => {
  try {
    const shelters = await shelterService.getAllShelters();
    res.status(200).json({
      success: true,
      results: shelters.length,
      data: {
        shelters,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getShelterById = async (req, res, next) => {
  try {
    const shelter = await shelterService.getShelterById(req.params.id);
    res.status(200).json({
      success: true,
      data: {
        shelter,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createShelter = async (req, res, next) => {
  try {
    const shelter = await shelterService.createShelter(req.body);
    res.status(201).json({
      success: true,
      message: 'Shelter created successfully',
      data: {
        shelter,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateShelter = async (req, res, next) => {
  try {
    const shelter = await shelterService.updateShelter(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Shelter updated successfully',
      data: {
        shelter,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteShelter = async (req, res, next) => {
  try {
    await shelterService.deleteShelter(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Shelter deleted successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
