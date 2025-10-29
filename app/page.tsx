"use client";
import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe2, Mic, Sparkles } from "lucide-react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string };
function Button({ className = "", ...props }: ButtonProps) {
  return (
    <button
      className={
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
        className
      }
      {...props}
    />
  );
}
function Card({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={"rounded-xl border bg-white/5 " + className} {...props} />;
}
function CardContent({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={"p-4 " + className} {...props} />;
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { className?: string };
const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className = "", ...props }, ref) => (
  <input
    ref={ref}
    className={
      "w-full rounded-md border bg-white px-3 py-2 text-base md:text-sm text-black focus:outline-none focus-visible:ring-2 " +
      className
    }
    {...props}
  />
));
Input.displayName = "Input";

// ===== Utilities =====
function calcProgress(elapsed: number, totalMs: number) {
  const ratio = Math.min(1, Math.max(0, elapsed / Math.max(1, totalMs)));
  return Math.floor(ratio * 100);
}
function composePreviewDocument(bodyInnerHtml: string) {
  const safe = bodyInnerHtml || "<main><h1>New Website</h1><p>Preview is empty.</p></main>";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><style>html{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}*{box-sizing:border-box}body{margin:0;padding:24px;background:#0b0b0b;color:#f1f1f1}</style></head><body>${safe}</body></html>`;
}
function validateEmail(email: string) {
  return /.+@.+\..+/.test(email);
}
function suggestSubdomainFromIdea(idea: string) {
  const slug =
    idea.toLowerCase().split(" ")[0].replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 20) ||
    "your-site";
  return `${slug}.siteplus.app`;
}

