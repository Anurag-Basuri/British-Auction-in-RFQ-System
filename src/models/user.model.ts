import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
	name: {
		type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 50
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



userSchema.pre('save', function() {
	this.updatedAt = new Date();
});
const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;