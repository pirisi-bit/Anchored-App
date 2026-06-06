import { useAnchors } from "@/lib/anchors-context";
import { ProofCard } from "@/components/ProofCard";
import { format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";

export default function ProofPage() {
  const { proofs, anchors, loading } = useAnchors();

  // Group proofs by dateKey, sort descending
  const groupedProofs = proofs.reduce((acc, proof) => {
    if (!acc[proof.dateKey]) {
      acc[proof.dateKey] = [];
    }
    acc[proof.dateKey].push(proof);
    return acc;
  }, {} as Record<string, typeof proofs>);

  const sortedDates = Object.keys(groupedProofs).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-[100dvh] flex flex-col max-w-md mx-auto pb-36 px-4 pt-8">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Your Proof</h1>
        <p className="text-muted-foreground mt-1">Timeline of completed anchors.</p>
      </header>

      {loading ? (
        <div className="flex justify-center py-20 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : proofs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <div className="w-24 h-24 mb-6 rounded-full bg-muted flex items-center justify-center border-4 border-background shadow-inner">
            <span className="text-4xl text-muted-foreground/30">✓</span>
          </div>
          <p className="font-medium text-lg text-foreground">No proof yet.</p>
          <p className="max-w-[250px]">Start verifying your anchors on the Dashboard.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-border">
          {sortedDates.map(dateKey => {
            const date = parseISO(dateKey);
            const dateProofs = groupedProofs[dateKey].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            
            return (
              <div key={dateKey} className="relative">
                <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm py-2 mb-4">
                  <h2 className="font-bold text-lg bg-secondary/50 text-secondary-foreground inline-block px-3 py-1 rounded-lg">
                    {format(date, "EEEE, MMMM d, yyyy")}
                  </h2>
                </div>
                <div className="flex flex-col gap-4">
                  {dateProofs.map(proof => {
                    const anchor = anchors.find(a => a.id === proof.anchorId);
                    return <ProofCard key={proof.id} proof={proof} anchor={anchor} />;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
