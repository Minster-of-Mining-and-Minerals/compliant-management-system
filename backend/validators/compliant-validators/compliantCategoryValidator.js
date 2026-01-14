"use strict";
const Joi = require("joi");
const { validate: isUuid } = require("uuid");

// =================== Create Complaint Category Schema ===================
const createComplaintCategorySchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(100)
    .required()
    .pattern(/^[a-zA-Z0-9\s\-_]+$/)
    .messages({
      "string.empty": "Category name is required.",
      "string.min": "Category name must be at least 3 characters long.",
      "string.max": "Category name must not exceed 100 characters.",
      "string.pattern.base":
        "Category name can only contain letters, numbers, spaces, hyphens, and underscores.",
    }),

  description: Joi.string().allow(null, "").max(500).optional().messages({
    "string.max": "Description must not exceed 500 characters.",
  }),

  is_active: Joi.boolean().optional().messages({
    "boolean.base": "Active status must be a boolean value.",
  }),
});

// =================== Update Complaint Category Schema ===================
const updateComplaintCategorySchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(100)
    .optional()
    .pattern(/^[a-zA-Z0-9\s\-_]+$/)
    .messages({
      "string.min": "Category name must be at least 3 characters long.",
      "string.max": "Category name must not exceed 100 characters.",
      "string.pattern.base":
        "Category name can only contain letters, numbers, spaces, hyphens, and underscores.",
    }),

  description: Joi.string().allow(null, "").max(500).optional().messages({
    "string.max": "Description must not exceed 500 characters.",
  }),

  is_active: Joi.boolean().optional().messages({
    "boolean.base": "Active status must be a boolean value.",
  }),
});

// =================== ID Validation Schema ===================
const idParamSchema = Joi.object({
  id: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!isUuid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    }, "UUID validation")
    .messages({
      "string.empty": "Category ID is required.",
      "any.invalid": "Category ID must be a valid UUID.",
      "any.required": "Category ID is required.",
    }),
});

// =================== Query Parameters Schema ===================
const queryParamsSchema = Joi.object({
  is_active: Joi.string().valid("true", "false").optional().messages({
    "any.only": "is_active must be either 'true' or 'false'.",
  }),

  search: Joi.string().trim().max(100).optional().messages({
    "string.max": "Search query must not exceed 100 characters.",
  }),
});

// =================== Validators ===================
exports.validateCreateComplaintCategory = (req, res, next) => {
  const { error } = createComplaintCategorySchema.validate(req.body, {
    abortEarly: true,
    allowUnknown: false,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  next();
};

exports.validateUpdateComplaintCategory = (req, res, next) => {
  const { error } = updateComplaintCategorySchema.validate(req.body, {
    abortEarly: true,
    allowUnknown: false,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  next();
};

exports.validateIdParam = (req, res, next) => {
  const { error } = idParamSchema.validate(
    { id: req.params.id },
    {
      abortEarly: true,
    }
  );

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  next();
};

exports.validateQueryParams = (req, res, next) => {
  const { error } = queryParamsSchema.validate(req.query, {
    abortEarly: true,
    allowUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  next();
};
