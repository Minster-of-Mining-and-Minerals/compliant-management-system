const Joi = require("joi");
const { validate: isUuid } = require("uuid");

// =================== Assign Complaint Schema ===================
const assignComplaintSchema = Joi.object({
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

  assignee_id: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!isUuid(value)) return helpers.error("any.invalid");
      return value;
    })
    .messages({
      "any.required": "Assignee ID is required.",
      "any.invalid": "Assignee ID must be a valid UUID.",
    }),
});

// =================== Remove Assignment Schema ===================
const removeAssignmentSchema = Joi.object({
  reason: Joi.string().optional().allow(null, "").max(500).messages({
    "string.max": "Reason must not exceed 500 characters.",
  }),
});

// =================== Assignment ID Params Schema ===================
const assignmentIdParamsSchema = Joi.object({
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
exports.validateAssignComplaint = (req, res, next) => {
  const { error } = assignComplaintSchema.validate(req.body, {
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

exports.validateRemoveAssignment = (req, res, next) => {
  // Validate params
  const paramsError = assignmentIdParamsSchema.validate(req.params).error;
  if (paramsError) {
    return res.status(400).json({
      success: false,
      message: paramsError.details[0].message,
    });
  }

  // Validate body if provided
  const bodyError = removeAssignmentSchema.validate(req.body).error;
  if (bodyError) {
    return res.status(400).json({
      success: false,
      message: bodyError.details[0].message,
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
