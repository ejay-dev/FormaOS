import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ArrowRight, Sparkles } from "lucide-react";

export default async function LandingPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 🛡️ Smart Redirect: If logged in, go straight to the Dashboard
  if (user) {
    redirect("/app");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[hsl(var(--background))] p-6 text-center relative overflow-hidden">
      
      {/* 🌌 Premium Background Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-white to-transparent -z-10 rounded-full blur-3xl opacity-50" />
      <div className="absolute -top-[10%] -right-[10%] w-96 h-96 bg-signal-emerald/5 rounded-full blur-[100px] -z-10" />

      {/* 🚀 Logo Section */}
      <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="group relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-charcoal text-white shadow-command transition-all hover:scale-105 active:scale-95">
          <ShieldCheck className="h-10 w-10 transition-transform group-hover:rotate-12" />
          <div className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-signal-emerald border-4 border-white/10 status-active" />
        </div>
        
        <h1 className="text-6xl font-display font-black tracking-tighter text-charcoal mb-4">
          Forma<span className="text-slate-400">OS</span>
        </h1>
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 shadow-glass">
            <Sparkles className="h-3 w-3 text-signal-amber" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
                Enterprise Intelligence v2.0
            </span>
        </div>
      </div>

      {/* 📝 Content Section */}
      <div className="max-w-xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
        <p className="mb-12 text-lg text-slate-400 font-medium leading-relaxed tracking-tight">
          The professional operating system for modern compliance, 
          <span className="text-charcoal font-bold"> risk management</span>, and automated 
          <span className="text-charcoal font-bold"> governance intelligence</span>.
        </p>
        
        {/* 🔗 Action Grid */}
        <div className="flex flex-col gap-4 sm:flex-row justify-center items-center">
          <Link 
            href="/auth/signup" 
            className="group btn-primary px-10 py-5 text-base flex items-center gap-3 shadow-lift hover:shadow-command transition-all"
          >
            Deploy Instance
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          
          <Link 
            href="/auth/signin" 
            className="btn-secondary px-10 py-5 text-base shadow-glass hover:bg-[hsl(var(--card))]"
          >
            Access Terminal
          </Link>
        </div>
      </div>

      {/* 📊 Trust Indicator Footer */}
      <div className="absolute bottom-12 left-0 right-0 animate-in fade-in duration-1000 delay-500">
        <p className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-slate-400">
          Trusted by Global Security & Compliance Teams
        </p>
        <div className="mt-6 flex justify-center items-center gap-8 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
            {/* These represent placeholder client icons, keeping it minimal and pro */}
            <div className="h-4 w-24 bg-white/20 rounded-full" />
            <div className="h-4 w-20 bg-white/20 rounded-full" />
            <div className="h-4 w-28 bg-white/20 rounded-full" />
        </div>
      </div>
    </div>
  );
}
