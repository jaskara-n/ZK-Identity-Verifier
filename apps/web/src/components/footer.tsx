import { Shield, Github, Twitter, Disc } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-heading font-bold text-xl">
              <Shield className="w-5 h-5 text-primary" />
              <span>ZK-ID</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Decentralized identity verification ecosystem balancing privacy with security using Zero-Knowledge Proofs.
            </p>
          </div>
          
          <div>
            <h4 className="font-heading font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Verifiable Credentials</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Cross-Chain Bridge</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Developer SDK</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Whitepaper</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">GitHub</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4">Connect</h4>
            <div className="flex gap-4">
              <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-primary/20 hover:text-primary transition-colors">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-primary/20 hover:text-primary transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-primary/20 hover:text-primary transition-colors">
                <Disc className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>© 2026 ZK-ID. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-foreground">Privacy Policy</a>
            <a href="#" className="hover:text-foreground">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
