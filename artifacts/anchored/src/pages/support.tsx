import { Link } from "wouter";
import { Anchor, ArrowLeft, Mail } from "lucide-react";
import { SUPPORT_EMAIL } from "@/lib/contact";

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-3xl p-6 shadow-sm border border-black/5 space-y-2">
      <h3 className="text-lg font-bold text-foreground">{q}</h3>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

export default function Support() {
  return (
    <div className="min-h-[100dvh] font-sans text-foreground">
      <header className="w-full px-6 py-4 flex items-center justify-between max-w-3xl mx-auto">
        <Link
          href="/"
          className="flex items-center gap-2 text-foreground"
          data-testid="link-home"
        >
          <Anchor className="w-6 h-6 text-primary" strokeWidth={2.5} />
          <span className="font-bold text-lg tracking-tight">Anchored</span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Home
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 pb-24 pt-6">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">Support</h1>
        <p className="text-muted-foreground mb-10 leading-relaxed">
          We're here to help you stay anchored. Most questions are answered below — if you
          need anything else, just email us.
        </p>

        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="flex items-center gap-4 bg-primary/10 rounded-3xl p-6 mb-10 hover:bg-primary/15 transition-colors"
        >
          <div className="w-12 h-12 shrink-0 bg-white rounded-2xl flex items-center justify-center shadow-sm text-primary">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-foreground">Email us</p>
            <p className="text-sm text-primary font-medium">{SUPPORT_EMAIL}</p>
          </div>
        </a>

        <div className="space-y-4">
          <Faq q="What is Anchored?">
            <p>
              Anchored helps you build trustworthy, dated proof that your important daily
              routines — locking the door, taking medication, paying a bill, pet care — were
              actually done, so you can stop second-guessing yourself.
            </p>
          </Faq>

          <Faq q="How do I verify an anchor?">
            <p>
              Open Today and tap an anchor. You can self-confirm with a tap, snap a photo, or
              attach a receipt. Each confirmation is saved with the date to your private
              timeline.
            </p>
          </Faq>

          <Faq q="Why does Anchored ask for camera and photo access?">
            <p>
              Only so you can capture a photo or attach a receipt as proof. Anchored accesses
              the camera or your photos only when you choose to add proof — never in the
              background.
            </p>
          </Faq>

          <Faq q="How do I set a daily reminder?">
            <p>
              Go to Settings and turn on the daily reminder, then pick a time. Anchored sends
              one gentle nudge about anything you haven't confirmed yet.
            </p>
          </Faq>

          <Faq q="Is my data private?">
            <p>
              Yes. Everything is tied to your account and visible only to you. We don't sell
              your data or show ads. See our{" "}
              <Link
                href="/privacy"
                className="text-primary font-medium underline-offset-2 hover:underline"
              >
                Privacy Policy
              </Link>{" "}
              for details.
            </p>
          </Faq>

          <Faq q="How do I delete my data or account?">
            <p>
              To clear your anchors and proofs, open{" "}
              <strong className="text-foreground">Settings → Data → Clear all data</strong> in
              the app. To delete your entire account and email, email us at{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-primary font-medium underline-offset-2 hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>{" "}
              and we'll remove it.
            </p>
          </Faq>

          <Faq q="I forgot my password.">
            <p>
              On the sign-in screen, tap “Forgot password?” and follow the link we email you to
              set a new one.
            </p>
          </Faq>
        </div>

        <div className="text-center mt-12">
          <p className="text-sm font-medium text-muted-foreground">Anchored v1.0</p>
        </div>
      </main>
    </div>
  );
}
