import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
		trim: true,
		minlength: 3,
		maxlength: 50,
	},
	email: {
		type: String,
		required: true,
		unique: true,
		trim: true,
	},
	password: {
		type: String,
		required: true,
	},
	role: {
		type: String,
		enum: ['user', 'admin'],
		default: 'user',
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	updatedAt: {
		type: Date,
		default: Date.now,
	},
});

// Password hashing
userSchema.pre('save', async function () {
	if (this.isModified('password')) {
		const salt = await bcrypt.genSalt(10);
		this.password = await bcrypt.hash(this.password, salt);
	}
});

// password comparison
userSchema.methods.comparePassword = async function (password: string) {
	return await bcrypt.compare(password, this.password);
};

// accessToken generation
userSchema.methods.generateAccessToken = function () {
	const secret = process.env.JWT_SECRET;

	if (!secret) {
		throw new Error('JWT_SECRET is not defined in environment variables');
	}

	return jwt.sign({ id: this._id, role: this.role }, secret, {
		expiresIn: process.env.JWT_EXPIRES_IN || '1d',
	} as SignOptions);
};

userSchema.pre('save', function () {
	this.updatedAt = new Date();
});
const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
