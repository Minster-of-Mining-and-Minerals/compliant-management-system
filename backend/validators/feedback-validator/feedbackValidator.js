"use strict";
const Joi = require("joi");
const { validate: isUuid } = require("uuid");

// =================== Create Feedback Schema ===================
const createFeedbackSchema = Joi.object({
  sector_node_id: Joi.string()
    .allow(null, "")
    .custom((value, helpers) => {
      if (value && value !== "" && !isUuid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    }, "UUID validation")
    .messages({
      "any.invalid": "Sector node ID must be a valid UUID.",
    }),

  full_name: Joi.string().min(2).max(100).required().trim().messages({
    "string.empty": "Full name is required.",
    "string.min": "Full name must be at least 2 characters long.",
    "string.max": "Full name must not exceed 100 characters.",
  }),

  feedback: Joi.string().min(10).max(5000).required().trim().messages({
    "string.empty": "Feedback text is required.",
    "string.min": "Feedback must be at least 10 characters long.",
    "string.max": "Feedback must not exceed 5000 characters.",
  }),

  rating: Joi.number().integer().min(1).max(5).required().messages({
    "number.base": "Rating must be a number.",
    "number.min": "Rating cannot be less than 1.",
    "number.max": "Rating cannot be greater than 5.",
    "any.required": "Rating is required.",
  }),
});

// =================== Update Feedback Schema ===================
const updateFeedbackSchema = Joi.object({
  sector_node_id: Joi.string()
    .allow(null, "")
    .custom((value, helpers) => {
      if (value && value !== "" && !isUuid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    }, "UUID validation")
    .optional()
    .messages({
      "any.invalid": "Sector node ID must be a valid UUID.",
    }),

  full_name: Joi.string().min(2).max(100).trim().optional(),

  feedback: Joi.string().min(10).max(5000).trim().optional(),

  rating: Joi.number().integer().min(1).max(5).optional().messages({
    "number.base": "Rating must be a number.",
    "number.min": "Rating cannot be less than 1.",
    "number.max": "Rating cannot be greater than 5.",
  }),
});

// =================== Query Parameters Schema ===================
const feedbackQuerySchema = Joi.object({
  sector_node_id: Joi.string()
    .custom((value, helpers) => {
      if (value && !isUuid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    }, "UUID validation")
    .optional()
    .messages({
      "any.invalid": "Sector node ID must be a valid UUID.",
    }),

  min_rating: Joi.number().integer().min(1).max(5).optional().messages({
    "number.base": "Minimum rating must be a number.",
    "number.min": "Minimum rating cannot be less than 1.",
    "number.max": "Minimum rating cannot be greater than 5.",
  }),

  max_rating: Joi.number().integer().min(1).max(5).optional().messages({
    "number.base": "Maximum rating must be a number.",
    "number.min": "Maximum rating cannot be less than 1.",
    "number.max": "Maximum rating cannot be greater than 5.",
  }),

  start_date: Joi.date().iso().optional().messages({
    "date.base": "Start date must be a valid date in ISO format (YYYY-MM-DD).",
  }),

  end_date: Joi.date().iso().min(Joi.ref("start_date")).optional().messages({
    "date.base": "End date must be a valid date in ISO format (YYYY-MM-DD).",
    "date.min": "End date cannot be earlier than start date.",
  }),

  search: Joi.string().min(1).max(100).optional().messages({
    "string.max": "Search query must not exceed 100 characters.",
  }),

  sort_by: Joi.string()
    .valid("created_at", "updated_at", "rating", "full_name")
    .optional()
    .messages({
      "any.only":
        "Sort by must be one of: created_at, updated_at, rating, full_name",
    }),

  sort_order: Joi.string().valid("ASC", "DESC").optional().messages({
    "any.only": "Sort order must be ASC or DESC",
  }),
});

// =================== Statistics Query Schema ===================
const feedbackStatsSchema = Joi.object({
  sector_node_id: Joi.string()
    .custom((value, helpers) => {
      if (value && !isUuid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    }, "UUID validation")
    .optional()
    .messages({
      "any.invalid": "Sector node ID must be a valid UUID.",
    }),

  start_date: Joi.date().iso().optional().messages({
    "date.base": "Start date must be a valid date in ISO format (YYYY-MM-DD).",
  }),

  end_date: Joi.date().iso().min(Joi.ref("start_date")).optional().messages({
    "date.base": "End date must be a valid date in ISO format (YYYY-MM-DD).",
    "date.min": "End date cannot be earlier than start date.",
  }),
});

// =================== Validators ===================
exports.validateCreateFeedback = (req, res, next) => {
  const { error } = createFeedbackSchema.validate(req.body, {
    abortEarly: true,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  next();
};

exports.validateUpdateFeedback = (req, res, next) => {
  const { error } = updateFeedbackSchema.validate(req.body, {
    abortEarly: true,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  next();
};

exports.validateFeedbackQuery = (req, res, next) => {
  const { error } = feedbackQuerySchema.validate(req.query, {
    abortEarly: true,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  next();
};

exports.validateFeedbackStatsQuery = (req, res, next) => {
  const { error } = feedbackStatsSchema.validate(req.query, {
    abortEarly: true,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  next();
};

exports.validateFeedbackId = (req, res, next) => {
  const { id } = req.params;

  if (!isUuid(id)) {
    return res.status(400).json({
      success: false,
      message: "Feedback ID must be a valid UUID.",
    });
  }

  next();
};
