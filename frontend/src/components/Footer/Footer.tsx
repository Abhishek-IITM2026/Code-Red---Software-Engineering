import { FiInfo, FiShield, FiFileText, FiMessageCircle } from 'react-icons/fi';

interface FooterProps {
  copyright?: string;
}

const Footer = ({ copyright = "" }: FooterProps) => {
  return (
    <footer className="bg-[var(--secondary)] text-[var(--text)] py-4 px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
        <p className="text-sm">
          {copyright || `© ${new Date().getFullYear()} Your App. All rights reserved.`}
        </p>
        <div className="flex gap-4 text-sm">
          <a href="/about" className="hover:text-[var(--primary)] transition flex items-center gap-1">
            <FiInfo className="w-4 h-4" />
            About
          </a>
          <a href="/privacy" className="hover:text-[var(--primary)] transition flex items-center gap-1">
            <FiShield className="w-4 h-4" />
            Privacy
          </a>
          <a href="/terms" className="hover:text-[var(--primary)] transition flex items-center gap-1">
            <FiFileText className="w-4 h-4" />
            Terms
          </a>
          <a href="/contact" className="hover:text-[var(--primary)] transition flex items-center gap-1">
            <FiMessageCircle className="w-4 h-4" />
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
