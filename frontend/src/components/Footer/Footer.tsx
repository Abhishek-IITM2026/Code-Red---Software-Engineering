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
          <a href="/about" className="hover:text-[var(--primary)] transition">About</a>
          <a href="/privacy" className="hover:text-[var(--primary)] transition">Privacy</a>
          <a href="/terms" className="hover:text-[var(--primary)] transition">Terms</a>
          <a href="/contact" className="hover:text-[var(--primary)] transition">Contact</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
