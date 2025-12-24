'use client'

import { Shield, Lock, KeyRound, FileCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { branding } from '@/config/branding'

const iconMap = {
  Shield,
  Lock,
  Key: KeyRound,
  FileCheck,
}

export function SecuritySection() {
  const { security } = branding.landing

  return (
    <section id="security" className="py-24 bg-bg-primary">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-action-green/10 border border-action-green/20 rounded-full px-4 py-2 mb-6">
              <Shield className="w-4 h-4 text-action-green" />
              <span className="text-action-green text-sm font-medium">
                {security.badge}
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
              {security.headline}
            </h2>
            <p className="text-lg text-text-secondary mb-8">
              {security.subheadline}
            </p>

            {/* Security Features */}
            <div className="space-y-6">
              {security.features.map((feature, index) => {
                const Icon = iconMap[feature.icon as keyof typeof iconMap]
                return (
                  <SecurityFeature
                    key={index}
                    icon={Icon}
                    title={feature.title}
                    description={feature.description}
                  />
                )
              })}
            </div>

            {/* Certifications */}
            <div className="mt-10 pt-10 border-t border-bg-tertiary">
              <p className="text-text-secondary text-sm mb-4">Certified by:</p>
              <div className="flex flex-wrap gap-4">
                {security.certifications.map((cert, index) => (
                  <div
                    key={index}
                    className="bg-bg-secondary border border-brand-primary/30 rounded-lg px-4 py-2 text-text-primary text-sm"
                  >
                    {cert}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right: Visual */}
          <motion.div
            className="relative flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative w-full max-w-md">
              {/* Glowing circle background */}
              <div className="absolute inset-0 bg-brand-primary/10 rounded-full blur-3xl" />

              {/* Shield Icon */}
              <div className="relative bg-bg-secondary border-2 border-brand-primary/30 rounded-full w-64 h-64 flex items-center justify-center mx-auto shadow-glow">
                <Shield className="w-32 h-32 text-brand-primary" />
              </div>

              {/* Floating badges */}
              <motion.div
                className="absolute top-10 -right-10 bg-bg-secondary border border-action-green/30 rounded-lg p-3 shadow-green-glow"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-action-green rounded-full" />
                  <span className="text-text-primary text-sm font-medium">Secured</span>
                </div>
              </motion.div>

              <motion.div
                className="absolute bottom-10 -left-10 bg-bg-secondary border border-brand-primary/30 rounded-lg p-3 shadow-glow"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-brand-primary" />
                  <span className="text-text-primary text-sm font-medium">Encrypted</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

interface SecurityFeatureProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}

function SecurityFeature({ icon: Icon, title, description }: SecurityFeatureProps) {
  return (
    <div className="flex gap-4">
      <div className="bg-brand-primary/10 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-6 h-6 text-brand-primary" />
      </div>
      <div>
        <h3 className="text-text-primary font-semibold mb-1">{title}</h3>
        <p className="text-text-secondary text-sm">{description}</p>
      </div>
    </div>
  )
}
