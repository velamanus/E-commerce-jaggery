import { Link } from "react-router-dom";
import { CartDrawer } from "./CartDrawer";
import logo from "@/assets/logo.jpg";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border animate-fade-in">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 hover-lift">
          <img src={logo} alt="शुद्ध देसी गुड़" className="h-12 w-12 rounded-full object-cover" />
          <div>
            <h1 className="text-lg font-heading font-bold text-foreground leading-tight">शुद्ध देसी गुड़</h1>
            <p className="text-xs text-muted-foreground">Organic Jaggery</p>
          </div>
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Home
          </Link>
          <a href="#products" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Products
          </a>
          <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            About
          </a>
          <CartDrawer />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
