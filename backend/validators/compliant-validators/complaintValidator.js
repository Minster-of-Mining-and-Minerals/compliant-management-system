"use strict";
const Joi = require("joi");
const { validate: isUuid } = require("uuid");

// =================== Create Complaint Schema ===================
const createComplaintSchema = Joi.object({
  complaint_type_id: Joi.string()
    .optional()
    .custom((value, helpers) => {
      if (!isUuid(value)) return helpers.error("any.invalid");
      return value;
    })
    .messages({
      "any.invalid": "Complaint Type must be a valid UUID.",
    }),

  full_name: Joi.string().min(3).max(255).optional().allow(null, ""),

  email: Joi.string().email().optional().allow(null, "").messages({
    "string.email": "Email must be a valid email address.",
  }),

  phone_number: Joi.string().min(7).max(20).optional().allow(null, ""),

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
    .custom((value, helpers) => {
      if (!isUuid(value)) return helpers.error("any.invalid");
      return value;
    })
    .messages({
      "any.invalid": "Sector node ID must be a valid UUID.",
    }),

  department_id: Joi.string()
    .optional()
    .allow("", null)
    .custom((value, helpers) => {
      if (!value) return value; // skip validation if empty
      if (!isUuid(value)) return helpers.error("any.invalid");
      return value;
    })
    .messages({
      "any.invalid": "Department node ID must be a valid UUID.",
    }),

  description: Joi.string().min(10).required().messages({
    "string.empty": "Complaint description is required.",
    "string.min": "Description must be at least 10 characters long.",
  }),

  concern_to_user_name: Joi.string().min(10).optional().allow("").messages({
    "string.min": "Concern User Name must be at least 10 characters long.",
  }),

  location: Joi.object({
    city: Joi.string().required().messages({
      "any.required": "City is required.",
      "string.base": "City must be a string.",
    }),
    subcity: Joi.string().required().messages({
      "any.required": "Subcity is required.",
      "string.base": "Subcity must be a string.",
    }),
    woreda: Joi.string().required().messages({
      "any.required": "Woreda is required.",
      "string.base": "Woreda must be a string.",
    }),
  })
    .optional()
    .allow(null),

  incident_date: Joi.date().optional().allow(null).messages({
    "date.base": "Incident date must be a valid date.",
  }),

  is_anonymous: Joi.boolean().optional(),

  request: Joi.string().optional().allow(null, ""),

  ip_address: Joi.string().ip().optional().allow(null, ""),

  attachment_ids: Joi.array()
    .items(Joi.string().guid({ version: "uuidv4" }))
    .optional()
    .allow(null),
});

// =================== Update Complaint Schema ===================
const updateComplaintSchema = Joi.object({
  description: Joi.string().min(10).optional(),
  location: Joi.string().optional().allow(null, ""),
  incident_date: Joi.date().optional().allow(null),
  status: Joi.string()
    .valid("pending", "in_progress", "resolved", "rejected")
    .optional(),
});

// =================== Create Internal Complaint Schema ===================
const createInternalComplaintSchema = Joi.object({
  target_type: Joi.string()
    .valid("person", "department")
    .required()
    .messages({
      "any.required": "Target type is required (person or department).",
      "any.only": "Target type must be person or department.",
    }),

  target_user_id: Joi.string()
    .optional()
    .allow(null, "")
    .custom((value, helpers) => {
      if (!value) return value;
      if (!isUuid(value)) return helpers.error("any.invalid");
      return value;
    })
    .messages({
      "any.invalid": "Target user ID must be a valid UUID.",
    }),

  department_id: Joi.string()
    .optional()
    .allow(null, "")
    .custom((value, helpers) => {
      if (!value) return value;
      if (!isUuid(value)) return helpers.error("any.invalid");
      return value;
    })
    .messages({
      "any.invalid": "Department ID must be a valid UUID.",
    }),

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

  description: Joi.string().min(10).required().messages({
    "string.empty": "Complaint description is required.",
    "string.min": "Description must be at least 10 characters long.",
  }),

  concern_to_user_name: Joi.string().optional().allow(null, ""),

  request: Joi.string().optional().allow(null, ""),

  incident_date: Joi.date().optional().allow(null).messages({
    "date.base": "Incident date must be a valid date.",
  }),

  attachment_ids: Joi.array()
    .items(Joi.string().guid({ version: "uuidv4" }))
    .optional()
    .allow(null),
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

exports.validateCreateInternalComplaint = (req, res, next) => {
  const { error } = createInternalComplaintSchema.validate(req.body, {
    abortEarly: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const { target_type, target_user_id, department_id } = req.body;
  if (target_type === "person" && !target_user_id) {
    return res.status(400).json({
      success: false,
      message: "Target user is required when target type is person.",
    });
  }
  if (target_type === "department" && !department_id) {
    return res.status(400).json({
      success: false,
      message: "Department is required when target type is department.",
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
