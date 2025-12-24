/**
 * App Branding Configuration
 * Single source of truth for all branding, naming, and identity
 */

export const branding = {
  // App Identity
  name: {
    full: 'Tethvault',                    // Full app name
    short: 'Tethvault',                   // Short name for limited space (home screen, etc.)
    legal: 'Tethvault Inc.',              // Legal entity name
    copyright: '© 2024 Tethvault Inc.',   // Copyright notice
  },

  // Descriptions
  description: {
    short: 'Secure cryptocurrency vault',  // Short tagline
    long: 'Your secure vault for digital assets. Store, manage, and grow your cryptocurrency portfolio with confidence.',
    seo: 'Secure cryptocurrency vault for Bitcoin, Ethereum, and digital assets. Self-custodial wallet with bank-grade security, staking, and DeFi access.',
  },

  // URLs & Routing
  urls: {
    base: 'https://tethvault.com',   // Base URL - configured at build time
    startUrl: '/dashboard',
    scope: '/',
  },

  // Logo Configuration
  logo: {
    src: '/icons/brand/icon-192.png',  // Path to logo image
    size: 32,                          // Logo size in pixels
    alt: 'Tethvault Logo',             // Alt text for logo
  },

  // Theme Colors (Vault-themed: deep blue/purple with gold accents)
  colors: {
    primary: '#6366f1',              // Indigo - trust & security
    primaryDark: '#4f46e5',          // Darker indigo
    primaryLight: '#818cf8',         // Lighter indigo
    background: '#0f0f1a',           // Deep dark background
    backgroundSecondary: '#1a1a2e',  // Card/panel background
    text: '#f1f5f9',                 // Primary text
    textSecondary: '#94a3b8',        // Secondary text
    accent: '#f59e0b',               // Gold accent for vault theme
  },

  // Company/Contact Info
  company: {
    name: 'Tethvault Inc.',
    email: 'support@tethvault.com',
    website: 'https://tethvault.com',
    address: '123 Vault Street, Digital City, DC 12345',
  },

  // Social Media
  social: {
    twitter: '@tethvault',
    github: 'tethvault',
    discord: 'tethvault',
    telegram: '@tethvault',
  },

  // App Metadata
  metadata: {
    version: '1.0.0',
    author: 'Tethvault Team',
    keywords: ['crypto', 'vault', 'wallet', 'bitcoin', 'ethereum', 'blockchain', 'cryptocurrency', 'defi', 'security'],
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
      badge: 'Trusted by 500K+ Users',
      headline: 'Your Digital Assets, Secured in the Vault',
      highlightedText: 'Secured in the Vault', // Part of headline to highlight with gradient
      subheadline: 'Bank-grade security meets crypto freedom. Store, stake, and grow your portfolio with the most secure self-custodial vault.',
      primaryCTA: 'Open Your Vault',
      secondaryCTA: 'See How It Works',
    },

    stats: {
      users: '500K+',
      rating: '4.9/5',
      supportedChains: '50+',
      supportedTokens: '10,000+',
    },

    features: [
      {
        icon: 'Vault',
        title: 'Vault-Grade Security',
        description: 'Your crypto locked down like Fort Knox. Multi-signature protection, hardware wallet support, and military-grade encryption.',
      },
      {
        icon: 'Shield',
        title: 'Self-Custodial',
        description: 'Your keys, your coins. We never have access to your funds. True ownership and complete control.',
      },
      {
        icon: 'Network',
        title: 'Multi-Chain Vault',
        description: 'One vault for all your assets. Support for 50+ blockchains and 10,000+ tokens including BTC, ETH, SOL, and more.',
      },
      {
        icon: 'TrendingUp',
        title: 'Grow Your Wealth',
        description: 'Stake, earn, and invest directly from your vault. Access DeFi, staking pools, and yield opportunities.',
      },
    ],

    showcaseFeatures: [
      {
        title: 'Secure Staking Vaults',
        description: 'Lock your assets in secure staking vaults and earn passive income. From flexible options to high-yield fixed terms.',
        features: [
          'Up to 38% APY on select assets',
          'New User Welcome Vault: 19% APY',
          'BTC & ETH premium vaults',
          'Flexible & fixed-term options',
          'Auto-compound rewards',
        ],
        badge: 'High Yield',
        highlight: true,
      },
      {
        title: 'Instant Swaps',
        description: 'Trade directly from your vault. We scan 10+ DEXs to find you the best rates with zero hidden fees.',
        features: [
          'Best rates guaranteed',
          'Low slippage trading',
          'Zero platform fees',
          'Instant execution',
          'Price protection alerts',
        ],
      },
      {
        title: 'Copy Trading Vault',
        description: 'Mirror top-performing traders automatically. Your vault follows proven strategies while you maintain full custody.',
        features: [
          'Follow elite traders (top 1%)',
          'Real-time copy execution',
          'Transparent performance metrics',
          'Risk management controls',
          'Performance-based fees only',
        ],
        badge: 'New Feature',
        highlight: true,
      },
    ],

    security: {
      badge: 'Vault-Grade Protection',
      headline: 'Built Like a Fortress',
      subheadline: 'Your assets are protected by multiple layers of security. From biometric locks to multi-signature vaults, we\'ve engineered the most secure crypto storage solution.',
      features: [
        {
          icon: 'Lock',
          title: 'Multi-Signature Vaults',
          description: 'Optional multi-sig protection requiring multiple approvals for transactions.',
        },
        {
          icon: 'Fingerprint',
          title: 'Biometric Locks',
          description: 'Face ID, Touch ID, and fingerprint authentication for instant secure access.',
        },
        {
          icon: 'Shield',
          title: 'Hardware Wallet Support',
          description: 'Connect Ledger and Trezor for maximum security cold storage integration.',
        },
        {
          icon: 'FileCheck',
          title: 'Audited & Verified',
          description: 'Regular security audits by CertiK, SlowMist, and Trail of Bits.',
        },
      ],
      certifications: [
        'SOC 2 Type II Certified',
        'AES-256 Encryption',
        'Quarterly Security Audits',
        'Bug Bounty Program',
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
        name: 'Desktop Vault',
        description: 'Mac, Windows, Linux',
        badge: 'Desktop',
      },
    ],

    faq: [
      {
        question: 'What makes Tethvault different from other wallets?',
        answer: 'Tethvault is built with vault-grade security from the ground up. Unlike typical wallets, we offer multi-signature protection, hardware wallet integration, and advanced security features typically found in institutional custody solutions - but you remain in full control.',
      },
      {
        question: 'Is Tethvault free to use?',
        answer: 'Yes! Tethvault is completely free to download and use. There are no subscription fees or hidden charges. You only pay standard blockchain network fees when sending transactions.',
      },
      {
        question: 'Do you have access to my funds?',
        answer: 'Never. Tethvault is fully self-custodial. Your private keys are encrypted and stored only on your device. We cannot access, freeze, or move your funds under any circumstances.',
      },
      {
        question: 'How do I recover my vault if I lose my device?',
        answer: 'When you create your vault, you\'ll receive a 12 or 24-word recovery phrase. This phrase can restore your entire vault on any device. Store it securely offline - anyone with this phrase has full access to your funds.',
      },
      {
        question: 'Can I use Tethvault with my hardware wallet?',
        answer: 'Yes! Tethvault supports Ledger and Trezor hardware wallets. You can connect your hardware wallet for maximum security while still enjoying Tethvault\'s interface and features.',
      },
      {
        question: 'Which cryptocurrencies does Tethvault support?',
        answer: 'Tethvault supports 50+ blockchains and 10,000+ tokens including Bitcoin, Ethereum, Solana, Polygon, Avalanche, BSC, Arbitrum, Optimism, and many more. We regularly add support for new chains.',
      },
      {
        question: 'How secure is the staking feature?',
        answer: 'Staking through Tethvault is non-custodial. Your staked assets remain in your control through smart contracts. We partner only with audited, reputable staking providers and protocols.',
      },
      {
        question: 'Do I need KYC verification?',
        answer: 'No. Tethvault believes in privacy and decentralization. You can create and use your vault without providing any personal information or identity verification.',
      },
    ],

    finalCTA: {
      headline: 'Open Your Tethvault Today',
      subheadline: 'Join 500,000+ users protecting their digital wealth with vault-grade security. Get started in under 60 seconds.',
      primaryCTA: 'Open Your Vault',
    },
  },

  // Download Links
  download: {
    ios: '#',
    android: '#',
    chrome: '#',
    firefox: '#',
    desktop: '#',
  },

  // Email Configuration
  email: {
    // Email-specific colors (vault theme)
    colors: {
      primary: '#6366f1',              // Primary button color (indigo)
      primaryHover: '#4f46e5',         // Primary button hover
      secondary: '#f3f4f6',            // Secondary button background
      secondaryText: '#1f2937',        // Secondary button text
      success: '#10b981',              // Success states (green)
      successBg: '#ecfdf5',            // Success background
      warning: '#f59e0b',              // Warning states (amber)
      warningBg: '#fef3c7',            // Warning background
      error: '#ef4444',                // Error states (red)
      errorBg: '#fef2f2',              // Error background
      info: '#3b82f6',                 // Info states (blue)
      infoBg: '#eff6ff',               // Info background
      text: '#111827',                 // Primary text color
      textSecondary: '#6b7280',        // Secondary text color
      textMuted: '#9ca3af',            // Muted text color
      border: '#e5e7eb',               // Border color
      background: '#ffffff',           // Email background
      accent: '#f59e0b',               // Gold accent
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
      vault: '/vault',
    },
    // Email content
    content: {
      teamName: 'The Tethvault Team',
      supportMessage: 'Your vault, your rules. Need help? Our security team is available 24/7.',
      signature: 'Secure regards',
      tagline: 'Protecting your digital wealth',
    },
    // Email logo (full URL for emails)
    logo: {
      url: 'https://tethvault.com/icons/brand/icon-192.png',
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
