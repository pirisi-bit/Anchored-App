import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Fingerprint, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { updatePassword } = useAuth();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) {
        setReady(true);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setReady(true);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirm) {
      toast.error("Please enter and confirm your new password.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await updatePassword(password);
      if (error) {
        toast.error(error);
      } else {
        toast.success("Password updated. You're all set.");
        setLocation("/dashboard");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center max-w-md mx-auto px-6 py-12">
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-4">
          <Fingerprint className="w-8 h-8 text-primary" strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Set a new password</h1>
        <p className="text-muted-foreground mt-1 text-center">
          Choose a new password for your account.
        </p>
      </div>

      {!ready ? (
        <div className="flex flex-col items-center gap-4 text-center mt-4">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
          <p className="text-muted-foreground">
            Verifying your reset link. If this doesn't continue, request a new link from the login
            screen.
          </p>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => setLocation("/login")}
            data-testid="btn-back-to-login"
          >
            Back to login
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-2xl"
              data-testid="input-new-password"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-12 rounded-2xl"
              data-testid="input-confirm-password"
            />
          </div>

          <Button
            type="submit"
            className="w-full rounded-full h-14 text-lg font-bold shadow-lg mt-2"
            disabled={submitting}
            data-testid="btn-update-password"
          >
            Update password
          </Button>
        </form>
      )}
    </div>
  );
}
