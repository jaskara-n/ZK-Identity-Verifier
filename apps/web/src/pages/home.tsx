import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Zap, Globe, Fingerprint, RefreshCcw } from "lucide-react";
import { motion } from "framer-motion";
import heroBg from "@assets/generated_images/abstract_zk_proof_identity_background.png";
import { Link } from "wouter";
import { useAuth } from "@/context/authcontext";




export default function Home() {



  const { user } = useAuth();
  console.log(user?.email);





  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/95 to-background z-10" />
          <img 
            src={heroBg} 
            alt="Background" 
            className="w-full h-full object-cover opacity-40 scale-110"
          />
        </div>

        <div className="container relative z-10 mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="outline" className="mb-6 px-4 py-1 border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                v2.0 Now Live on Mainnet
              </Badge>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl md:text-7xl font-heading font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70"
            >
              Identity Verification <br />
              <span className="text-primary">Without Exposure</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Prove who you are without revealing what you know. Secure, cross-chain identity verification powered by Zero-Knowledge Proofs.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/auth">
                <Button size="lg" className="w-full sm:w-auto text-lg h-12 px-8 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">
                  Start Verification
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-12 px-8 backdrop-blur-sm bg-background/50 hover:bg-background/80">
                Read Whitepaper
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border/50 bg-secondary/20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-heading font-bold text-primary">67%</div>
              <p className="text-muted-foreground font-medium">Reduced Verification Cost</p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-heading font-bold text-primary">&lt; 2s</div>
              <p className="text-muted-foreground font-medium">Verification Time</p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-heading font-bold text-primary">10+</div>
              <p className="text-muted-foreground font-medium">Supported Chains</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Why Zero Knowledge?</h2>
            <p className="text-muted-foreground text-lg">
              Traditional identity systems are broken. We're rebuilding trust from the ground up using advanced cryptography.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Lock className="w-8 h-8 text-primary" />}
              title="Privacy Preserving"
              description="Prove attributes like age or citizenship without ever revealing your actual documents or data."
            />
            <FeatureCard 
              icon={<RefreshCcw className="w-8 h-8 text-primary" />}
              title="Cross-Chain Interoperability"
              description="Verify once, use everywhere. Your identity travels with you across Layer 1s and Layer 2s seamlessly."
            />
            <FeatureCard 
              icon={<Zap className="w-8 h-8 text-primary" />}
              title="Instant Verification"
              description="Say goodbye to manual reviews. Our zk-SNARK protocols verify credentials in milliseconds."
            />
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section id="technology" className="py-24 bg-card border-y border-border/50 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">Built on Advanced Primitives</h2>
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Fingerprint className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">zk-SNARKs & zk-STARKs</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      We utilize cutting-edge succinct non-interactive arguments of knowledge to generate proofs that are small and fast to verify on-chain.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Globe className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Decentralized Infrastructure</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      No single point of failure. Your identity data is encrypted and stored on decentralized storage (IPFS/Filecoin), controlled only by your private key.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              {/* Abstract decorative element */}
              <div className="aspect-square rounded-2xl bg-gradient-to-tr from-primary/20 to-accent/20 border border-primary/10 backdrop-blur-3xl p-8 flex items-center justify-center">
                <div className="grid grid-cols-2 gap-4 w-full h-full opacity-50">
                   <div className="bg-primary/20 rounded-lg animate-pulse" style={{ animationDelay: '0s' }} />
                   <div className="bg-accent/20 rounded-lg animate-pulse" style={{ animationDelay: '1s' }} />
                   <div className="bg-accent/20 rounded-lg animate-pulse" style={{ animationDelay: '2s' }} />
                   <div className="bg-primary/20 rounded-lg animate-pulse" style={{ animationDelay: '3s' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="bg-card/50 border-border/50 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 group">
      <CardContent className="p-8">
        <div className="mb-6 p-4 rounded-2xl bg-primary/5 group-hover:bg-primary/10 transition-colors w-fit">
          {icon}
        </div>
        <h3 className="text-xl font-bold mb-3 font-heading">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
