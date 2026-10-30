import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Mail, Lock, User, ArrowRight, Eye, EyeOff, Wallet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) toast.error(error.message);
    setGoogleLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) return toast.error("Please enter your email");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset link sent to your email!");
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!email || !password) return toast.error("Please fill all fields");
    if (mode === "signup" && !displayName.trim()) return toast.error("Please enter your name");

    setLoading(true);
    if (mode === "signup") {
      const { error } = await signUp(email, password, displayName.trim());
      if (error) toast.error(error.message);
      else toast.success("Account created! You're signed in.");
    } else {
      const { error } = await signIn(email, password);
      if (error) toast.error(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8 sm:px-6">
      {/* Animated background blobs */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-mesh" />
      <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute -right-20 top-40 h-72 w-72 rounded-full bg-accent/20 blur-3xl animate-blob" style={{ animationDelay: "2s" }} />
      <div className="pointer-events-none absolute bottom-10 left-1/3 h-72 w-72 rounded-full bg-chart-2/20 blur-3xl animate-blob" style={{ animationDelay: "4s" }} />

      <div className="relative z-10 grid w-full max-w-5xl items-center gap-8 lg:grid-cols-2">
        {/* Branding side - hidden on mobile */}
        <div className="hidden animate-fade-in flex-col gap-6 px-4 lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
              <Wallet className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-heading text-2xl font-bold">TrackVault</span>
          </div>
          <h2 className="font-heading text-5xl font-bold leading-tight">
            Your money,<br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              beautifully tracked.
            </span>
          </h2>
          <p className="max-w-md text-base text-muted-foreground">
            Track every rupee, dollar or euro. See where your money goes with stunning charts and instant insights.
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            {["📊 Smart stats", "💸 Dues tracking", "🌍 50+ currencies", "✨ Modern design"].map(t => (
              <span key={t} className="rounded-full border border-border bg-card/60 px-4 py-2 text-sm font-medium backdrop-blur">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Form card */}
        <div className="animate-slide-up">
          <div className="rounded-3xl border border-border/50 bg-card/80 p-6 shadow-elevated backdrop-blur-xl sm:p-8">
            {/* Mobile branding */}
            <div className="mb-6 flex flex-col items-center lg:hidden">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
                <Sparkles className="h-7 w-7 text-primary-foreground" />
              </div>
              <span className="font-heading text-xl font-bold">TrackVault</span>
            </div>

            {mode === "forgot" ? (
              <>
                <h1 className="mb-1 text-center font-heading text-2xl font-bold sm:text-3xl">Reset Password</h1>
                <p className="mb-6 text-center text-sm text-muted-foreground">
                  Enter your email and we'll send a reset link
                </p>
                <div className="group relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleForgotPassword()}
                    className="h-12 rounded-xl border-border/60 bg-background/60 pl-11 transition-smooth focus-visible:ring-2 focus-visible:ring-primary/40"
                  />
                </div>
                <Button
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="mt-4 h-12 w-full rounded-xl bg-gradient-primary text-base font-semibold shadow-glow transition-bounce hover:shadow-elevated active:scale-[0.98]"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
                <p className="mt-5 text-center text-sm text-muted-foreground">
                  Remember your password?{" "}
                  <button onClick={() => setMode("login")} className="font-semibold text-primary hover:underline">
                    Sign in
                  </button>
                </p>
              </>
            ) : (
              <>
                <h1 className="mb-1 text-center font-heading text-2xl font-bold sm:text-3xl">
                  {mode === "login" ? "Welcome back" : "Create account"}
                </h1>
                <p className="mb-6 text-center text-sm text-muted-foreground">
                  {mode === "login" ? "Sign in to continue tracking" : "Start your journey to better finances"}
                </p>

                <div className="space-y-3">
                  {mode === "signup" && (
                    <div className="group relative animate-slide-up">
                      <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <Input
                        placeholder="Your name"
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        className="h-12 rounded-xl border-border/60 bg-background/60 pl-11 transition-smooth focus-visible:ring-2 focus-visible:ring-primary/40"
                      />
                    </div>
                  )}
                  <div className="group relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="h-12 rounded-xl border-border/60 bg-background/60 pl-11 transition-smooth focus-visible:ring-2 focus-visible:ring-primary/40"
                    />
                  </div>
                  <div className="group relative">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleSubmit()}
                      className="h-12 rounded-xl border-border/60 bg-background/60 pl-11 pr-11 transition-smooth focus-visible:ring-2 focus-visible:ring-primary/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {mode === "login" && (
                  <button
                    onClick={() => setMode("forgot")}
                    className="mt-2 block text-xs font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="group mt-5 h-12 w-full rounded-xl bg-gradient-primary text-base font-semibold shadow-glow transition-bounce hover:shadow-elevated active:scale-[0.98]"
                >
                  {loading ? "Please wait..." : (
                    <>
                      {mode === "login" ? "Sign in" : "Create account"}
                      <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>

                <div className="mt-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-medium text-muted-foreground">or continue with</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <Button
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="mt-4 h-12 w-full rounded-xl border-border/60 bg-background/60 text-base font-semibold transition-smooth hover:bg-background active:scale-[0.98]"
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {googleLoading ? "Please wait..." : "Google"}
                </Button>

                <p className="mt-5 text-center text-sm text-muted-foreground">
                  {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                  <button
                    onClick={() => setMode(mode === "login" ? "signup" : "login")}
                    className="font-semibold text-primary hover:underline"
                  >
                    {mode === "login" ? "Sign up" : "Sign in"}
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
