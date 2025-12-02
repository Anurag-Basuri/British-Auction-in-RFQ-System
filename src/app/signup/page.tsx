'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ClientComponent() {
	const [mounted, setMounted] = useState(false);
	const [count, setCount] = useState(0);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return null;
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
			<motion.div
				initial={{ opacity: 0, scale: 0.5 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.5 }}
				className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20"
			>
				<h1 className="text-4xl font-bold text-white mb-6 text-center">
					Modern Client Component
				</h1>

				<div className="flex flex-col items-center space-y-4">
					<AnimatePresence mode="wait">
						<motion.div
							key={count}
							initial={{ y: 20, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							exit={{ y: -20, opacity: 0 }}
							className="text-6xl font-bold text-white"
						>
							{count}
						</motion.div>
					</AnimatePresence>

					<div className="flex space-x-4">
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={() => setCount(count + 1)}
							className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
						>
							Increment
						</motion.button>

						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={() => setCount(count - 1)}
							className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
						>
							Decrement
						</motion.button>
					</div>

					<motion.button
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={() => setCount(0)}
						className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
					>
						Reset
					</motion.button>
				</div>
			</motion.div>
		</div>
	);
}
