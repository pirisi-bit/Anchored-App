import { Link } from "wouter";
import { useAnchors } from "@/lib/anchors-context";
import { Button } from "@/components/ui/button";
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
import { Plus, Trash2, User, ChevronRight } from "lucide-react";

export default function SettingsPage() {
  const { clearAll } = useAnchors();

  return (
    <div className="min-h-[100dvh] flex flex-col max-w-md mx-auto pb-24 px-4 pt-8">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
      </header>

      <div className="flex flex-col gap-8">
        {/* Profile Section */}
        <section className="bg-card rounded-3xl p-6 shadow-sm border flex items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-primary/10">
            <AvatarFallback className="bg-primary/5 text-primary text-xl font-bold"><User className="w-6 h-6" /></AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-bold text-xl">My Account</h2>
            <p className="text-muted-foreground text-sm">Local Device Storage</p>
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
                  This action cannot be undone. This will permanently delete your account
                  and remove your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="sm:justify-start gap-3">
                <AlertDialogCancel className="rounded-full flex-1">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={clearAll} className="rounded-full flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>

        <div className="text-center mt-12">
          <p className="text-sm font-medium text-muted-foreground">Anchored v1.0</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Stored securely on device.</p>
        </div>
      </div>
    </div>
  );
}
