import Link from 'next/link';

const footerLinks = {
  platform: [
    { label: 'About Us', href: '#about' },
    { label: 'Services', href: '#services' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Contact', href: '#contact' },
  ],
  merchants: [
    { label: 'Register', href: '/register' },
    { label: 'Sign In', href: '/login' },
    { label: 'Pricing', href: '#services' },
    { label: 'FAQ', href: '#contact' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
  ],
};

export function LandingFooter() {
  return (
    <footer className="relative bg-[#060910] pt-20 pb-10">
      {/* Top separator */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8956c]/15 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#c8956c]">
                <span className="text-sm font-bold text-[#080b14]">M</span>
              </div>
              <span className="text-lg font-semibold tracking-tight text-[#f5f0eb]">
                Marketplace
              </span>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-[#5a554e]">
              Empowering local businesses with a modern marketplace platform.
              List, manage, and grow — all in one place.
            </p>
          </div>

          {/* Platform links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8a837a]">
              Platform
            </h4>
            <ul className="mt-5 space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-[#5a554e] transition-colors hover:text-[#c8956c]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Merchant links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8a837a]">
              Merchants
            </h4>
            <ul className="mt-5 space-y-3">
              {footerLinks.merchants.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#5a554e] transition-colors hover:text-[#c8956c]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8a837a]">
              Legal
            </h4>
            <ul className="mt-5 space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#5a554e] transition-colors hover:text-[#c8956c]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
          <p className="text-xs text-[#3d3a36]">
            &copy; {new Date().getFullYear()} Marketplace. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {['Twitter', 'LinkedIn', 'GitHub'].map((social) => (
              <a
                key={social}
                href="#"
                className="text-xs text-[#3d3a36] transition-colors hover:text-[#c8956c]"
              >
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
