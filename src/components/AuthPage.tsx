import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
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
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
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

  if (mode === "forgot") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10">
              <Lock className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="mb-1 text-center font-heading text-2xl font-bold">Reset Password</h1>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            Enter your email and we'll send you a reset link
          </p>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleForgotPassword()}
              className="rounded-xl pl-10 py-6"
            />
          </div>
          <Button
            onClick={handleForgotPassword}
            disabled={loading}
            className="mt-4 w-full rounded-xl py-6 text-base font-semibold"
          >
            {loading ? "Please wait..." : "Send Reset Link"}
          </Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Remember your password?{" "}
            <button onClick={() => setMode("login")} className="font-semibold text-primary hover:underline">
              Sign in
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="mb-1 text-center font-heading text-2xl font-bold">
          {mode === "login" ? "Welcome back! 👋" : "Create account"}
        </h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          {mode === "login" ? "Sign in to track your expenses" : "Start tracking your spending"}
        </p>

        <div className="space-y-3">
          {mode === "signup" && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Your name"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="rounded-xl pl-10 py-6"
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="rounded-xl pl-10 py-6"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              className="rounded-xl pl-10 pr-10 py-6"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {mode === "login" && (
          <button
            onClick={() => setMode("forgot")}
            className="mt-2 block text-xs text-primary hover:underline"
          >
            Forgot password?
          </button>
        )}

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-4 w-full rounded-xl py-6 text-base font-semibold"
        >
          {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
          <ArrowRight className="h-4 w-4" />
        </Button>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button
          variant="outline"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="mt-4 w-full rounded-xl py-6 text-base font-semibold"
        >
          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {googleLoading ? "Please wait..." : "Continue with Google"}
        </Button>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="font-semibold text-primary hover:underline"
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
