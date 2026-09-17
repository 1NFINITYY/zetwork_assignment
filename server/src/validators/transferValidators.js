const { z } = require('zod');

const transferSchema = z.object({
  receiverAccountNumber: z
    .string({ required_error: 'Receiver account number is required' })
    .min(1, 'Receiver account number is required')
    .trim(),
  // Amount sent from frontend in RUPEES (float)
  // We validate it's a positive number and convert to paise in the service
  amount: z
    .number({ required_error: 'Amount is required', invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than 0')
    .max(10_000_000, 'Amount cannot exceed ₹1,00,00,000 per transfer'),
  description: z
    .string()
    .max(200, 'Description cannot exceed 200 characters')
    .trim()
    .optional()
    .default(''),
});

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const messages = result.error.errors.map((e) => e.message).join('. ');
    return res.status(400).json({
      success: false,
      message: messages,
      code: 'VALIDATION_ERROR',
    });
  }
  req.body = result.data;
  next();
};

module.exports = { transferSchema, validate };
