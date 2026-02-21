import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ShieldCheck, User, CreditCard, Activity, CheckCircle, Clock, Copy, ExternalLink, Plus, Globe } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      
      <main className="container mx-auto px-6 pt-24 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold">Identity Dashboard</h1>
            <p className="text-muted-foreground">Manage your verifiable credentials and proofs.</p>
          </div>
          <div className="flex items-center gap-3">
             <Badge variant="outline" className="px-3 py-1 border-primary/20 text-primary bg-primary/5">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                Wallet Connected: 0x71C...9A2
             </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard 
            title="Identity Score" 
            value="98/100" 
            icon={<Activity className="w-5 h-5 text-primary" />}
            description="High trust level"
            color="text-primary"
          />
          <StatCard 
            title="Active Proofs" 
            value="12" 
            icon={<ShieldCheck className="w-5 h-5 text-accent" />}
            description="Across 4 chains"
            color="text-accent"
          />
           <StatCard 
            title="Verifications" 
            value="1,240" 
            icon={<CheckCircle className="w-5 h-5 text-green-500" />}
            description="Last 30 days"
            color="text-green-500"
          />
        </div>

        <Tabs defaultValue="credentials" className="space-y-6">
          <TabsList>
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
            <TabsTrigger value="proofs">Active Proofs</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
          </TabsList>

          <TabsContent value="credentials" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Citizenship Card */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <Card className="overflow-hidden border-border/50 hover:shadow-lg transition-shadow">
                  <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-heading">Government ID</CardTitle>
                      <CardDescription>Verified Citizenship</CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">Verified</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 mt-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Issuer</span>
                        <span className="font-medium">National Digital Registry</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Issued Date</span>
                        <span className="font-medium">Jan 12, 2025</span>
                      </div>
                      <div className="flex justify-between text-sm">
                         <span className="text-muted-foreground">Trust Level</span>
                         <div className="flex items-center gap-2">
                            <Progress value={100} className="w-20 h-2" />
                            <span className="font-medium">Tier 1</span>
                         </div>
                      </div>
                    </div>
                    <div className="mt-6 flex gap-3">
                      <Button size="sm" variant="outline" className="w-full">View Details</Button>
                      <Button size="sm" className="w-full bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">Generate Proof</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Age Verification Card */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
                <Card className="overflow-hidden border-border/50 hover:shadow-lg transition-shadow">
                  <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-heading">Age Verification</CardTitle>
                      <CardDescription>Over 18 Proof</CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">Verified</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 mt-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Issuer</span>
                        <span className="font-medium">ZK-ID Network</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Expires</span>
                        <span className="font-medium">Never</span>
                      </div>
                       <div className="flex justify-between text-sm">
                         <span className="text-muted-foreground">Zero Knowledge</span>
                         <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">true</span>
                      </div>
                    </div>
                    <div className="mt-6 flex gap-3">
                      <Button size="sm" variant="outline" className="w-full">View Details</Button>
                      <Button size="sm" className="w-full bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">Generate Proof</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Add New Card */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
                <Button variant="outline" className="w-full h-full min-h-[250px] border-dashed border-2 flex flex-col gap-4 hover:border-primary/50 hover:bg-primary/5 transition-all group">
                   <div className="w-16 h-16 rounded-full bg-muted group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                     <Plus className="w-8 h-8 text-muted-foreground group-hover:text-primary" />
                   </div>
                   <span className="text-lg font-medium text-muted-foreground group-hover:text-primary">Add New Credential</span>
                </Button>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="proofs">
             <Card>
               <CardHeader>
                 <CardTitle>Active Verification Sessions</CardTitle>
                 <CardDescription>Services currently accessing your zk-proofs.</CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 border rounded-lg bg-card/50">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Globe className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="font-medium">DeFi Exchange Protocol</p>
                            <p className="text-sm text-muted-foreground">Accessing: KYC Level 1 (ZK)</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <span className="text-sm text-muted-foreground flex items-center gap-1">
                             <Clock className="w-3 h-3" /> 2 mins ago
                           </span>
                           <Button size="sm" variant="destructive">Revoke</Button>
                        </div>
                      </div>
                    ))}
                 </div>
               </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, description, color }: any) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon}
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-3xl font-bold font-heading">{value}</span>
          <span className={`text-xs ${color}`}>{description}</span>
        </div>
      </CardContent>
    </Card>
  );
}
