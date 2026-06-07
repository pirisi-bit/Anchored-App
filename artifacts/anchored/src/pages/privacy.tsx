import { Link } from "wouter";
import { Anchor, ArrowLeft } from "lucide-react";
import { SUPPORT_EMAIL } from "@/lib/contact";

const LAST_UPDATED = "June 7, 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <div className="space-y-3 text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}

export default function Privacy() {
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
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated {LAST_UPDATED}</p>

        <div className="space-y-10">
          <Section title="The short version">
            <p>
              Anchored is built to give you peace of mind, not to harvest your data. Your
              proof is private to you. We don't sell your data, we don't show ads, and we
              don't track you across other apps or websites.
            </p>
          </Section>

          <Section title="What we collect">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">Account information.</strong> Your email
                address, used to create your account and sign you in. If you sign in with
                Google, we receive your email address and basic profile from Google.
              </li>
              <li>
                <strong className="text-foreground">Your content.</strong> The anchors
                (routines) you choose to track, your daily confirmations, and any photos or
                receipts you attach as proof.
              </li>
              <li>
                <strong className="text-foreground">Basic technical data.</strong> Standard
                information needed to operate the service securely, such as request logs.
              </li>
            </ul>
            <p>
              We do not collect advertising identifiers, and we do not use third-party
              tracking or analytics SDKs for advertising.
            </p>
          </Section>

          <Section title="How we use your information">
            <p>
              We use your information only to provide Anchored: to authenticate you, to store
              and display the proof you create, to send the daily reminder you opt into, and
              to keep the service secure. That's it.
            </p>
          </Section>

          <Section title="Camera & photos">
            <p>
              Anchored asks for camera and photo-library access only so you can capture a
              photo or attach a receipt as proof that you completed an anchor. We access these
              only when you tap to add proof. We never access your camera or photo library in
              the background.
            </p>
          </Section>

          <Section title="How your data is stored & shared">
            <p>
              Your account and data are hosted on Supabase, our authentication and database
              provider, which processes data solely to operate Anchored on our behalf. Files
              you attach are stored on our own server and referenced from your proof records.
            </p>
            <p>
              Every record is tied to your account and protected by row-level security, so it
              is visible only to you. We do not sell or rent your personal data, and we do not
              share it for advertising.
            </p>
          </Section>

          <Section title="Data security">
            <p>
              All data is encrypted in transit (HTTPS). Access to your records is restricted
              to your authenticated account.
            </p>
          </Section>

          <Section title="Your choices & deletion">
            <p>
              You can clear all of your anchors and proofs at any time from{" "}
              <strong className="text-foreground">Settings → Data → Clear all data</strong>{" "}
              inside the app. To request full deletion of your account and associated email,
              contact us at{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-primary font-medium underline-offset-2 hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>{" "}
              and we will remove it.
            </p>
          </Section>

          <Section title="Children">
            <p>
              Anchored is not directed at children under 13, and we do not knowingly collect
              personal information from them.
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p>
              If we make material changes, we'll update the date at the top of this page. Your
              continued use of Anchored means you accept the updated policy.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions about your privacy? Email us at{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-primary font-medium underline-offset-2 hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </Section>
        </div>
      </main>
    </div>
  );
}
