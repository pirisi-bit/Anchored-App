import { Link, useLocation } from "wouter";
import { LayoutDashboard, Link2, Clock, Settings } from "lucide-react";
import { useT } from "@/lib/lang-context";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();
  const t = useT();

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: t.nav.home },
    { href: "/anchors",   icon: Link2,           label: t.nav.anchors },
    { href: "/proof",     icon: Clock,           label: t.nav.proof },
    { href: "/settings",  icon: Settings,        label: t.nav.settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = location === href;
          return (
            <Link key={href} href={href} className="flex flex-col items-center justify-center w-16 h-full gap-1" data-testid={`nav-${href.replace("/", "")}`}>
              <Icon className={cn("w-6 h-6 transition-colors", isActive ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-[10px] font-medium transition-colors", isActive ? "text-primary" : "text-muted-foreground")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
