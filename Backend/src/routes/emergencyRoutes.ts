import express, { Router } from 'express';
import multer from 'multer';
import { emergencyController } from '../controllers/emergencyController';
import { authenticateToken } from '../middleware/auth';

const router: Router = express.Router();

// All routes require authentication
router.use(authenticateToken);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

/**
 * @route   POST /api/v1/emergencies
 * @desc    Create new emergency request
 * @access  Private
 */
router.post('/', emergencyController.createEmergency);

/**
 * @route   GET /api/v1/emergencies/active/:userId
 * @desc    Get active emergency for user
 * @access  Private
 */
router.get('/active/:userId', emergencyController.getActiveEmergency);

/**
 * @route   GET /api/v1/emergencies/nearby
 * @desc    Get nearby emergency requests for helpers
 * @access  Private
 */
router.get('/nearby', emergencyController.getNearbyEmergencies);

/**
 * @route   GET /api/v1/emergencies/history/:userId
 * @desc    Get emergency history for user
 * @access  Private
 */
router.get('/history/:userId', emergencyController.getEmergencyHistory);

/**
 * @route   POST /api/v1/emergencies/:id/accept
 * @desc    Helper accepts emergency request
 * @access  Private
 */
router.post('/:id/accept', emergencyController.acceptEmergency);

/**
 * @route   POST /api/v1/emergencies/:id/cancel
 * @desc    Cancel emergency request
 * @access  Private
 */
router.post('/:id/cancel', emergencyController.cancelEmergency);

/**
 * @route   POST /api/v1/emergencies/:id/helper-location
 * @desc    Update helper location and ETA
 * @access  Private
 */
router.post('/:id/helper-location', emergencyController.updateHelperLocation);

/**
 * @route   POST /api/v1/emergencies/:id/arrived
 * @desc    Mark helper as arrived
 * @access  Private
 */
router.post('/:id/arrived', emergencyController.markHelperArrived);

/**
 * @route   POST /api/v1/emergencies/:id/resolve
 * @desc    Resolve emergency request
 * @access  Private
 */
router.post('/:id/resolve', emergencyController.resolveEmergency);

/**
 * @route   POST /api/v1/emergencies/:id/voice-note
 * @desc    Upload voice note for emergency
 * @access  Private
 */
router.post('/:id/voice-note', upload.single('audio'), emergencyController.uploadVoiceNote);

export default router;
