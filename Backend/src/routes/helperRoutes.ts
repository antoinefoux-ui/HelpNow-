import express, { Router } from 'express';
import { helperController } from '../controllers/helperController';
import { authenticateToken } from '../middleware/auth';

const router: Router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/v1/helpers/:userId/setup
 * @desc    Setup helper profile
 * @access  Private
 */
router.post('/:userId/setup', helperController.setupHelperProfile);

/**
 * @route   PUT /api/v1/helpers/:userId/availability
 * @desc    Update helper availability
 * @access  Private
 */
router.put('/:userId/availability', helperController.updateAvailability);

/**
 * @route   POST /api/v1/helpers/:userId/certifications
 * @desc    Add certification
 * @access  Private
 */
router.post('/:userId/certifications', helperController.addCertification);

/**
 * @route   PUT /api/v1/helpers/:userId/certifications/:certId
 * @desc    Update certification
 * @access  Private
 */
router.put('/:userId/certifications/:certId', helperController.updateCertification);

/**
 * @route   DELETE /api/v1/helpers/:userId/certifications/:certId
 * @desc    Delete certification
 * @access  Private
 */
router.delete('/:userId/certifications/:certId', helperController.deleteCertification);

/**
 * @route   GET /api/v1/helpers/:userId/statistics
 * @desc    Get helper statistics
 * @access  Private
 */
router.get('/:userId/statistics', helperController.getStatistics);

/**
 * @route   POST /api/v1/helpers/:userId/location
 * @desc    Update helper current location
 * @access  Private
 */
router.post('/:userId/location', helperController.updateLocation);

export default router;
