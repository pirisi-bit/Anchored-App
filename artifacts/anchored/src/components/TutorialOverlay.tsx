import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useT } from "@/lib/lang-context";

interface TutorialOverlayProps {
  open: boolean;
  onClose: () => void;
}

const STEP_COLORS = [
  { bg: "from-emerald-400 to-teal-500", card: "bg-emerald-50", dot: "bg-emerald-500" },
  { bg: "from-sky-400 to-blue-500", card: "bg-sky-50", dot: "bg-sky-500" },
  { bg: "from-amber-400 to-orange-500", card: "bg-amber-50", dot: "bg-amber-500" },
  { bg: "from-violet-400 to-purple-500", card: "bg-violet-50", dot: "bg-violet-500" },
  { bg: "from-rose-400 to-pink-500", card: "bg-rose-50", dot: "bg-rose-500" },
];

export function TutorialOverlay({ open, onClose }: TutorialOverlayProps) {
  const t = useT();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const steps = t.tutorial.steps;
  const colors = STEP_COLORS[step];
  const isLast = step === steps.length - 1;

  function goNext() {
    if (isLast) {
      onClose();
    } else {
      setDirection(1);
      setStep((s) => s + 1);
    }
  }

  function handleClose() {
    setStep(0);
    onClose();
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="tutorial-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Card */}
          <motion.div
            key="tutorial-card"
            className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
            initial={{ scale: 0.88, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            {/* Gradient header */}
            <div className={`bg-gradient-to-br ${colors.bg} px-8 pt-10 pb-8 flex flex-col items-center gap-3`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`emoji-${step}`}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  className="text-7xl select-none"
                >
                  {steps[step].emoji}
                </motion.div>
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <motion.h2
                  key={`title-${step}`}
                  className="text-white text-2xl font-bold text-center drop-shadow-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, delay: 0.05 }}
                >
                  {steps[step].title}
                </motion.h2>
              </AnimatePresence>
            </div>

            {/* Body */}
            <div className={`${colors.card} px-8 pt-6 pb-8`}>
              <AnimatePresence mode="wait">
                <motion.p
                  key={`body-${step}`}
                  className="text-gray-700 text-base text-center leading-relaxed min-h-[72px]"
                  initial={{ opacity: 0, x: direction > 0 ? 30 : -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction > 0 ? -30 : 30 }}
                  transition={{ duration: 0.22 }}
                >
                  {steps[step].body}
                </motion.p>
              </AnimatePresence>

              {/* Progress dots */}
              <div className="flex justify-center gap-2 mt-6 mb-6">
                {steps.map((_: unknown, i: number) => (
                  <button
                    key={i}
                    onClick={() => { setDirection(i > step ? 1 : -1); setStep(i); }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === step
                        ? `${colors.dot} w-6`
                        : "bg-gray-300 w-2"
                    }`}
                  />
                ))}
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {t.tutorial.skip}
                </button>
                <button
                  onClick={goNext}
                  className={`flex-[2] py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 bg-gradient-to-r ${colors.bg} shadow-md`}
                >
                  {isLast ? t.tutorial.done : t.tutorial.next}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
