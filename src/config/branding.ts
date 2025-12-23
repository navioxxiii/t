/**
 * App Branding Configuration
 * Single source of truth for all branding, naming, and identity
 */

export const branding = {
  // App Identity
  name: {
    full: 'Crypto Wallet',           // Full app name
    short: 'Wallet',                 // Short name for limited space (home screen, etc.)
    legal: 'Crypto Wallet Inc.',     // Legal entity name
    copyright: '© 2024 Crypto Wallet Inc.', // Copyright notice
  },

  // Descriptions
  description: {
    short: 'Centralized cryptocurrency wallet',  // Short tagline
    long: 'Secure and easy-to-use cryptocurrency wallet for managing your digital assets',
    seo: 'Manage Bitcoin, Ethereum, and other cryptocurrencies with our secure, centralized wallet. Send, receive, and swap crypto with ease.',
  },

  // URLs & Routing
  urls: {
    base: 'http://localhost:3000', // Base URL - configured at build time
    startUrl: '/dashboard',
    scope: '/',
  },

  // Logo Configuration
  logo: {
    src: '/icons/brand/icon-192.png',  // Path to logo image
    size: 32,                 // Logo size in pixels
    alt: 'Wallet Logo', // Alt text for logo
  },
  // Theme Colors (Match design system)
  colors: {
    primary: '#f0b90b',              // Gold - brand color
    primaryDark: '#c99400',          // Darker gold
    primaryLight: '#fcd535',         // Lighter gold
    background: '#0b0e11',           // Dark background
    backgroundSecondary: '#181a20',  // Card/panel background
    text: '#eaecef',                 // Primary text
    textSecondary: '#848e9c',        // Secondary text
  },

  // Company/Contact Info
  company: {
    name: 'Crypto Wallet Inc.',
    email: 'support@cryptowallet.com',
    website: 'https://cryptowallet.com',
    address: '123 Blockchain Street, Crypto City, CC 12345',
  },

  // Social Media (optional)
  social: {
    twitter: '@cryptowallet',
    github: 'cryptowallet',
    discord: 'cryptowallet',
  },

  // App Metadata
  metadata: {
    version: '1.0.0',
    author: 'Crypto Wallet Team',
    keywords: ['crypto', 'wallet', 'bitcoin', 'ethereum', 'blockchain', 'cryptocurrency'],
    category: 'finance',
    locale: 'en-US',
  },

  // PWA Configuration
  pwa: {
    orientation: 'portrait' as const,
    display: 'standalone' as const,
    categories: ['finance', 'utilities'] as const,
  },

  // Landing Page Content
  landing: {
    hero: {
      badge: 'Now available on iOS & Android',
      headline: 'Your Gateway to Digital Assets',
      highlightedText: 'Digital Assets', // Part of headline to highlight with gradient
      subheadline: 'Secure, simple, and powerful. Manage crypto with confidence on any device. Your keys, your crypto.',
      primaryCTA: 'Download Now',
      secondaryCTA: 'View Demo',
    },

    stats: {
      users: '500K+',
      rating: '4.8/5',
      supportedChains: '50+',
      supportedTokens: '10,000+',
    },

    features: [
      {
        icon: 'Shield',
        title: 'Bank-Level Security',
        description: 'Your keys, your crypto. Self-custodial wallet with military-grade encryption and biometric authentication.',
      },
      {
        icon: 'Zap',
        title: 'Lightning Fast',
        description: 'Send and receive crypto in seconds. No complicated processes, just tap and go.',
      },
      {
        icon: 'Network',
        title: 'Multi-Chain Support',
        description: 'Support for 50+ blockchains and 10,000+ tokens. ETH, BTC, SOL, and more in one place.',
      },
      {
        icon: 'Smartphone',
        title: 'Available Everywhere',
        description: 'iOS, Android, browser extension, and desktop app. Your wallet, anywhere you go.',
      },
    ],

    showcaseFeatures: [
      {
        title: 'Instant Token Swaps',
        description: 'Trade any token in seconds. We aggregate the best rates from top DEXs so you always get the best price.',
        features: [
          'Best rates from 10+ DEXs',
          'Zero hidden fees',
          'Instant execution',
          'Price impact warnings',
        ],
      },
      {
        title: 'Premium Earn Vaults',
        description: 'Earn up to 38% APY with fixed-term staking vaults. From flexible monthly yields to exclusive VIP programs.',
        features: [
          'Up to 38% APY guaranteed',
          'New User 19% Welcome Vault',
          'BTC & ETH high-yield products',
          'Limited-time Bull Rush 20.5%',
          'Obsidian Circle VIP (invite-only)',
        ],
        badge: 'Most Popular',
        highlight: true,
      },
      {
        title: 'Elite Copy Trading',
        description: 'Automatically copy top traders in real-time. Follow proven strategies and earn while you sleep.',
        features: [
          'Copy top 1% performers',
          'Live performance leaderboard',
          'One-click follow & auto-trade',
          'Risk-adjusted rankings',
          'Profit-sharing model (no upfront fees)',
        ],
        badge: 'New',
        highlight: true,
      },
    ],

    security: {
      badge: 'Bank-Grade Security',
      headline: 'Your Security is Our Priority',
      subheadline: 'We never have access to your funds. You control your private keys, always. Your crypto is secured with military-grade encryption.',
      features: [
        {
          icon: 'Lock',
          title: 'Self-Custodial',
          description: 'You own your private keys. We can\'t access your funds.',
        },
        {
          icon: 'Key',
          title: 'Biometric Authentication',
          description: 'Face ID and fingerprint unlock for quick, secure access.',
        },
        {
          icon: 'FileCheck',
          title: 'Audited & Open Source',
          description: 'Regularly audited by top security firms. Code available on GitHub.',
        },
      ],
      certifications: [
        'SOC 2 Type II',
        '256-bit Encryption',
        'Regular Audits',
      ],
    },

    platforms: [
      {
        icon: 'Apple',
        name: 'iOS App',
        description: 'iPhone & iPad',
        badge: 'App Store',
      },
      {
        icon: 'Smartphone',
        name: 'Android App',
        description: 'Google Play',
        badge: 'Google Play',
      },
      {
        icon: 'Globe',
        name: 'Browser Extension',
        description: 'Chrome, Firefox, Brave',
        badge: 'Extension',
      },
      {
        icon: 'Monitor',
        name: 'Desktop App',
        description: 'Mac, Windows, Linux',
        badge: 'Desktop',
      },
    ],

    faq: [
      {
        question: 'Is it free to use?',
        answer: 'Yes! Our wallet is completely free to download and use. We never charge for creating a wallet, sending, or receiving crypto. You only pay network gas fees, which go to the blockchain, not to us.',
      },
      {
        question: 'Do I need to verify my identity (KYC)?',
        answer: 'No. We believe in privacy and decentralization. You can create a wallet and start using it immediately without providing any personal information.',
      },
      {
        question: 'What if I lose my phone?',
        answer: 'Your wallet can be recovered using your 12-word recovery phrase. When you create a wallet, you\'ll receive this phrase. Keep it safe and private - anyone with access to it can access your funds.',
      },
      {
        question: 'How secure is my crypto?',
        answer: 'Very secure. Your private keys never leave your device, and we never have access to them. We use military-grade encryption, and the wallet has been audited by leading security firms.',
      },
      {
        question: 'Which networks and tokens are supported?',
        answer: 'We support 50+ blockchains including Ethereum, Bitcoin, Solana, Polygon, BSC, Avalanche, and more. You can store 10,000+ different tokens and NFTs.',
      },
      {
        question: 'Can I import my existing wallet?',
        answer: 'Yes! You can easily import any wallet using your 12-word or 24-word seed phrase. Your existing assets will appear immediately.',
      },
    ],

    finalCTA: {
      headline: 'Start Your Crypto Journey Today',
      subheadline: 'Join 500,000+ users securing their digital assets with confidence. Download now and get started in under 30 seconds.',
      primaryCTA: 'Download Now',
    },
  },

  // Download Links
  download: {
    ios: '#', // TODO: Add actual App Store link
    android: '#', // TODO: Add actual Google Play link
    chrome: '#', // TODO: Add Chrome extension link
    firefox: '#', // TODO: Add Firefox extension link
    desktop: '#', // TODO: Add desktop download link
  },

  // Email Configuration
  email: {
    // Email-specific colors
    colors: {
      primary: '#f59e0b',              // Primary button color
      primaryHover: '#d97706',         // Primary button hover
      secondary: '#f3f4f6',            // Secondary button background
      secondaryText: '#1f2937',        // Secondary button text
      success: '#22c55e',              // Success states (green)
      successBg: '#f0fdf4',           // Success background
      warning: '#fbbf24',              // Warning states (yellow)
      warningBg: '#fef3c7',           // Warning background
      error: '#f87171',                // Error states (red)
      errorBg: '#fef2f2',              // Error background
      info: '#0ea5e9',                 // Info states (blue)
      infoBg: '#f0f9ff',               // Info background
      text: '#374151',                 // Primary text color
      textSecondary: '#6b7280',        // Secondary text color
      textMuted: '#9ca3af',            // Muted text color
      border: '#e5e7eb',               // Border color
      background: '#ffffff',            // Email background
    },
    // Email URLs
    urls: {
      dashboard: '/dashboard',
      settings: '/settings',
      security: '/settings/security',
      kyc: '/settings/kyc',
      support: '/support/new',
      activity: '/activity',
      copyTrade: '/copy-trade',
      earn: '/earn',
    },
    // Email content
    content: {
      teamName: 'The Crypto Wallet Team',
      supportMessage: 'If you have any questions, our support team is here to help.',
      signature: 'Best regards',
    },
    // Email logo (full URL for emails)
    logo: {
      url: 'https://yourdomain.com/icons/brand/icon-192.png', // Full URL for email clients
      width: 60,
      height: 60,
    },
  },
} as const;

// Helper function to get full metadata for SEO
export function getMetadata(page?: {
  title?: string;
  description?: string;
  keywords?: string[];
}) {
  return {
    title: page?.title
      ? `${page.title} | ${branding.name.full}`
      : branding.name.full,
    description: page?.description || branding.description.short,
    keywords: [...branding.metadata.keywords, ...(page?.keywords || [])],
    author: branding.metadata.author,
    applicationName: branding.name.full,
  };
}
