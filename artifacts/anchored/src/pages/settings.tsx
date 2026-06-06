import { useState } from "react";
import { Link } from "wouter";
import { useAnchors } from "@/lib/anchors-context";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, User, ChevronRight, LogOut, KeyRound } from "lucide-react";

export default function SettingsPage() {
  const { clearAll } = useAnchors();
  const { user, signOut, updatePassword, verifyPassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const hasPasswordLogin =
    user?.identities?.some((i) => i.provider === "email") ??
    (user?.app_metadata?.providers as string[] | undefined)?.includes("email") ??
    false;

  const handleClearAll = async () => {
    try {
      await clearAll();
      toast.success("All data cleared.");
    } catch (e) {
      toast.error("Could not clear data. Please try again.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !password || !confirm) {
      toast.error("Please fill in all password fields.");
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
      const verifyResult = await verifyPassword(currentPassword);
      if (verifyResult.error) {
        toast.error("Your current password is incorrect.");
        return;
      }
      const { error } = await updatePassword(password);
      if (error) {
        toast.error(error);
      } else {
        toast.success("Password updated.");
        setCurrentPassword("");
        setPassword("");
        setConfirm("");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (e) {
      toast.error("Could not sign out. Please try again.");
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col max-w-md mx-auto pb-36 px-4 pt-8">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
      </header>

      <div className="flex flex-col gap-8">
        {/* Profile Section */}
        <section className="bg-card rounded-3xl p-6 shadow-sm border flex items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-primary/10">
            <AvatarFallback className="bg-primary/5 text-primary text-xl font-bold"><User className="w-6 h-6" /></AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h2 className="font-bold text-xl">My Account</h2>
            <p className="text-muted-foreground text-sm truncate" data-testid="text-user-email">
              {user?.email ?? "Signed in"}
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider px-2">Anchors</h3>
          <Link href="/onboarding" className="bg-card rounded-2xl p-4 shadow-sm border flex items-center justify-between hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <span className="font-bold">Add more anchors</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider px-2">Password</h3>
          <div className="bg-card rounded-2xl p-5 shadow-sm border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <span className="font-bold">Change password</span>
            </div>
            {hasPasswordLogin ? (
              <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="settings-current-password">Current password</Label>
                  <Input
                    id="settings-current-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="h-12 rounded-2xl"
                    data-testid="input-current-password"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="settings-new-password">New password</Label>
                  <Input
                    id="settings-new-password"
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
                  <Label htmlFor="settings-confirm-password">Confirm password</Label>
                  <Input
                    id="settings-confirm-password"
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
                  className="w-full rounded-full h-12 font-bold mt-1"
                  disabled={submitting}
                  data-testid="btn-update-password"
                >
                  Update password
                </Button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground" data-testid="text-no-password">
                You signed in with Google, so there's no password to change. Manage your sign-in
                from your Google account.
              </p>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider px-2">Data</h3>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="bg-card rounded-2xl p-4 shadow-sm border flex items-center justify-between hover:bg-destructive/5 transition-colors w-full text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-destructive">Clear all data</span>
                </div>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl max-w-[calc(100vw-32px)]">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all of your
                  anchors and proofs from your account.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="sm:justify-start gap-3">
                <AlertDialogCancel className="rounded-full flex-1">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAll} className="rounded-full flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider px-2">Account</h3>
          <button
            onClick={handleSignOut}
            className="bg-card rounded-2xl p-4 shadow-sm border flex items-center justify-between hover:bg-muted/50 transition-colors w-full text-left"
            data-testid="btn-sign-out"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted text-foreground flex items-center justify-center">
                <LogOut className="w-5 h-5" />
              </div>
              <span className="font-bold">Sign out</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </section>

        <div className="text-center mt-12">
          <p className="text-sm font-medium text-muted-foreground">Anchored v1.0</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Synced securely to your account.</p>
        </div>
      </div>
    </div>
  );
}
