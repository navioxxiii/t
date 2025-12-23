'use client'

import { motion } from 'framer-motion'
import { Shield, Users, Star, ArrowRight, Download } from 'lucide-react'
import Link from 'next/link'
import { branding } from '@/config/branding'
import { MediaAsset } from '@/components/ui/MediaAsset'
import { useDeviceDetection } from '@/hooks/useDeviceDetection'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { IOSInstallModal } from './IOSInstallModal'
import { InstallInstructionsDialog } from './InstallInstructionsDialog'

export function HeroSection() {
  const { hero, stats } = branding.landing
  const { isIOS, isAndroid, isDesktop } = useDeviceDetection()
  const {
    canInstall,
    debugInfo,
    showIOSModal,
    showInstructionsModal,
    openIOSModal,
    closeIOSModal,
    closeInstructionsModal,
    promptInstall
  } = usePWAInstall()

  // Handle smart download based on device
  const handleDownloadClick = (e: React.MouseEvent) => {
    e.preventDefault()

    if (isIOS) {
      // Show iOS install modal
      openIOSModal()
    } else if (isAndroid || isDesktop) {
      // Trigger PWA install prompt
      promptInstall()
    } else {
      // Fallback: scroll to download section
      document.getElementById('download')?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-linear-to-b from-bg-primary via-bg-primary to-bg-secondary" />

      <div className="absolute inset-0 opacity-20">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-brand-primary rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-action-green rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 bg-brand-primary/10 border border-brand-primary/20 rounded-full px-4 py-2 mb-6">
                <span className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
                <span className="text-brand-primary text-sm font-medium">
                  {hero.badge}
                </span>
              </div>
            </motion.div>

            <motion.h1
              className="text-5xl md:text-7xl font-bold text-text-primary mb-6 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {hero.headline.split(hero.highlightedText)[0]}
              <span className="text-gradient-primary">{hero.highlightedText}</span>
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-text-secondary mb-8 max-w-2xl mx-auto lg:mx-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {hero.subheadline}
            </motion.p>

            {/* CTAs */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <button
                onClick={handleDownloadClick}
                className="group bg-brand-primary hover:bg-brand-primary-dark text-bg-primary font-semibold px-8 py-4 rounded-lg text-lg transition-all hover:shadow-glow transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                {hero.primaryCTA}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <Link href="/register">
                <button className="border-2 border-bg-tertiary hover:border-brand-primary text-text-primary font-semibold px-8 py-4 rounded-lg text-lg transition-all">
                  {hero.secondaryCTA}
                </button>
              </Link>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-text-secondary text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-brand-primary" />
                <span>Bank-level security</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-primary" />
                <span className="font-semibold text-text-primary">{stats.users}</span> users
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-brand-primary fill-brand-primary" />
                <span className="font-semibold text-text-primary">{stats.rating}</span> rating
              </div>
            </motion.div>
          </div>

          {/* Right: App Mockup Placeholder */}
          <motion.div
            className="relative hidden lg:block"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="relative z-10">
              <motion.div
                animate={{
                  y: [0, -20, 0],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="w-full max-w-md mx-auto"
              >
                {/* App mockup - supports static images, GIFs, or videos */}
                <div className="bg-bg-secondary border-2 border-bg-tertiary p-4 md:p-8 shadow-glow-strong" style={{ borderRadius: "72px" }}>
                  <div className="bg-bg-primary overflow-hidden" style={{ borderRadius: "64px" }}>
                    <MediaAsset
                      src="/images/hero-mockup.webp"
                      alt={`${branding.name.full} app interface`}
                      priority
                      width={675}
                      height={1200}
                      className="object-contain h-full w-full"
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 hidden md:block"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-text-tertiary rounded-full flex justify-center p-2">
          <div className="w-1 h-2 bg-text-tertiary rounded-full" />
        </div>
      </motion.div>

      {/* iOS Installation Modal */}
      <IOSInstallModal open={showIOSModal} onClose={closeIOSModal} />

      {/* General Install Instructions Modal */}
      <InstallInstructionsDialog open={showInstructionsModal} onClose={closeInstructionsModal} />
    </section>
  )
}
