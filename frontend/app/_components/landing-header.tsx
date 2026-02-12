'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'About', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Contact', href: '#contact' },
];

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#080b14]/95 backdrop-blur-md shadow-lg shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-18 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#c8956c] transition-transform duration-300 group-hover:scale-105">
              <span className="text-sm font-bold text-[#080b14]">M</span>
            </div>
            <span className="text-lg font-semibold tracking-tight text-[#f5f0eb]">
              Marketplace
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-4 py-2 text-sm font-medium text-[#a8a096] transition-colors hover:bg-white/5 hover:text-[#f5f0eb]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden items-center gap-3 md:flex">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="rounded-lg bg-[#c8956c] px-5 py-2.5 text-sm font-semibold text-[#080b14] transition-all hover:bg-[#d4a67d] hover:shadow-lg hover:shadow-[#c8956c]/20"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-[#a8a096] transition-colors hover:text-[#f5f0eb]"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-[#c8956c] px-5 py-2.5 text-sm font-semibold text-[#080b14] transition-all hover:bg-[#d4a67d] hover:shadow-lg hover:shadow-[#c8956c]/20"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-[#a8a096] transition-colors hover:bg-white/5 hover:text-[#f5f0eb] md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`overflow-hidden transition-all duration-300 md:hidden ${
          mobileOpen ? 'max-h-80 border-t border-white/5' : 'max-h-0'
        }`}
      >
        <div className="bg-[#080b14]/98 backdrop-blur-md px-6 py-4 space-y-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-4 py-2.5 text-sm font-medium text-[#a8a096] transition-colors hover:bg-white/5 hover:text-[#f5f0eb]"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-3 border-t border-white/5 space-y-2">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="block w-full rounded-lg bg-[#c8956c] px-4 py-2.5 text-center text-sm font-semibold text-[#080b14]"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block w-full rounded-lg px-4 py-2.5 text-center text-sm font-medium text-[#a8a096]"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="block w-full rounded-lg bg-[#c8956c] px-4 py-2.5 text-center text-sm font-semibold text-[#080b14]"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