export default function Page() {
  const [idea, setIdea] = useState("");
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<"idle" | "generating" | "done">("idle");
  const [previewSrcDoc, setPreviewSrcDoc] = useState<string>("");
  const previewRef = useRef<HTMLDivElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Voice
  const startVoice = () => {
    const w: any = window as any;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) {
      alert("Voice input is not supported in this browser.");
      return;
    }
    if (recognizing) return;
    const rec = new Ctor();
    recognitionRef.current = rec;
    rec.lang = navigator.language?.startsWith("ru") ? "ru-RU" : "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onstart = () => setRecognizing(true);
    rec.onend = () => setRecognizing(false);
    rec.onerror = () => setRecognizing(false);
    rec.onresult = (e: any) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        text += res[0].transcript;
      }
      setIdea((prev) => text.trim() || prev);
    };
    rec.start();
  };
  const stopVoice = () => recognitionRef.current?.stop?.();

  // Progress animation
  useEffect(() => {
    if (stage !== "generating") return;
    setProgress(0);
    const totalMs = 1000;
    const start = performance.now();
    let raf = 0 as number;
    const tick = (t: number) => {
      const elapsed = t - start;
      setProgress(calcProgress(elapsed, totalMs));
      if (elapsed < totalMs) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stage]);

  // Focus email when preview is ready
  useEffect(() => {
    if (stage === "done") {
      const id = setTimeout(() => emailInputRef.current?.focus({ preventScroll: true } as any), 60);
      return () => clearTimeout(id);
    }
  }, [stage]);

  // Demo HTML for blurred preview
  function generateBlurredDemoHTML(subject: string) {
    const title = subject?.trim() ? subject : "Your Next Website";
    return `
      <main style='max-width:960px;margin:0 auto;padding:32px;font-family:System,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#e5e7eb;background:#0a0a0a;'>
        <section style='border-radius:20px;padding:28px;background:linear-gradient(135deg,#1e293b,#0f172a);color:#fff;text-align:center;'>
          <h1 style='margin:0 0 8px;font-size:36px;line-height:1.1;'>${title}</h1>
          <p style='margin:0;opacity:.9'>Preview layout · Dark theme · Responsive</p>
        </section>
      </main>`;
  }

  // --- server notifications (минимальные payload'ы)
  async function notifyTelegram(kind: "idea" | "email", payload: Record<string, any>) {
    const res = await fetch("/api/notify-telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, ...payload }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }

  // Send email as a second step (full submission)
  async function submitEmail() {
    const ok = validateEmail(email);
    setEmailErr(ok ? null : "Enter a valid email");
    if (!ok) return;
    try {
      setSending(true);
      await notifyTelegram("email", { idea, email });
      alert("Thanks! We’ve recorded your request. You’ll get an invite by email.");
    } catch (e) {
      console.error(e);
      alert("Could not send right now. Please try again later.");
    } finally {
      setSending(false);
    }
  }

  const handleGenerate = () => {
    if (!idea.trim()) return;
    // 1-я заявка: только описание
    notifyTelegram("idea", { idea }).catch((e) => console.warn("notify idea failed", e));

    setStage("generating");
    setTimeout(() => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    const html = composePreviewDocument(generateBlurredDemoHTML(idea));
    setTimeout(() => {
      setPreviewSrcDoc(html);
      setStage("done");
    }, 1000);
  };

  const Background = useMemo(() => {
    return (
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-black" />
        <motion.div
          className="absolute w-[640px] h-[640px] bg-white/5 rounded-full blur-3xl top-[40%] left-1/2 -translate-x-1/2"
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.25, 0.1] }}
          transition={{ duration: 18, repeat: Infinity }}
        />
      </div>
    );
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans antialiased selection:bg-white/20 selection:text-black">
      {Background}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-black/70 border-b border-white/10">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-white text-black grid place-items-center">
              <Globe2 className="size-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">SitePlus</span>
          </div>
          <span className="text-sm text-white/70">Beta</span>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-3xl px-4">
        <section className="py-16 lg:py-24 flex flex-col items-center text-center">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-5xl lg:text-7xl font-extrabold leading-tight tracking-tight"
          >
            Build Your Website in 1 Second
          </motion.h1>
          <p className="mt-4 text-lg lg:text-xl text-white/85 max-w-2xl">
            Prototype your idea instantly — safe, transparent, and easy.
          </p>

          <div className="mt-8 w-full grid grid-cols-1 gap-4">
            <label htmlFor="idea" className="text-left text-sm lg:text-base text-white/85">
              Write your idea in a few words
            </label>
            <div className="relative">
              <Input
                id="idea"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder='Example: "Online flower shop" or "Fitness coach landing"'
                className="h-16 rounded-2xl bg-white text-black placeholder:text-black/50 border-0 shadow-sm focus-visible:ring-4 focus-visible:ring-white/60 text-base"
              />
              <button
                type="button"
                onClick={recognizing ? stopVoice : startVoice}
                className={`absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-2 rounded-xl px-3 py-3 focus:outline-none focus-visible:ring-4 ${recognizing ? "bg-red-500 text-white" : "bg-black/90 text-white hover:bg-black"}`}
                aria-label={recognizing ? "Stop recording" : "Start voice input"}
              >
                <Mic className="size-5" />
                <span className="text-xs hidden md:inline">{recognizing ? "Recording…" : "Voice"}</span>
              </button>
            </div>
            <Button
              onClick={handleGenerate}
              className="h-14 rounded-2xl bg-white text-black hover:bg-white/90 px-8 mx-auto text-base font-semibold focus-visible:ring-4 focus-visible:ring-white/50"
            >
              <Sparkles className="mr-2 size-5" /> Generate Website
            </Button>
          </div>

          <div ref={previewRef} className="mt-12 w-full">
            <Card className="rounded-3xl border-white/10 bg-neutral-900/70 backdrop-blur-md">
              <CardContent className="p-6 lg:p-8">
                <AnimatePresence mode="wait">
                  {stage === "done" && (
                    <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <div className="relative rounded-2xl border border-white/10 overflow-hidden">
                        <div className="pointer-events-none">
                          <iframe
                            title="Preview"
                            className="w-full h-[520px] bg-neutral-900 filter blur-md scale-[1.01]"
                            sandbox="allow-same-origin"
                            srcDoc={previewSrcDoc}
                          />
                        </div>
                        <div className="absolute inset-0 grid place-items-center">
                          <div className="max-w-md w-[92%] rounded-2xl backdrop-blur-2xl bg-white/90 text-black border border-white/20 p-6 text-left shadow-2xl">
                            <h3 className="text-2xl font-bold mb-2 text-center text-black">
                              Your site is being prepared
                            </h3>
                            <p className="text-sm text-black/80 mb-3 text-center">
                              Enter your email to get access info.
                            </p>
                            <div className="text-xs text-black/70 mb-2 text-center">
                              Domain:{" "}
                              <span className="font-semibold text-black">
                                {suggestSubdomainFromIdea(idea)}
                              </span>
                            </div>
                            <Input
                              ref={emailInputRef}
                              type="email"
                              inputMode="email"
                              enterKeyHint="send"
                              autoComplete="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="you@example.com"
                              className="h-12 rounded-xl bg-white text-black placeholder:text-black/60 border border-black/10 text-base"
                            />
                            {emailErr && (
                              <div className="text-red-500 text-xs mt-1 text-center">
                                {emailErr}
                              </div>
                            )}
                            <Button
                              onClick={submitEmail}
                              disabled={sending}
                              className="h-12 rounded-xl bg-black text-white hover:bg-black/90 disabled:opacity-60 disabled:cursor-not-allowed w-full mt-3"
                            >
                              {sending ? "Sending…" : "Send Access Info"}
                            </Button>
                            <div className="text-[11px] text-black/60 mt-2 text-center">
                              No spam — we’ll only send essential access information.
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="mt-12 border-t border-white/10 bg-black/80">
        <div className="mx-auto max-w-3xl px-4 py-7 text-sm text-white/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>© 2025 SitePlus</span>
          <span className="text-center sm:text-right">Beta • Transparent • Privacy First</span>
        </div>
      </footer>
    </div>
  );
}
