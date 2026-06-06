import { Link } from "wouter";
import { Anchor, Shield, FileText, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-[100dvh] flex flex-col font-sans text-foreground">
      {/* 1. Nav/Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between z-10 relative max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-foreground" data-testid="link-home">
          <Anchor className="w-6 h-6 text-primary" strokeWidth={2.5} />
          <span className="font-bold text-lg tracking-tight">Anchored</span>
        </div>
      </header>

      {/* 2. Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center pt-16 pb-24 px-6 relative z-0">
        <div className="max-w-md mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-foreground animate-hero-title">
            Remember<br />
            <span className="text-primary italic font-serif">Everything.</span>
          </h1>
          
          <p className="text-lg text-muted-foreground leading-relaxed animate-hero-subtitle">
            The peaceful way to document your reality. Create proof that important daily actions were completed.
          </p>

          <div className="pt-4 animate-hero-cta w-full">
            <Link href="/onboarding" className="block w-full">
              <Button size="lg" className="rounded-full px-8 text-lg h-14 w-full shadow-lg transition-transform hover:-translate-y-1" data-testid="button-hero-start">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* 3. Feature Cards Section - Mobile optimized */}
      <section className="py-16 px-4 relative z-10 bg-white/40 border-y border-border/50">
        <div className="max-w-md mx-auto flex flex-col gap-4">
          
          {/* Card 1 */}
          <div className="bg-brand-sky/10 p-6 rounded-3xl flex items-start gap-4 shadow-sm border border-black/5 animate-card-1">
            <div className="w-10 h-10 shrink-0 bg-white rounded-2xl flex items-center justify-center shadow-sm text-brand-sky">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">Rock Solid</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Timestamps you can trust. Once it's anchored, it's proof.</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-brand-yellow/10 p-6 rounded-3xl flex items-start gap-4 shadow-sm border border-black/5 animate-card-2">
            <div className="w-10 h-10 shrink-0 bg-white rounded-2xl flex items-center justify-center shadow-sm text-yellow-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">Peace of Mind</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Stop wondering if you turned off the stove or took medication.</p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-brand-lavender/10 p-6 rounded-3xl flex items-start gap-4 shadow-sm border border-black/5 animate-card-3">
            <div className="w-10 h-10 shrink-0 bg-white rounded-2xl flex items-center justify-center shadow-sm text-brand-lavender">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">Yours Only</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Your data stays on your device. Private by design.</p>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
