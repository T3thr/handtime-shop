'use client';
import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

export default function About() {
  return (
    <>
      {/* Craftsman Section */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">Meet Our Craftsmen</h2>
            <p className="text-text-secondary">
              Our products are made with love by skilled local artisans who put their heart into every piece they create.
              Each craftsman brings generations of tradition and unique skills to their work.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((craftsman) => (
              <motion.div
                key={craftsman}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: craftsman * 0.1 }}
                viewport={{ once: true }}
                className="bg-surface-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
              >
                <div className="aspect-[3/2] relative">
                  <Image
                    src={`/api/placeholder/600/400`}
                    alt="Craftsman"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-text-primary mb-1">Craftsman Name</h3>
                  <p className="text-primary text-sm mb-3">Master Woodworker • 25 years experience</p>
                  <p className="text-text-secondary text-sm mb-4">
                    Creates beautiful handcrafted wooden items using traditional techniques passed down through generations.
                  </p>
                  <button className="text-primary font-medium text-sm hover:underline flex items-center">
                    View Craftsman Profile
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-20 bg-background-secondary">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">What Our Customers Say</h2>
            <p className="text-text-secondary">
              Don't just take our word for it. Here's what our happy customers have to say about their shopping experience.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-surface-card rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${i < 4 ? 'text-yellow-400' : 'text-text-muted/30'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="text-text-secondary mb-6 italic">
                  "The craftsmanship is exceptional! I bought a wooden bowl and it's even more beautiful in person. The attention to detail is remarkable."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full overflow-hidden relative bg-background-secondary mr-3">
                    <Image
                      src={`/api/placeholder/100/100`}
                      alt="Customer"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium text-text-primary">Sarah Johnson</h4>
                    <p className="text-xs text-text-muted">Verified Buyer</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-primary/5 to-primary-light/10 dark:from-primary/10 dark:to-primary-dark/15">
        <div className="container mx-auto max-w-4xl px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">Stay Updated</h2>
            <p className="text-text-secondary mb-8 max-w-2xl mx-auto">
              Subscribe to our newsletter to receive updates on new products, special offers, and stories from our craftsmen.
            </p>

            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto"
            >
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 px-4 py-3 rounded-lg border border-border-primary focus:outline-none focus:ring-2 focus:ring-primary bg-surface-card"
              />
              <button className="btn-primary bg-primary hover:bg-primary-dark text-text-inverted px-6 py-3">
                Subscribe
              </button>
            </motion.div>

            <p className="text-xs text-text-muted mt-4">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </motion.div>
        </div>
      </section>
    </>
  );
}