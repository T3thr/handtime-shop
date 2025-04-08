"use client";
import React from "react";
import { motion } from "framer-motion";

export default function SigninGuide() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="absolute bottom-24 left-1/3 transform -translate-x-1/2 z-10 flex flex-col items-center"
        >
        <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-primary-20 text-foreground text-sm px-3 py-1 rounded-full shadow-md"
        >
            Sign in here!
        </motion.div>
        <motion.div
            animate={{
            y: [0, -10, 0],
            rotate: [0, 5, -5, 0],
            }}
            transition={{
            y: { repeat: Infinity, duration: 0.8, ease: "easeInOut" },
            rotate: { repeat: Infinity, duration: 0.8, ease: "easeInOut" },
            }}
            className="text-foreground text-2xl"
        >
            ↓
        </motion.div>

        </motion.div>
    );
}