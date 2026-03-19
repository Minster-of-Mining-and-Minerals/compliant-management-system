const Joi = require("joi"); // Wait, I should check the existing import in userValidator.js or profileValidator.js

const updateProfileSchema = Joi.object({
  password: Joi.string().min(6).optional().messages({
    "string.min": "Password must be at least 6 characters long.",
  }),
  confirm_password: Joi.string().valid(Joi.ref("password")).optional().messages({
    "any.only": "Confirm password must match the password.",
  }),
  profile_image_id: Joi.string().guid({ version: "uuidv4" }).optional().messages({
    "string.guid": "Profile image ID must be a valid UUID.",
  }),
});

exports.validateUpdateProfile = (req, res, next) => {
  const { error } = updateProfileSchema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }
  next();
};
