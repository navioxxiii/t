'use client'

import { Twitter, Github, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { branding } from '@/config/branding'
import Image from 'next/image'

export function Footer() {
  const { name, description, social, company } = branding

  return (
    <footer className="bg-bg-secondary border-t border-bg-tertiary pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-brand-primary rounded-lg flex items-center justify-center">
                <Image
                  src={branding.logo.src}
                  alt={branding.name.short}
                  width={branding.logo.size}
                  height={branding.logo.size}
                  className="object-contain"
                />
              </div>
              <span className="text-text-primary font-bold text-xl">{name.short}</span>
            </div>
            <p className="text-text-secondary mb-4">{description.short}</p>
            <div className="flex gap-4">
              <a
                href={`https://twitter.com/${social.twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-secondary hover:text-brand-primary transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href={`https://github.com/${social.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-secondary hover:text-brand-primary transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href={`https://discord.gg/${social.discord}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-secondary hover:text-brand-primary transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-text-primary font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="text-text-secondary hover:text-brand-primary transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#security" className="text-text-secondary hover:text-brand-primary transition-colors">
                  Security
                </a>
              </li>
              <li>
                <Link href="/dashboard" className="text-text-secondary hover:text-brand-primary transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <a href="#download" className="text-text-secondary hover:text-brand-primary transition-colors">
                  Download
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-text-primary font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a href="#faq" className="text-text-secondary hover:text-brand-primary transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="text-text-secondary hover:text-brand-primary transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-text-secondary hover:text-brand-primary transition-colors">
                  Support
                </a>
              </li>
              <li>
                <a href="#" className="text-text-secondary hover:text-brand-primary transition-colors">
                  Blog
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-text-primary font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-text-secondary hover:text-brand-primary transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="text-text-secondary hover:text-brand-primary transition-colors">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="text-text-secondary hover:text-brand-primary transition-colors">
                  Press Kit
                </a>
              </li>
              <li>
                <a href={`mailto:${company.email}`} className="text-text-secondary hover:text-brand-primary transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-bg-tertiary pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-text-tertiary text-sm">
            © {new Date().getFullYear()} {name.legal}. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-text-tertiary hover:text-brand-primary transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-text-tertiary hover:text-brand-primary transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-text-tertiary hover:text-brand-primary transition-colors">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
