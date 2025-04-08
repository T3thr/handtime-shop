'use client'
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, X } from "lucide-react";
import { toast } from "react-toastify";

export default function SignoutModal({ isOpen, onClose, onConfirm }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", bounce: 0.25 }}
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
          >
            <div 
              className="bg-surface-card rounded-xl shadow-2xl max-w-md w-full border border-border-primary p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-container transition-colors"
              >
                <X className="h-5 w-5 text-foreground" />
              </button>

              <div className="text-center mb-6">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                  <LogOut className="h-6 w-6 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Sign Out Confirmation
                </h2>
                <p className="text-text-secondary">
                  Are you sure you want to sign out?
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 rounded-lg border border-border-primary hover:bg-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-text-inverted hover:bg-red-700 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}