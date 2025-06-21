import { motion } from 'framer-motion';
import { ArrowRight, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { TechScanButton } from './TechScanButton';

export function TechScanHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Sample Reports', href: '#reports' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'About', href: '#about' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-brand-white/95 backdrop-blur-sm border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <motion.img 
            src="/Tesch_Scan_IQ_Logo_Transparent.png" 
            alt="TechScan IQ" 
            className="h-12 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            onClick={() => window.location.href = '/'}
          />
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <motion.a
                key={item.label}
                href={item.href}
                className="font-space font-medium text-brand-black hover:text-brand-teal transition-colors"
                whileHover={{ y: -2 }}
              >
                {item.label}
              </motion.a>
            ))}
            <TechScanButton icon={<ArrowRight className="h-4 w-4" />}>
              Start Intelligence Scan
            </TechScanButton>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden mt-4 pb-4 space-y-4"
          >
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="block font-space font-medium text-brand-black hover:text-brand-teal transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <TechScanButton className="w-full" icon={<ArrowRight className="h-4 w-4" />}>
              Start Intelligence Scan
            </TechScanButton>
          </motion.div>
        )}
      </nav>
    </header>
  );
}