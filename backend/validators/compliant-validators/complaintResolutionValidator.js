"use strict";
const Joi = require("joi");
const { validate: isUuid } = require("uuid");

// =================== Resolve Complaint Schema ===================
const resolveComplaintSchema = Joi.object({
  complaint_id: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!isUuid(value)) return helpers.error("any.invalid");
      return value;
    })
    .messages({
      "any.required": "Complaint ID is required.",
      "any.invalid": "Complaint ID must be a valid UUID.",
    }),

  reason: Joi.string().required().min(10).max(5000).messages({
    "string.empty": "Resolution reason is required.",
    "string.min": "Reason must be at least 10 characters long.",
    "string.max": "Reason must not exceed 5000 characters.",
  }),

  attachment_ids: Joi.array()
    .items(
      Joi.string()
        .custom((value, helpers) => {
          if (!isUuid(value)) return helpers.error("any.invalid");
          return value;
        })
        .messages({
          "any.invalid": "Attachment ID must be a valid UUID.",
        }),
    )
    .optional()
    .allow(null)
    .default([])
    .messages({
      "array.base": "Attachment IDs must be an array of UUIDs.",
    }),
});

// =================== Resolution ID Params Schema ===================
const resolutionIdParamsSchema = Joi.object({
  resolution_id: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!isUuid(value)) return helpers.error("any.invalid");
      return value;
    })
    .messages({
      "any.required": "Resolution ID is required.",
      "any.invalid": "Resolution ID must be a valid UUID.",
    }),
});

// =================== Complaint ID Params Schema ===================
const complaintIdParamsSchema = Joi.object({
  complaint_id: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!isUuid(value)) return helpers.error("any.invalid");
      return value;
    })
    .messages({
      "any.required": "Complaint ID is required.",
      "any.invalid": "Complaint ID must be a valid UUID.",
    }),
});

// =================== User ID Params Schema ===================
const userIdParamsSchema = Joi.object({
  user_id: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!isUuid(value)) return helpers.error("any.invalid");
      return value;
    })
    .messages({
      "any.required": "User ID is required.",
      "any.invalid": "User ID must be a valid UUID.",
    }),
});

// =================== Validators ===================
exports.validateResolveComplaint = (req, res, next) => {
  const { error } = resolveComplaintSchema.validate(req.body, {
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

exports.validateResolutionIdParam = (req, res, next) => {
  const { error } = resolutionIdParamsSchema.validate(req.params, {
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

exports.validateComplaintIdParam = (req, res, next) => {
  const { error } = complaintIdParamsSchema.validate(req.params, {
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

exports.validateUserIdParam = (req, res, next) => {
  const { error } = userIdParamsSchema.validate(req.params, {
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
