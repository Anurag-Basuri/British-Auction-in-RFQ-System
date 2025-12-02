import mongoose from "mongoose";
import { exit } from "process";

export async function connectToDatabase() {
	try {
		const mongoUri = process.env.MONGODB_URI;
		if (!mongoUri) {
			throw new Error('MONGODB_URI is not defined in environment variables');
		}
		await mongoose.connect(mongoUri);
        const connection = mongoose.connection;
        connection.on('error', (error) => {
            console.error('MongoDB connection error:', error);A
            exit(1);
        });
        connection.once('open', () => {
            console.log('Connected to MongoDB');
        });
	} catch (error) {
		console.log('Something went wrong');
		console.error('Error connecting to MongoDB:', error);
	}
}
