import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Activity } from "lucide-react";

export function Navbar() {
  const [location] = useLocation();

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/">
          <a className="flex items-center gap-2 font-heading font-bold text-xl tracking-tight hover:opacity-80 transition-opacity">
            <div className="bg-primary/20 p-2 rounded-lg">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <span>ZK-ID</span>
          </a>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link href="/"><a className="hover:text-foreground transition-colors">Home</a></Link>
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#technology" className="hover:text-foreground transition-colors">Technology</a>
          <Link href="/dashboard"><a className="hover:text-foreground transition-colors">Dashboard</a></Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/auth">
            <Button variant="ghost" size="sm" className="hidden sm:flex">
              Sign In
            </Button>
          </Link>
          <Link href="/auth?mode=register">
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
              Get Verified
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
