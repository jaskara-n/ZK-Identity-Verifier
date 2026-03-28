import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { useAuth } from "@/context/authcontext";


export function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/">
          <span className="flex items-center gap-2 font-heading font-bold text-xl tracking-tight hover:opacity-80 transition-opacity">
            <div className="bg-primary/20 p-2 rounded-lg">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <span>ZK-ID</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link href="/"><span className="hover:text-foreground transition-colors">Home</span></Link>
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#technology" className="hover:text-foreground transition-colors">Technology</a>
          <Link href="/dashboard"><span className="hover:text-foreground transition-colors">Demo Hub</span></Link>
          <Link href="/demo/verifier"><span className="hover:text-foreground transition-colors">Verifier</span></Link>
          <Link href="/demo/user"><span className="hover:text-foreground transition-colors">User Flow</span></Link>
        </div>

        {/* <div className="flex items-center gap-4">
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
        </div> */}


         <div className="flex items-center gap-4">
      {user ? (
        <>
        <Button
          size="sm"
          className="bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200"
          onClick={signOut}
        >
          Logout
        </Button>
          {/* Profile Avatar */}
          <Link href="/profile">
            <div className="w-8 h-8 rounded-full cursor-pointer border-2 border-gray-300 grid place-items-center text-xs font-semibold">
              {(user.displayName || user.email).slice(0, 1).toUpperCase()}
            </div>
          </Link>
          </>
      ) : (
        <>
          <Link href="/auth">
            <Button variant="ghost" size="sm" className="hidden sm:flex">
              Sign In
            </Button>
          </Link>
          <Link href="/auth?mode=register">
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
            >
              Get Verified
            </Button>
          </Link>
        </>
      )}
    </div>




      </div>
    </nav>
  );
}
