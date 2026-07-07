import * as hospitalService from '../services/hospital.service.js';

export const getAllHospitals = async (req, res, next) => {
  try {
    const hospitals = await hospitalService.getAllHospitals();
    res.status(200).json({
      success: true,
      results: hospitals.length,
      data: {
        hospitals,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getHospitalById = async (req, res, next) => {
  try {
    const hospital = await hospitalService.getHospitalById(req.params.id);
    res.status(200).json({
      success: true,
      data: {
        hospital,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createHospital = async (req, res, next) => {
  try {
    const hospital = await hospitalService.createHospital(req.body);

    // Later: emit socket event if applicable
    // For now we will check in phase 5 socket integration.
    // If the socket handler exists, we'll invoke it.

    res.status(201).json({
      success: true,
      message: 'Hospital created successfully',
      data: {
        hospital,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateHospital = async (req, res, next) => {
  try {
    const hospital = await hospitalService.updateHospital(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Hospital updated successfully',
      data: {
        hospital,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteHospital = async (req, res, next) => {
  try {
    await hospitalService.deleteHospital(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Hospital deleted successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
