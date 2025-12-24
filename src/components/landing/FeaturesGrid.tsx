'use client'

import { Shield, Zap, Network, Smartphone, Vault, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { branding } from '@/config/branding'

const iconMap = {
  Shield,
  Zap,
  Network,
  Smartphone,
  Vault,
  TrendingUp,
}

export function FeaturesGrid() {
  const { features } = branding.landing

  return (
    <section id="features" className="py-24 bg-bg-primary">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.h2
            className="text-4xl md:text-5xl font-bold text-text-primary mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Everything You Need
          </motion.h2>
          <motion.p
            className="text-xl text-text-secondary max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Built for beginners, loved by experts. A complete crypto solution.
          </motion.p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = iconMap[feature.icon as keyof typeof iconMap]
            return (
              <FeatureCard
                key={index}
                icon={Icon}
                title={feature.title}
                description={feature.description}
                delay={index * 0.1}
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  delay: number
}

function FeatureCard({ icon: Icon, title, description, delay }: FeatureCardProps) {
  return (
    <motion.div
      className="bg-bg-secondary border border-bg-tertiary rounded-lg p-6 hover:border-brand-primary/30 hover:shadow-glow transition-all group"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="bg-brand-primary/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand-primary/20 transition-colors">
        <Icon className="w-7 h-7 text-brand-primary" />
      </div>
      <h3 className="text-xl font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary leading-relaxed">{description}</p>
    </motion.div>
  )
}
