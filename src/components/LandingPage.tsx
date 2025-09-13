import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Package, ShoppingCart, ArrowRight } from 'lucide-react';

const LandingPage: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 120 }}
        className="container mx-auto px-6 py-4 flex justify-between items-center"
      >
        <div className="flex items-center">
          <div className="w-10 h-10 bg-green-700 rounded-full flex items-center justify-center text-white font-bold text-xl border-2 border-green-200">
            MH
          </div>
          <h1 className="ml-3 text-xl font-bold text-gray-900 dark:text-white">Madeh Hardware</h1>
        </div>
        <Link
          to="/login"
          className="bg-green-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
        >
          Login
        </Link>
      </motion.header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 text-center pt-20 pb-20">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.h2
            variants={itemVariants}
            className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight"
          >
            Streamline Your Hardware Business
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400"
          >
            The all-in-one management system for Madeh Hardware. Track inventory, manage sales, and gain insights with powerful reporting tools.
          </motion.p>
          <motion.div variants={itemVariants} className="mt-8">
            <Link
              to="/login"
              className="inline-flex items-center bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Get Started <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </motion.div>
        </motion.div>
      </main>

      {/* Features Section */}
      <section className="bg-white dark:bg-gray-800 py-20">
        <div className="container mx-auto px-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            className="grid md:grid-cols-3 gap-12 text-center"
          >
            <motion.div variants={itemVariants} className="flex flex-col items-center">
              <div className="p-4 bg-blue-100 dark:bg-blue-900/50 rounded-full mb-4">
                <Package className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Inventory Management</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Easily add, update, and track all your products. Get alerts for low stock and manage your inventory with bulk upload features.
              </p>
            </motion.div>
            <motion.div variants={itemVariants} className="flex flex-col items-center">
              <div className="p-4 bg-green-100 dark:bg-green-900/50 rounded-full mb-4">
                <ShoppingCart className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Sales & Purchases</h3>
              <p className="text-gray-600 dark:text-gray-400">
                A modern point-of-sale interface to create new purchases, track payments, and manage customer transactions efficiently.
              </p>
            </motion.div>
            <motion.div variants={itemVariants} className="flex flex-col items-center">
              <div className="p-4 bg-purple-100 dark:bg-purple-900/50 rounded-full mb-4">
                <BarChart className="w-10 h-10 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Powerful Reporting</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Gain valuable insights into your sales performance with easy-to-read reports. Filter by date and payment method to understand your business better.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-6 text-center text-gray-500 dark:text-gray-400">
          <p>&copy; 2025 Madeh Hardware. All rights reserved.</p>
          <p className="text-sm mt-1">Powered by Dualite Alpha</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
