import React from "react";
import { Anchor, Shield, FileText, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-[100dvh] flex flex-col font-sans text-foreground">
      {/* 1. Nav/Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between z-10 relative max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-foreground" data-testid="link-home">
          <Anchor className="w-6 h-6 text-foreground" strokeWidth={2.5} />
          <span className="font-bold text-lg tracking-tight">Anchored</span>
        </div>
        <Button data-testid="button-nav-start" variant="default" className="font-medium rounded-full px-6 transition-transform hover:scale-105 active:scale-95">
          Start Anchoring
        </Button>
      </header>

      {/* 2. Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center pt-24 pb-32 px-6 relative z-0">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight leading-none text-foreground animate-hero-title">
            Remember<br />
            <span className="text-primary italic font-serif">Everything.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-hero-subtitle">
            The peaceful way to document your reality. Never lose a receipt, a note, or a moment again.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 animate-hero-cta">
            <Button size="lg" className="rounded-full px-8 text-base h-14 w-full sm:w-auto shadow-sm transition-transform hover:-translate-y-1" data-testid="button-hero-start">
              Start Anchoring
            </Button>
            <Button size="lg" variant="ghost" className="rounded-full px-8 text-base h-14 w-full sm:w-auto hover:bg-secondary/50 transition-colors" data-testid="button-hero-how-it-works">
              See how it works
            </Button>
          </div>
        </div>
      </main>

      {/* 3. Feature Cards Section */}
      <section className="py-24 px-6 relative z-10 bg-white/40 border-y border-border/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: Blue/Teal */}
          <div className="bg-[#E0F2FE] p-10 rounded-3xl flex flex-col gap-6 shadow-sm border border-black/5 hover:shadow-md transition-shadow group animate-card-1" data-testid="card-feature-rock-solid">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-[#0369A1] group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-[#0C4A6E] mb-3">Rock Solid</h3>
              <p className="text-[#0284C7] leading-relaxed">
                Timestamps you can trust. Once it's anchored, it's there for good. Unbreakable proof.
              </p>
            </div>
          </div>

          {/* Card 2: Warm Yellow/Amber */}
          <div className="bg-[#FEF3C7] p-10 rounded-3xl flex flex-col gap-6 shadow-sm border border-black/5 hover:shadow-md transition-shadow group animate-card-2" data-testid="card-feature-organized">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-[#B45309] group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-[#78350F] mb-3">Instantly Organized</h3>
              <p className="text-[#92400E] leading-relaxed">
                Color-coded, neatly filed, and ready when you need it. Clarity over chaos.
              </p>
            </div>
          </div>

          {/* Card 3: Lavender/Purple */}
          <div className="bg-[#F3E8FF] p-10 rounded-3xl flex flex-col gap-6 shadow-sm border border-black/5 hover:shadow-md transition-shadow group animate-card-3" data-testid="card-feature-private">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-[#7E22CE] group-hover:scale-110 transition-transform">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-[#581C87] mb-3">Yours Only</h3>
              <p className="text-[#6B21A8] leading-relaxed">
                Private by design. Your records belong to you alone. We just keep them safe.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 4. CTA Section */}
      <section className="py-32 px-6 flex flex-col items-center justify-center text-center">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-8">
          Ready to secure your reality?
        </h2>
        <Button size="lg" className="rounded-full px-10 text-lg h-16 shadow-md transition-transform hover:scale-105 active:scale-95" data-testid="button-footer-start">
          Start Anchoring
        </Button>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 px-6 border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Anchor className="w-4 h-4" />
            <span className="font-semibold text-foreground">Anchored</span>
            <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <nav className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors" data-testid="link-footer-privacy">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors" data-testid="link-footer-terms">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors" data-testid="link-footer-contact">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
