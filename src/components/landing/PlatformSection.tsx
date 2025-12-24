'use client'

import { Apple, Smartphone, Download } from 'lucide-react'
import { motion } from 'framer-motion'
import { branding } from '@/config/branding'
import { useDeviceDetection } from '@/hooks/useDeviceDetection'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { IOSInstallModal } from './IOSInstallModal'
import { InstallInstructionsDialog } from './InstallInstructionsDialog'
import { getIcon } from '@/lib/icons'

export function PlatformSection() {
  const { platforms } = branding.landing
  const { download } = branding
  const { isIOS, isAndroid, isStandalone } = useDeviceDetection()
  const {
    showIOSModal,
    showInstructionsModal,
    openIOSModal,
    closeIOSModal,
    closeInstructionsModal,
    promptInstall
  } = usePWAInstall()

  // Handle download button clicks based on device
  const handleIOSDownload = () => {
    // If there's a real App Store link, use it
    if (download.ios && download.ios !== '#') {
      window.open(download.ios, '_blank')
    } else {
      // Otherwise show PWA install instructions
      openIOSModal()
    }
  }

  const handleAndroidDownload = () => {
    // If there's a real Play Store link, use it
    if (download.android && download.android !== '#') {
      window.open(download.android, '_blank')
    } else {
      // Otherwise trigger PWA install
      promptInstall()
    }
  }

  return (
    <section id="download" className="py-24 bg-bg-secondary">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
            Available on All Your Devices
          </h2>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Seamlessly sync across platforms. Your wallet, everywhere you go.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {platforms.map((platform, index) => {
            const Icon = getIcon(platform.icon)
            return (
              <motion.div
                key={index}
                className="bg-bg-primary border border-bg-tertiary rounded-xl p-8 text-center hover:border-brand-primary/30 hover:shadow-glow transition-all group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="bg-brand-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-brand-primary/20 transition-colors">
                  <Icon className="w-8 h-8 text-brand-primary" />
                </div>
                <h3 className="text-text-primary font-semibold text-lg mb-2">
                  {platform.name}
                </h3>
                <p className="text-text-secondary text-sm mb-4">
                  {platform.description}
                </p>
                <div className="inline-flex items-center justify-center px-3 py-1 bg-bg-secondary border border-brand-primary/30 rounded-full text-brand-primary text-xs font-medium">
                  {platform.badge}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Download CTAs - Device-aware buttons */}
        {!isStandalone && (
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            {/* Show iOS button for iOS devices or all devices on desktop */}
            {(isIOS || (!isIOS && !isAndroid)) && (
              <button
                onClick={handleIOSDownload}
                className="inline-flex items-center justify-center gap-2 bg-bg-primary border-2 border-text-primary text-text-primary hover:bg-text-primary hover:text-bg-primary font-semibold px-6 py-3 rounded-lg transition-all"
              >
                <Apple className="w-5 h-5" />
                <span>Download on App Store</span>
              </button>
            )}

            {/* Show Android button for Android devices or all devices on desktop */}
            {(isAndroid || (!isIOS && !isAndroid)) && (
              <button
                onClick={handleAndroidDownload}
                className="inline-flex items-center justify-center gap-2 bg-bg-primary border-2 border-text-primary text-text-primary hover:bg-text-primary hover:text-bg-primary font-semibold px-6 py-3 rounded-lg transition-all"
              >
                <Smartphone className="w-5 h-5" />
                <span>Get it on Google Play</span>
              </button>
            )}
          </motion.div>
        )}

        {/* Show installed message if already running as PWA */}
        {isStandalone && (
          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 bg-action-green/10 border border-action-green/30 rounded-lg px-6 py-3 text-action-green">
              <Download className="w-5 h-5" />
              <span className="font-semibold">App already installed!</span>
            </div>
          </motion.div>
        )}

        {/* iOS Installation Modal */}
        <IOSInstallModal open={showIOSModal} onClose={closeIOSModal} />

        {/* General Install Instructions Modal */}
        <InstallInstructionsDialog open={showInstructionsModal} onClose={closeInstructionsModal} />
      </div>
    </section>
  )
}
