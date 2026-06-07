import { useState } from "react";
import { Link } from "wouter";
import { useAnchors } from "@/lib/anchors-context";
import { useAuth } from "@/lib/auth-context";
import { useLang, useT, Lang } from "@/lib/lang-context";
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
import { Plus, Trash2, User, ChevronRight, LogOut, KeyRound, Globe, HelpCircle, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { clearAll } = useAnchors();
  const { user, signOut, updatePassword, verifyPassword } = useAuth();
  const { lang, setLang } = useLang();
  const t = useT();

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
      toast.success(t.success.dataCleared);
    } catch {
      toast.error(t.errors.couldNotClear);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !password || !confirm) {
      toast.error(t.errors.fillPasswordFields);
      return;
    }
    if (password.length < 6) {
      toast.error(t.errors.passwordTooShort);
      return;
    }
    if (password !== confirm) {
      toast.error(t.errors.passwordsNoMatch);
      return;
    }
    setSubmitting(true);
    try {
      const verifyResult = await verifyPassword(currentPassword);
      if (verifyResult.error) {
        toast.error(t.errors.wrongPassword);
        return;
      }
      const { error } = await updatePassword(password);
      if (error) {
        toast.error(error);
      } else {
        toast.success(t.success.passwordUpdated);
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
    } catch {
      toast.error(t.errors.couldNotSignOut);
    }
  };

  const handleShowTutorial = () => {
    // Navigate to home then trigger tutorial overlay
    window.dispatchEvent(new Event("show-tutorial"));
    // Small delay so navigation completes if user is on settings
    setTimeout(() => {
      window.location.hash = "";
    }, 50);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col max-w-md mx-auto pb-36 px-4 pt-8">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">{t.settings.title}</h1>
      </header>

      <div className="flex flex-col gap-8">
        {/* Profile */}
        <section className="bg-card rounded-3xl p-6 shadow-sm border flex items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-primary/10">
            <AvatarFallback className="bg-primary/5 text-primary text-xl font-bold">
              <User className="w-6 h-6" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h2 className="font-bold text-xl">{t.settings.myAccount}</h2>
            <p className="text-muted-foreground text-sm truncate" data-testid="text-user-email">
              {user?.email ?? t.settings.signedIn}
            </p>
          </div>
        </section>

        {/* Language */}
        <section className="flex flex-col gap-2">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider px-2">
            {t.settings.languageSection}
          </h3>
          <div className="bg-card rounded-2xl p-4 shadow-sm border flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div className="flex gap-2 flex-1">
              {(["en", "es"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={cn(
                    "flex-1 py-2 rounded-full text-sm font-semibold border transition-colors",
                    lang === l
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-transparent hover:border-border"
                  )}
                  data-testid={`btn-lang-${l}`}
                >
                  {l === "en" ? "🇺🇸 English" : "🇨🇱 Español"}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Anchors */}
        <section className="flex flex-col gap-2">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider px-2">
            {t.settings.anchorsSection}
          </h3>
          <Link
            href="/onboarding"
            className="bg-card rounded-2xl p-4 shadow-sm border flex items-center justify-between hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <span className="font-bold">{t.settings.addMore}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
        </section>

        {/* Help */}
        <section className="flex flex-col gap-2">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider px-2">
            {t.settings.helpSection}
          </h3>
          <button
            onClick={handleShowTutorial}
            className="bg-card rounded-2xl p-4 shadow-sm border flex items-center justify-between hover:bg-muted/50 transition-colors w-full text-left"
            data-testid="btn-show-tutorial"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold block">{t.tutorial.triggerBtn}</span>
                <span className="text-xs text-muted-foreground">5-step intro to Anchored</span>
              </div>
            </div>
            <HelpCircle className="w-5 h-5 text-muted-foreground" />
          </button>
        </section>

        {/* Password */}
        <section className="flex flex-col gap-2">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider px-2">
            {t.settings.passwordSection}
          </h3>
          <div className="bg-card rounded-2xl p-5 shadow-sm border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <span className="font-bold">{t.settings.changePassword}</span>
            </div>
            {hasPasswordLogin ? (
              <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="settings-current-password">{t.settings.currentPassword}</Label>
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
                  <Label htmlFor="settings-new-password">{t.settings.newPassword}</Label>
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
                  <Label htmlFor="settings-confirm-password">{t.settings.confirmPassword}</Label>
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
                  {t.settings.updatePassword}
                </Button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground" data-testid="text-no-password">
                {t.settings.googleNoPassword}
              </p>
            )}
          </div>
        </section>

        {/* Data */}
        <section className="flex flex-col gap-2">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider px-2">
            {t.settings.dataSection}
          </h3>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="bg-card rounded-2xl p-4 shadow-sm border flex items-center justify-between hover:bg-destructive/5 transition-colors w-full text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-destructive">{t.settings.clearAll}</span>
                </div>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl max-w-[calc(100vw-32px)]">
              <AlertDialogHeader>
                <AlertDialogTitle>{t.settings.clearDialog.title}</AlertDialogTitle>
                <AlertDialogDescription>{t.settings.clearDialog.description}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="sm:justify-start gap-3">
                <AlertDialogCancel className="rounded-full flex-1">{t.settings.clearDialog.cancel}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearAll}
                  className="rounded-full flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t.settings.clearDialog.confirm}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>

        {/* Account */}
        <section className="flex flex-col gap-2">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider px-2">
            {t.settings.accountSection}
          </h3>
          <button
            onClick={handleSignOut}
            className="bg-card rounded-2xl p-4 shadow-sm border flex items-center justify-between hover:bg-muted/50 transition-colors w-full text-left"
            data-testid="btn-sign-out"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted text-foreground flex items-center justify-center">
                <LogOut className="w-5 h-5" />
              </div>
              <span className="font-bold">{t.settings.signOut}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </section>

        <div className="text-center mt-12">
          <p className="text-sm font-medium text-muted-foreground">{t.settings.version}</p>
          <p className="text-xs text-muted-foreground/60 mt-1">{t.settings.synced}</p>
        </div>
      </div>
    </div>
  );
}
