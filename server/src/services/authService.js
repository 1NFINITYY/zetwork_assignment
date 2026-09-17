const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Account = require('../models/Account');
const AppError = require('../utils/AppError');
const generateAccountNumber = require('../utils/generateAccountNumber');
const env = require('../config/env');

/**
 * Register a new user and auto-create their bank account.
 * New accounts start with ₹10,000 (1,000,000 paise) as demo balance.
 */
const registerUser = async ({ name, email, password }) => {
  // Check if email already registered
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
  }

  // Create user (passwordHash pre-save hook will hash it)
  const user = await User.create({
    name,
    email,
    passwordHash: password, // will be hashed by pre-save hook
  });

  // Auto-create bank account with demo balance (₹10,000 = 1,000,000 paise)
  const accountNumber = await generateAccountNumber();
  const account = await Account.create({
    accountNumber,
    userId: user._id,
    balancePaise: 1_000_000, // ₹10,000 starting balance
    currency: 'INR',
    status: 'ACTIVE',
  });

  return { user, account };
};

/**
 * Log in a user and return a signed JWT.
 */
const loginUser = async ({ email, password }) => {
  // Explicitly select passwordHash (it's select: false by default)
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    // Don't reveal whether email exists
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const token = jwt.sign(
    { userId: user._id, email: user.email },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  return { user, token };
};

module.exports = { registerUser, loginUser };
