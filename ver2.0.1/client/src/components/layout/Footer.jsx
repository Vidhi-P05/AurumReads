import { Link } from 'react-router-dom';
import { BookOpen, Facebook, Twitter, Instagram, Youtube, Mail } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Discover: [
      { name: 'Recommendations', path: '/recommendations' },
      { name: 'New Releases', path: '/search?newRelease=true' },
      { name: 'Bestsellers', path: '/search?bestseller=true' },
      { name: 'Genres', path: '/genres' },
      { name: 'Authors', path: '/authors' },
    ],
    Community: [
      { name: 'Reading Lists', path: '/lists' },
      { name: 'Reviews', path: '/reviews' },
      { name: 'Discussions', path: '/discussions' },
      { name: 'Events', path: '/events' },
      { name: 'Blog', path: '/blog' },
    ],
    Account: [
      { name: 'My Profile', path: '/profile' },
      { name: 'Wishlist', path: '/wishlist' },
      { name: 'Reading History', path: '/profile/history' },
      { name: 'Settings', path: '/profile/settings' },
      { name: 'Help Center', path: '/help' },
    ],
    Company: [
      { name: 'About Us', path: '/about' },
      { name: 'Careers', path: '/careers' },
      { name: 'Press', path: '/press' },
      { name: 'Contact', path: '/contact' },
      { name: 'Privacy Policy', path: '/privacy' },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
    { icon: Youtube, href: 'https://youtube.com', label: 'YouTube' },
    { icon: Mail, href: 'mailto:contact@aurumreads.com', label: 'Email' },
  ];

  return (
    <footer className="bg-primary text-white">
      <div className="container-custom px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <BookOpen className="h-8 w-8 text-accent" />
              <span className="text-2xl font-display font-bold">
                Aurum<span className="text-accent">Reads</span>
              </span>
            </Link>
            <p className="text-navy-100 mb-6 max-w-md">
              Discover your next favorite book with AI-powered recommendations, 
              track your reading journey, and connect with a community of book lovers.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-navy-800 hover:bg-accent rounded-lg transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-display font-bold text-lg mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className="text-navy-100 hover:text-accent transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-navy-800" />

        {/* Bottom Footer */}
        <div className="py-6 flex flex-col md:flex-row justify-between items-center">
          <div className="text-navy-100 text-sm mb-4 md:mb-0">
            © {currentYear} AurumReads. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm">
            <Link to="/terms" className="text-navy-100 hover:text-accent transition-colors">
              Terms of Service
            </Link>
            <Link to="/privacy" className="text-navy-100 hover:text-accent transition-colors">
              Privacy Policy
            </Link>
            <Link to="/cookies" className="text-navy-100 hover:text-accent transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>

        {/* Newsletter */}
        <div className="bg-navy-800 rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-display font-bold text-xl mb-2">
                Stay Updated
              </h4>
              <p className="text-navy-100">
                Subscribe to our newsletter for book recommendations and updates.
              </p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="Your email address"
                className="input-primary flex-1 bg-white text-gray-900"
              />
              <button className="btn-primary whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;