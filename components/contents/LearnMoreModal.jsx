"use client";
import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";

// Export content for Search.jsx
export const learnMoreContent = [
  {
    name: "Our Story",
    content:
      "For generations, the artisans of Uttaradit have been creating beautiful, handcrafted treasures that reflect our rich cultural heritage. Our journey began over 50 years ago when a small group of skilled craftspeople came together with a shared vision: to preserve traditional craftsmanship while bringing these unique creations to appreciative homes around the world. Today, we work with over 200 local artisans, each specializing in their own traditional craft. From intricate wood carving to delicate textile work, our artisans pour their heart and soul into every piece they create. We're proud to support these talented individuals and help preserve techniques that have been passed down through generations. When you purchase one of our products, you're not just buying a beautiful object - you're becoming part of a story that spans decades and connects cultures. You're supporting a community of dedicated artisans and helping ensure that these precious traditions continue to thrive for generations to come.",
  },
  {
    name: "What Makes Us Special",
    content:
      "Handcrafted Excellence: Each product is meticulously crafted by skilled artisans with years of experience preserving traditional techniques. Local Materials: We source high-quality materials locally to support our community and ensure authentic craftsmanship. Cultural Heritage: Our designs reflect the rich cultural heritage of Uttaradit, telling stories that have been passed down through generations. Sustainable Practices: We're committed to eco-friendly production methods that respect both tradition and our environment.",
  },
  {
    name: "Our Process",
    content:
      "Design: Our designs blend traditional motifs with modern aesthetics, starting with hand-drawn sketches that evolve into detailed blueprints. Material Selection: We carefully select sustainable, locally-sourced materials of the highest quality, supporting local suppliers and minimizing our environmental impact. Crafting: Our skilled artisans use time-honored techniques passed down through generations, with each piece requiring hours of focused craftsmanship. Quality Check: Every product undergoes rigorous quality checks to ensure it meets our exacting standards before making its way to your home.",
  },
  {
    name: "Testimonials",
    content:
      "The craftsmanship is absolutely exceptional. Each piece tells a story and brings warmth to my home. - Sarah Johnson, Bangkok | I've never seen such attention to detail. These artisans are truly preserving an important cultural tradition. - Michael Chen, Chiang Mai | The quality and beauty of these handcrafted items surpassed my expectations. Truly one-of-a-kind treasures. - Lisa Nakamura, Tokyo",
  },
];

