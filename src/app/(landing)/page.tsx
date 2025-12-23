import { HeroSection } from '@/components/landing/HeroSection'
import { FeaturesGrid } from '@/components/landing/FeaturesGrid'
import { FeatureShowcase } from '@/components/landing/FeatureShowcase'
import { SecuritySection } from '@/components/landing/SecuritySection'
import { PlatformSection } from '@/components/landing/PlatformSection'
import { FAQSection } from '@/components/landing/FAQSection'
import { FinalCTA } from '@/components/landing/FinalCTA'

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturesGrid />
      <FeatureShowcase />
      <SecuritySection />
      <PlatformSection />
      <FAQSection />
      <FinalCTA />
    </>
  )
}
