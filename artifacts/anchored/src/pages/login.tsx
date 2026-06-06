import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Anchor } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Login() {
  const [, setLocation] = useLocation();
  const { user, loading, signUpWithEmail, signInWithEmail, signInWithGoogle, resetPassword } =
    useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      setLocation("/dashboard");
    }
  }, [loading, user, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password.");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error } = await signUpWithEmail(email, password);
        if (error) {
          toast.error(error);
        } else {
          toast.success("Account created! Check your email if confirmation is required.");
        }
      } else {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          toast.error(error);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error(error);
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Enter your email above, then tap “Forgot password?” again.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await resetPassword(email);
      if (error) {
        toast.error(error);
      } else {
        toast.success("Password reset link sent. Check your email.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center max-w-md mx-auto px-6 py-12">
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-4">
          <Anchor className="w-8 h-8 text-primary" strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-muted-foreground mt-1 text-center">
          {mode === "signup"
            ? "Start building proof you can trust."
            : "Sign in to access your anchors."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-2xl"
            data-testid="input-email"
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {mode === "signin" && (
              <button
                type="button"
                className="text-sm text-primary font-semibold hover:underline"
                onClick={handleForgotPassword}
                disabled={submitting}
                data-testid="btn-forgot-password"
              >
                Forgot password?
              </button>
            )}
          </div>
          <Input
            id="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-2xl"
            data-testid="input-password"
          />
        </div>

        <Button
          type="submit"
          className="w-full rounded-full h-14 text-lg font-bold shadow-lg mt-2"
          disabled={submitting}
          data-testid="btn-submit-auth"
        >
          {mode === "signup" ? "Create account" : "Sign in"}
        </Button>
      </form>

      <div className="flex items-center gap-3 w-full my-6">
        <div className="h-px bg-border flex-1" />
        <span className="text-sm text-muted-foreground">or</span>
        <div className="h-px bg-border flex-1" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full rounded-full h-14 text-base font-semibold gap-3 bg-card"
        onClick={handleGoogle}
        disabled={submitting}
        data-testid="btn-google"
      >
        <FcGoogle className="w-5 h-5" />
        Continue with Google
      </Button>

      <p className="text-sm text-muted-foreground mt-8">
        {mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
        <button
          type="button"
          className="text-primary font-semibold hover:underline"
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          data-testid="btn-toggle-mode"
        >
          {mode === "signup" ? "Sign in" : "Sign up"}
        </button>
      </p>
    </div>
  );
}
