import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ShieldCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/context/authcontext";

// Schemas
const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});

const registerSchema = z
  .object({
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Minimum 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, register } = useAuth();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  // 🔹 Email Login
  async function onLogin(data: z.infer<typeof loginSchema>) {
    try {
      setIsLoading(true);
      await signIn(data.email, data.password);
      setLocation("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Login failed");
    } finally {
      setIsLoading(false);
    }
  }

  // 🔹 Email Register
  async function onRegister(data: z.infer<typeof registerSchema>) {
    try {
      setIsLoading(true);
      await register(data.email, data.password);
      setLocation("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Registration failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-6 pt-24">
        <Card className="w-full max-w-md border-border/50 shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Welcome to ZK-ID
            </CardTitle>
            <CardDescription>
              Securely manage your decentralized identity
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              {/* LOGIN */}
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form
                    onSubmit={loginForm.handleSubmit(onLogin)}
                    className="space-y-4"
                  >
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      )}
                      Sign In
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              {/* REGISTER */}
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form
                    onSubmit={registerForm.handleSubmit(onRegister)}
                    className="space-y-4"
                  >
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      )}
                      Create Account
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Local demo auth is enabled for end-to-end testing.
            </p>
          </CardContent>

          <CardFooter className="text-center text-sm text-muted-foreground">
            By continuing, you agree to our Terms & Privacy Policy.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
