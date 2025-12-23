'use client'

import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { branding } from '@/config/branding'
import { useUser } from '@/lib/auth/hooks'
import Image from 'next/image'

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user } = useUser()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-bg-secondary/95 backdrop-blur-lg border-b border-bg-tertiary'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-brand-primary rounded-lg flex items-center justify-center group-hover:shadow-glow transition-all">
              <Image
                src={branding.logo.src}
                alt={branding.name.short}
                width={branding.logo.size}
                height={branding.logo.size}
                className="object-contain"
              />
            </div>
            <span className="text-text-primary font-bold text-xl hidden sm:block">
              {branding.name.short}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-text-secondary hover:text-brand-primary transition-colors"
            >
              Features
            </a>
            <a
              href="#security"
              className="text-text-secondary hover:text-brand-primary transition-colors"
            >
              Security
            </a>
            <a
              href="#download"
              className="text-text-secondary hover:text-brand-primary transition-colors"
            >
              Download
            </a>
            <a
              href="#faq"
              className="text-text-secondary hover:text-brand-primary transition-colors"
            >
              FAQ
            </a>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link href="/dashboard">
                <button className="bg-brand-primary hover:bg-brand-primary-dark text-bg-primary font-semibold px-6 py-2.5 rounded-lg transition-all hover:shadow-glow">
                  Dashboard
                </button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <button className="text-text-secondary hover:text-brand-primary font-semibold px-4 py-2.5 rounded-lg transition-colors">
                    Sign In
                  </button>
                </Link>
                <Link href="/register">
                  <button className="bg-brand-primary hover:bg-brand-primary-dark text-bg-primary font-semibold px-6 py-2.5 rounded-lg transition-all hover:shadow-glow">
                    Get Started
                  </button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-text-primary"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-bg-secondary border-t border-bg-tertiary">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <a
              href="#features"
              className="text-text-secondary hover:text-brand-primary py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#security"
              className="text-text-secondary hover:text-brand-primary py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Security
            </a>
            <a
              href="#download"
              className="text-text-secondary hover:text-brand-primary py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Download
            </a>
            <a
              href="#faq"
              className="text-text-secondary hover:text-brand-primary py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              FAQ
            </a>

            {user ? (
              <Link href="/dashboard">
                <button className="bg-brand-primary hover:bg-brand-primary-dark text-bg-primary font-semibold px-6 py-3 rounded-lg w-full">
                  Dashboard
                </button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <button className="border-2 border-bg-tertiary hover:border-brand-primary text-text-primary font-semibold px-6 py-3 rounded-lg w-full transition-colors">
                    Sign In
                  </button>
                </Link>
                <Link href="/register">
                  <button className="bg-brand-primary hover:bg-brand-primary-dark text-bg-primary font-semibold px-6 py-3 rounded-lg w-full">
                    Get Started
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
