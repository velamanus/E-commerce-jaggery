const Footer = () => {
  return (
    <footer className="bg-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 text-primary-foreground">
          <div>
            <h3 className="text-lg font-heading font-bold mb-3">शुद्ध देसी गुड़</h3>
            <p className="text-sm opacity-80">Pure & Natural Organic Jaggery. Bringing traditional sweetness to modern tables.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><a href="#products" className="hover:opacity-100 transition-opacity">Products</a></li>
              <li><a href="#about" className="hover:opacity-100 transition-opacity">About Us</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Contact</h4>
            <p className="text-sm opacity-80">Email: info@shuddhdesigud.com</p>
            <p className="text-sm opacity-80 mt-1">Made with ❤️ in India</p>
          </div>
        </div>
        <div className="border-t border-primary-foreground/20 mt-8 pt-6 text-center">
          <p className="text-sm text-primary-foreground/60">© {new Date().getFullYear()} शुद्ध देसी गुड़. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
