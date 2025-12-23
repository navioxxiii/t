"use client";

import { motion } from "framer-motion";
import { branding } from "@/config/branding";
import { MediaAsset } from "@/components/ui/MediaAsset";

export function FeatureShowcase() {
  const { showcaseFeatures } = branding.landing;

  // Map feature index to image filename
  const featureImages = [
    "/images/features/swap-preview.webp",
    "/images/features/earn-preview.webp",
    "/images/features/copytrade-preview.webp",
  ];

  return (
    <>
      {showcaseFeatures.map((feature, index) => {
        const reverse = index % 2 === 1;
        return (
          <section
            key={index}
            className={`py-24 ${reverse ? "bg-bg-primary" : "bg-bg-secondary"}`}
          >
            <div className="container mx-auto px-4">
              <div
                className={`grid lg:grid-cols-2 gap-12 items-center ${
                  reverse ? "lg:flex-row-reverse" : ""
                }`}
              >
                {/* Content */}
                <motion.div
                  className={reverse ? "lg:order-2" : "lg:order-1"}
                  initial={{ opacity: 0, x: reverse ? 20 : -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                    {feature.title}
                  </h2>
                  <p className="text-lg text-text-secondary mb-6">
                    {feature.description}
                  </p>
                  {feature.features && feature.features.length > 0 && (
                    <ul className="space-y-3">
                      {feature.features.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-action-green/20 flex items-center justify-center flex-shrink-0">
                            <div className="w-2 h-2 rounded-full bg-action-green" />
                          </div>
                          <span className="text-text-secondary">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>

                {/* Feature Preview - supports static images, GIFs, or videos */}
                <motion.div
                  className={reverse ? "lg:order-1" : "lg:order-2"}
                  initial={{ opacity: 0, x: reverse ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="flex justify-center">
                    <div className="relative overflow-hidden shadow-glow border border-bg-tertiary" style={{ borderRadius: "64px" }}>
                      <MediaAsset
                        src={featureImages[index] || featureImages[0]}
                        alt={feature.title}
                        width={675}
                        height={1200}
                        className="object-contain w-auto h-auto max-h-[70vh]"
                      />
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}
