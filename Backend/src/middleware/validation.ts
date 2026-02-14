import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

/**
 * User registration validation
 */
export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  phone: Joi.string()
    .pattern(/^\+?[\d\s-()]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number',
      'any.required': 'Phone number is required',
    }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'any.required': 'Password is required',
  }),
  firstName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'First name must be at least 2 characters',
    'any.required': 'First name is required',
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Last name must be at least 2 characters',
    'any.required': 'Last name is required',
  }),
  dateOfBirth: Joi.date().optional(),
  gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional(),
  language: Joi.string().valid('en', 'fr', 'es', 'pl', 'ru', 'uk', 'sk', 'cs', 'de', 'it').optional(),
});

/**
 * Login validation
 */
export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

/**
 * Emergency request validation
 */
export const emergencyRequestSchema = Joi.object({
  seekerId: Joi.string().uuid().required(),
  seekerInfo: Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().required(),
  }).required(),
  type: Joi.string()
    .valid(
      'heart_attack',
      'accident',
      'fall',
      'breathing_difficulty',
      'loss_consciousness',
      'allergic_reaction',
      'other'
    )
    .required(),
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    accuracy: Joi.number().optional(),
  }).required(),
  address: Joi.string().optional(),
  description: Joi.string().max(500).optional(),
  voiceNoteUrl: Joi.string().uri().optional(),
});

/**
 * Helper profile setup validation
 */
export const helperProfileSchema = Joi.object({
  trainingLevel: Joi.string()
    .valid(
      'cpr_aed',
      'first_aid',
      'emt',
      'paramedic',
      'nurse',
      'doctor',
      'lifeguard',
      'wilderness_first_aid'
    )
    .required(),
  languagesSpoken: Joi.array().items(Joi.string()).optional(),
  situationsWillingToHelp: Joi.array()
    .items(
      Joi.string().valid(
        'heart_attack',
        'accident',
        'fall',
        'breathing_difficulty',
        'loss_consciousness',
        'allergic_reaction',
        'choking',
        'burns',
        'bleeding',
        'seizure'
      )
    )
    .optional(),
  responseRadius: Joi.number().min(500).max(50000).optional(),
});

/**
 * Address validation
 */
export const addressSchema = Joi.object({
  label: Joi.string().valid('home', 'work', 'other').required(),
  street: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().optional(),
  zipCode: Joi.string().optional(),
  country: Joi.string().required(),
  apartmentNumber: Joi.string().optional(),
  buildingCode: Joi.string().optional(),
  floorNumber: Joi.string().optional(),
  arrivalInstructions: Joi.string().max(500).optional(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  isPrimary: Joi.boolean().optional(),
});

/**
 * Emergency contact validation
 */
export const emergencyContactSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  phone: Joi.string()
    .pattern(/^\+?[\d\s-()]+$/)
    .required(),
  relationship: Joi.string().valid('spouse', 'parent', 'child', 'sibling', 'friend', 'other').optional(),
});

/**
 * Certification validation
 */
export const certificationSchema = Joi.object({
  type: Joi.string().required(),
  issuer: Joi.string().required(),
  issueDate: Joi.date().optional(),
  expiryDate: Joi.date().optional(),
  documentUrl: Joi.string().uri().optional(),
});

/**
 * Update user validation
 */
export const updateUserSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  dateOfBirth: Joi.date().optional(),
  gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional(),
  language: Joi.string().valid('en', 'fr', 'es', 'pl', 'ru', 'uk', 'sk', 'cs', 'de', 'it').optional(),
});

/**
 * Validation middleware
 */
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: errors,
      });
      return;
    }

    req.body = value;
    next();
  };
};
