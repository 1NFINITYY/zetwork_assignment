const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Never return passwordHash in queries by default
    },
  },
  {
    timestamps: true,
  }
);

// Note: email has unique:true in the field definition above — no need to repeat schema.index()

// --- Pre-save hook: hash password ---
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  // Skip if already a bcrypt hash (e.g. in tests where we insert pre-hashed values)
  if (this.passwordHash.startsWith('$2a$') || this.passwordHash.startsWith('$2b$')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

// --- Instance method: compare password ---
userSchema.methods.comparePassword = async function (candidatePassword) {
  // We need to explicitly select passwordHash since it's select: false
  const user = await this.constructor.findById(this._id).select('+passwordHash');
  return bcrypt.compare(candidatePassword, user.passwordHash);
};

// --- Never serialize passwordHash ---
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
