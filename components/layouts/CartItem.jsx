import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, Plus, Minus } from 'lucide-react';
import Image from 'next/image';

const CartItem = ({ item, updateQuantity, removeFromCart }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="group flex flex-col sm:flex-row gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
    >
      <div className="relative h-24 w-24 sm:h-32 sm:w-32 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          sizes="(max-width: 640px) 96px, 128px"
        />
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-start gap-2">
          <div>
            <h3 className="font-medium text-lg text-gray-900 dark:text-gray-100">
              {item.name}
            </h3>
            {item.category && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {item.category}
              </span>
            )}
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              ${(item.price * item.quantity).toFixed(2)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              ${item.price.toFixed(2)} each
            </div>
          </div>
        </div>

        {item.description && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {item.description}
          </p>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between">
          <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              disabled={item.quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </motion.button>
            <span className="w-10 text-center select-none font-medium">
              {item.quantity}
            </span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              <Plus className="h-4 w-4" />
            </motion.button>
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => removeFromCart(item.id)}
            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 className="h-5 w-5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default CartItem;