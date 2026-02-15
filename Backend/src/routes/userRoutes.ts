import express, { Router } from 'express';
import multer from 'multer';
import { userController } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router: Router = express.Router();

// All routes require authentication
router.use(authenticateToken);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }
    cb(null, true);
  },
});

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', userController.getUserById);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user profile
 * @access  Private
 */
router.put('/:id', userController.updateUser);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/:id', userController.deleteUser);

/**
 * @route   POST /api/v1/users/:id/photo
 * @desc    Upload profile photo
 * @access  Private
 */
router.post('/:id/photo', upload.single('photo'), userController.uploadPhoto);

/**
 * @route   POST /api/v1/users/:id/addresses
 * @desc    Add new address
 * @access  Private
 */
router.post('/:id/addresses', userController.addAddress);

/**
 * @route   PUT /api/v1/users/:id/addresses/:addressId
 * @desc    Update address
 * @access  Private
 */
router.put('/:id/addresses/:addressId', userController.updateAddress);

/**
 * @route   DELETE /api/v1/users/:id/addresses/:addressId
 * @desc    Delete address
 * @access  Private
 */
router.delete('/:id/addresses/:addressId', userController.deleteAddress);

/**
 * @route   POST /api/v1/users/:id/emergency-contacts
 * @desc    Add emergency contact
 * @access  Private
 */
router.post('/:id/emergency-contacts', userController.addEmergencyContact);

/**
 * @route   DELETE /api/v1/users/:id/emergency-contacts/:contactId
 * @desc    Delete emergency contact
 * @access  Private
 */
router.delete('/:id/emergency-contacts/:contactId', userController.deleteEmergencyContact);

export default router;
