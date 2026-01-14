"use strict";
const Joi = require("joi");
const { validate: isUuid } = require("uuid");

// =================== Create Complaint Schema ===================
const createComplaintSchema = Joi.object({
  full_name: Joi.string().min(3).max(255).allow(null, "").optional(),

  email: Joi.string().email().allow(null, "").optional().messages({
    "string.email": "Email must be a valid email address.",
  }),

  phone_number: Joi.string().min(7).max(20).allow(null, "").optional(),

  category_id: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!isUuid(value)) return helpers.error("any.invalid");
      return value;
    })
    .messages({
      "any.required": "Complaint category is required.",
      "any.invalid": "Category ID must be a valid UUID.",
    }),

  sector_node_id: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!isUuid(value)) return helpers.error("any.invalid");
      return value;
    })
    .messages({
      "any.required": "Sector node is required.",
      "any.invalid": "Sector node ID must be a valid UUID.",
    }),

  title: Joi.string().min(5).max(255).required().messages({
    "string.empty": "Complaint title is required.",
    "string.min": "Title must be at least 5 characters long.",
  }),

  description: Joi.string().min(10).required().messages({
    "string.empty": "Complaint description is required.",
    "string.min": "Description must be at least 10 characters long.",
  }),

  location: Joi.string().allow(null, "").optional(),

  incident_date: Joi.date().allow(null).optional().messages({
    "date.base": "Incident date must be a valid date.",
  }),

  is_anonymous: Joi.boolean().optional(),

  captcha_token: Joi.string().required().messages({
    "string.empty": "Captcha token is required.",
  }),

  ip_address: Joi.string().ip().allow(null, "").optional(),
});

// =================== Update Complaint Schema ===================
const updateComplaintSchema = Joi.object({
  title: Joi.string().min(5).max(255).optional(),
  description: Joi.string().min(10).optional(),
  location: Joi.string().allow(null, "").optional(),
  incident_date: Joi.date().allow(null).optional(),
  status: Joi.string()
    .valid("pending", "in_progress", "resolved", "rejected")
    .optional(),
});

// =================== Validators ===================
exports.validateCreateComplaint = (req, res, next) => {
  const { error } = createComplaintSchema.validate(req.body, {
    abortEarly: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  next();
};

exports.validateUpdateComplaint = (req, res, next) => {
  const { error } = updateComplaintSchema.validate(req.body, {
    abortEarly: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  next();
};
