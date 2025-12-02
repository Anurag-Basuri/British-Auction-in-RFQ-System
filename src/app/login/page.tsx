'use client'
import { useState, useEffect } from 'react'
import {motion,AnimatePresence} from 'framer-motion';

export default function LogIn() {
    const [show, setShow] = useState(false);
    useEffect(() => {
        setShow(true);
    }, []);
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center justify-center h-screen bg-gray-100"
                >
                    <h1 className="text-4xl font-bold mb-8">Login</h1>
                    <form className="flex flex-col items-center">
                        <input
                            type="text"
                            placeholder="Username"
                            className="w-64 h-12 px-4 mb-4 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-64 h-12 px-4 mb-4 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
                        />
                        <button
                            type="submit"
                            className="w-64 h-12 px-4 rounded-lg bg-blue-500 text-white font-bold hover:bg-blue-600"
                        >
                            Login
                        </button>
                    </form>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
