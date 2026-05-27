import { Link } from 'react-router-dom';
import { Code2, Share2, Globe } from 'lucide-react';
import Logo from '../ui/Logo';

const footerLinks = {
  Platform: [
    { label: 'How It Works', to: '/#how-it-works' },
    { label: 'Pricing', to: '/#pricing' },
    { label: 'Projects', to: '/projects' },
  ],
  Company: [
    { label: 'About', to: '/' },
    { label: 'Talent', to: '/talent' },
    { label: 'Contact', to: '/' },
  ],
  Legal: [
    { label: 'Privacy', to: '/' },
    { label: 'Terms', to: '/' },
    { label: 'Escrow Policy', to: '/' },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <Logo size={32} />
              <div>
                <span className="font-heading text-text font-semibold">Suruthi Vijaya R</span>
                <span className="block text-xs text-muted font-sans">Global Talent Network</span>
              </div>
            </div>
            <p className="text-sm text-muted max-w-xs">
              AI-powered global freelance marketplace connecting talent with opportunity worldwide.
            </p>
            <div className="flex gap-3 mt-4">
              {[Code2, Share2, Globe].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="p-2 rounded-full bg-surface border border-border text-muted hover:text-primary hover:border-primary transition-colors"
                  aria-label="Social link"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-heading font-semibold text-text mb-3 text-sm uppercase tracking-wider">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-muted hover:text-primary transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 pt-6 border-t border-border text-center text-sm text-muted">
          © {new Date().getFullYear()} Suruthi Vijaya R. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
