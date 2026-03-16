"use strict";
const Joi = require("joi");
const { validate: isUuid } = require("uuid");

// =================== Assign Sector Schema ===================
const assignSectorSchema = Joi.object({
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

  department_id: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!isUuid(value)) return helpers.error("any.invalid");
      return value;
    })
    .messages({
      "any.required": "Department ID is required.",
      "any.invalid": "Department ID must be a valid UUID.",
    }),
});

// =================== Params Validator ===================
const assignmentIdParamSchema = Joi.object({
  assignment_id: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!isUuid(value)) return helpers.error("any.invalid");
      return value;
    })
    .messages({
      "any.required": "Assignment ID is required.",
      "any.invalid": "Assignment ID must be a valid UUID.",
    }),
});

const complaintIdParamSchema = Joi.object({
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

const sectorIdParamSchema = Joi.object({
  department_id: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!isUuid(value)) return helpers.error("any.invalid");
      return value;
    })
    .messages({
      "any.required": "Department ID is required.",
      "any.invalid": "Department ID must be a valid UUID.",
    }),
});

// =================== Middleware ===================
exports.validateAssignSector = (req, res, next) => {
  const { error } = assignSectorSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }
  next();
};

exports.validateAssignmentIdParam = (req, res, next) => {
  const { error } = assignmentIdParamSchema.validate(req.params);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }
  next();
};

exports.validateComplaintIdParam = (req, res, next) => {
  const { error } = complaintIdParamSchema.validate(req.params);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }
  next();
};

exports.validateSectorIdParam = (req, res, next) => {
  const { error } = sectorIdParamSchema.validate(req.params);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }
  next();
};