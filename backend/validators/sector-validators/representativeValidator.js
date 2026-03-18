"use strict";
const Joi = require("joi");
const { validate: isUuid } = require("uuid");

// =================== Assign Representative Schema ===================
const assignRepresentativeSchema = Joi.object({
    sector_node_id: Joi.string()
        .required()
        .custom((value, helpers) => {
            if (!isUuid(value)) return helpers.error("any.invalid");
            return value;
        })
        .messages({
            "any.required": "Sector node ID is required.",
            "any.invalid": "Sector node ID must be a valid UUID.",
        }),

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

    can_manage: Joi.boolean().optional(),

    valid_from: Joi.date().optional().allow(null),

    valid_until: Joi.date().optional().allow(null)
        .messages({
            "date.base": "valid_until must be a valid date.",
        }),

    notes: Joi.string().optional().allow(null, ""),
});

// =================== Update Representative Schema ===================
const updateRepresentativeSchema = Joi.object({
    can_manage: Joi.boolean().optional(),
    valid_from: Joi.date().optional().allow(null, ""),
    valid_until: Joi.date().optional().allow(null, ""),
    is_active: Joi.boolean().optional(),
    notes: Joi.string().optional().allow(null, ""),
});

// =================== Validators ===================
exports.validateAssignRepresentative = (req, res, next) => {
    const { error } = assignRepresentativeSchema.validate(req.body, { abortEarly: true });
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
};

exports.validateUpdateRepresentative = (req, res, next) => {
    const { error } = updateRepresentativeSchema.validate(req.body, { abortEarly: true });
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
};