"use strict";
const Joi = require("joi");
const { validate: isUuid } = require("uuid");

// =================== Create Sector Node Schema ===================
const createSectorNodeSchema = Joi.object({
  name: Joi.string().min(3).max(255).required().messages({
    "string.empty": "Sector node name is required.",
    "string.min": "Sector node name must be at least 3 characters long.",
    "string.max": "Sector node name must not exceed 255 characters.",
  }),

  description: Joi.string().allow(null, "").optional(),

  parent_id: Joi.string()
    .allow(null, "")
    .custom((value, helpers) => {
      if (value && !isUuid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    }, "UUID validation")
    .messages({
      "any.invalid": "Parent ID must be a valid UUID.",
    }),

  level: Joi.number().integer().min(1).optional().messages({
    "number.base": "Level must be a number.",
    "number.min": "Level cannot be less than 1.",
  }),
});

// =================== Update Sector Node Schema ===================
const updateSectorNodeSchema = Joi.object({
  name: Joi.string().min(3).max(255).optional(),
  description: Joi.string().allow(null, "").optional(),
  parent_id: Joi.string()
    .allow(null, "")
    .custom((value, helpers) => {
      if (value && !isUuid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    }, "UUID validation")
    .optional()
    .messages({
      "any.invalid": "Parent ID must be a valid UUID.",
    }),
  level: Joi.number().integer().min(1).optional(),
  is_active: Joi.boolean().optional(),
});

// =================== Validators ===================
exports.validateCreateSectorNode = (req, res, next) => {
  const { error } = createSectorNodeSchema.validate(req.body, {
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

exports.validateUpdateSectorNode = (req, res, next) => {
  const { error } = updateSectorNodeSchema.validate(req.body, {
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
