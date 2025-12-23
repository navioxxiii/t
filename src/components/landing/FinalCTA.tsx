'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Apple, Smartphone } from 'lucide-react'
import QRCode from 'react-qr-code'
import { branding } from '@/config/branding'

export function FinalCTA() {
  const { finalCTA } = branding.landing
  const { download, urls } = branding

  return (
    <section className="py-24 bg-gradient-to-b from-bg-primary to-bg-secondary relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl">
          <div className="w-full h-full bg-brand-primary rounded-full blur-3xl" />
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-6xl font-bold text-text-primary mb-6">
            {finalCTA.headline}
          </h2>
          <p className="text-xl text-text-secondary mb-10">
            {finalCTA.subheadline}
          </p>

          {/* Primary CTA */}
          <a href="#download">
            <button className="group bg-brand-primary hover:bg-brand-primary-dark text-bg-primary font-bold px-12 py-5 rounded-xl text-xl transition-all hover:shadow-glow-strong transform hover:scale-105 inline-flex items-center gap-3 mb-12">
              {finalCTA.primaryCTA}
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </a>

          {/* App Store Badges + QR */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            {/* Badges */}
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={download.ios}
                className="bg-bg-secondary border-2 border-text-primary hover:bg-text-primary hover:scale-105 transition-all rounded-lg px-6 py-3 flex items-center gap-3 group"
              >
                <Apple className="w-6 h-6 text-text-primary group-hover:text-bg-primary" />
                <div className="text-left">
                  <div className="text-xs text-text-secondary group-hover:text-bg-secondary">
                    Download on the
                  </div>
                  <div className="text-sm font-semibold text-text-primary group-hover:text-bg-primary">
                    App Store
                  </div>
                </div>
              </a>

              <a
                href={download.android}
                className="bg-bg-secondary border-2 border-text-primary hover:bg-text-primary hover:scale-105 transition-all rounded-lg px-6 py-3 flex items-center gap-3 group"
              >
                <Smartphone className="w-6 h-6 text-text-primary group-hover:text-bg-primary" />
                <div className="text-left">
                  <div className="text-xs text-text-secondary group-hover:text-bg-secondary">
                    Get it on
                  </div>
                  <div className="text-sm font-semibold text-text-primary group-hover:text-bg-primary">
                    Google Play
                  </div>
                </div>
              </a>
            </div>

            {/* QR Code */}
            <div className="bg-white p-4 rounded-lg">
              <QRCode value={urls.base} size={120} />
              <p className="text-xs text-center mt-2 text-gray-600">Scan to download</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