const LearnMoreModal = ({ isOpen, onClose, section = "", keyword = "" }) => {
  const sectionsRef = useRef({});

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (section) {
        const sectionKey = section.toLowerCase();
        const sectionEl = sectionsRef.current[sectionKey];
        if (sectionEl) {
          sectionEl.scrollIntoView({ behavior: "smooth", block: "center" });
          if (keyword) {
            const elements = sectionEl.querySelectorAll(
              `[data-search-term="${keyword.toLowerCase()}"], [data-search-term="${keyword}"]`
            );
            elements.forEach((el) => {
              el.classList.add("highlight");
              setTimeout(() => el.classList.remove("highlight"), 3000);
            });
          }
        }
      }
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, section, keyword]);

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 50 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 300 } },
    exit: { opacity: 0, scale: 0.8, y: 50 },
  };

  const features = [
    {
      title: "Handcrafted Excellence",
      description: "Each product is meticulously crafted by skilled artisans with years of experience preserving traditional techniques.",
      icon: "👐",
    },
    {
      title: "Local Materials",
      description: "We source high-quality materials locally to support our community and ensure authentic craftsmanship.",
      icon: "🌱",
    },
    {
      title: "Cultural Heritage",
      description: "Our designs reflect the rich cultural heritage of Uttaradit, telling stories that have been passed down through generations.",
      icon: "🏺",
    },
    {
      title: "Sustainable Practices",
      description: "We're committed to eco-friendly production methods that respect both tradition and our environment.",
      icon: "♻️",
    },
  ];

  const testimonials = [
    { quote: "The craftsmanship is absolutely exceptional...", name: "Sarah Johnson", location: "Bangkok" },
    { quote: "I've never seen such attention to detail...", name: "Michael Chen", location: "Chiang Mai" },
    { quote: "The quality and beauty of these handcrafted items...", name: "Lisa Nakamura", location: "Tokyo" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={backdropVariants}
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-surface-card rounded-2xl shadow-2xl"
            variants={modalVariants}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background-secondary transition-colors duration-200 z-10"
            >
              <X className="h-5 w-5 text-text-primary" />
            </button>

            <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
              <Image src="/images/craftsman-workshop.jpg" alt="Craftsman workshop" fill className="object-cover" priority />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/20" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                <motion.h1
                  className="text-3xl md:text-5xl font-bold text-white mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  data-search-term="our artisanal journey"
                >
                  Our Artisanal Journey
                </motion.h1>
                <motion.p
                  className="text-lg text-white/90 max-w-2xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  data-search-term="discover the passion"
                >
                  Discover the passion, tradition, and craftsmanship behind every product we create
                </motion.p>
              </div>
            </div>

            <div className="bg-surface-card p-6 md:p-12">
              <div className="max-w-4xl mx-auto">
                <motion.div
                  ref={(el) => (sectionsRef.current["our story"] = el)}
                  className="mb-12"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <h2 className="text-2xl md:text-3xl font-bold mb-6 text-text-primary" data-search-term="our story">
                    Our Story
                  </h2>
                  <div className="prose prose-lg max-w-none text-text-secondary">
                    <p data-search-term="for generations">
                      For generations, the artisans of Uttaradit have been creating beautiful, handcrafted treasures...
                    </p>
                    <p data-search-term="today we work">
                      Today, we work with over 200 local artisans, each specializing in their own traditional craft...
                    </p>
                    <p data-search-term="when you purchase">
                      When you purchase one of our products, you're not just buying a beautiful object...
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  ref={(el) => (sectionsRef.current["what makes us special"] = el)}
                  className="mb-12"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <h2
                    className="text-2xl md:text-3xl font-bold mb-8 text-text-primary"
                    data-search-term="what makes us special"
                  >
                    What Makes Us Special
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {features.map((feature, index) => (
                      <motion.div
                        key={index}
                        className="bg-background-secondary rounded-xl p-6"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="text-3xl mb-4">{feature.icon}</div>
                        <h3
                          className="text-xl font-semibold mb-2 text-text-primary"
                          data-search-term={feature.title.toLowerCase()}
                        >
                          {feature.title}
                        </h3>
                        <p
                          className="text-text-secondary"
                          data-search-term={feature.description.toLowerCase().slice(0, 20)}
                        >
                          {feature.description}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  ref={(el) => (sectionsRef.current["our process"] = el)}
                  className="mb-12"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <h2 className="text-2xl md:text-3xl font-bold mb-8 text-text-primary" data-search-term="our process">
                    Our Process
                  </h2>
                  <div className="space-y-8">
                    {["Design", "Material Selection", "Crafting", "Quality Check"].map((step, index) => (
                      <motion.div
                        key={index}
                        className="flex gap-4"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-primary-light/20 flex items-center justify-center text-lg font-bold text-primary">
                            {index + 1}
                          </div>
                          {index < 3 && (
                            <div className="absolute top-12 bottom-0 left-1/2 w-0.5 -translate-x-1/2 bg-primary-light/20 h-full"></div>
                          )}
                        </div>
                        <div className="flex-1 pb-8">
                          <h3
                            className="text-xl font-semibold mb-2 text-text-primary"
                            data-search-term={step.toLowerCase()}
                          >
                            {step}
                          </h3>
                          <p className="text-text-secondary" data-search-term={step.toLowerCase()}>
                            {index === 0 && "Our designs blend traditional motifs with modern aesthetics..."}
                            {index === 1 && "We carefully select sustainable, locally-sourced materials..."}
                            {index === 2 && "Our skilled artisans use time-honored techniques..."}
                            {index === 3 && "Every product undergoes rigorous quality checks..."}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  ref={(el) => (sectionsRef.current["testimonials"] = el)}
                  className="mb-12"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <h2 className="text-2xl md:text-3xl font-bold mb-8 text-text-primary" data-search-term="testimonials">
                    What Our Customers Say
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {testimonials.map((testimonial, index) => (
                      <motion.div
                        key={index}
                        className="bg-background-secondary rounded-xl p-6"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="mb-4">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className="text-primary">
                              ★
                            </span>
                          ))}
                        </div>
                        <p
                          className="italic text-text-secondary mb-4"
                          data-search-term={testimonial.quote.toLowerCase().slice(0, 20)}
                        >
                          "{testimonial.quote}"
                        </p>
                        <div>
                          <p className="font-medium text-text-primary">{testimonial.name}</p>
                          <p className="text-sm text-text-muted">{testimonial.location}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  className="text-center py-8"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <h2 className="text-2xl md:text-3xl font-bold mb-4 text-text-primary">Ready to Explore?</h2>
                  <p className="text-text-secondary mb-6">Discover our collection of handcrafted treasures...</p>
                  <motion.button
                    onClick={onClose}
                    className="btn-primary bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Shop Our Collection
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LearnMoreModal;