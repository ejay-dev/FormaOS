import { Building2, Stethoscope, Baby, HeartHandshake, CheckCircle2 } from "lucide-react";
import { applyIndustryPack } from "@/app/app/actions/onboarding";

export function IndustrySelector() {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
      data-testid="industry-pack-selector"
    >
      {/* 1. NDIS CARD */}
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/10 p-6 shadow-sm transition-all hover:border-white/10 hover:shadow-md">
        <div>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-300">
                <Building2 className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-100">NDIS Provider</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Compliance framework for National Disability Insurance Scheme providers.
            </p>
        </div>
        <form action={async () => {
            "use server";
            await applyIndustryPack("ndis");
        }}>
            <button
              type="submit"
              data-testid="apply-pack-ndis"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 py-3 text-xs font-bold text-slate-100 transition-colors hover:bg-white/10"
            >
                <CheckCircle2 className="h-4 w-4 text-slate-400" />
                APPLY PACK
            </button>
        </form>
      </div>

      {/* 2. HEALTHCARE CARD */}
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/10 p-6 shadow-sm transition-all hover:border-white/10 hover:shadow-md">
        <div>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10 text-blue-600">
                <Stethoscope className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-100">GP / Medical</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
                RACGP Standards for general practices and medical centers.
            </p>
        </div>
        <form action={async () => {
            "use server";
            await applyIndustryPack("healthcare");
        }}>
            <button
              type="submit"
              data-testid="apply-pack-healthcare"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 py-3 text-xs font-bold text-slate-100 transition-colors hover:bg-white/10"
            >
                <CheckCircle2 className="h-4 w-4 text-slate-400" />
                APPLY PACK
            </button>
        </form>
      </div>

      {/* 3. CHILDCARE CARD */}
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/10 p-6 shadow-sm transition-all hover:border-white/10 hover:shadow-md">
        <div>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/10 text-amber-300">
                <Baby className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-100">Childcare</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
                National Quality Framework (NQF) for early childhood education.
            </p>
        </div>
        <form action={async () => {
            "use server";
            await applyIndustryPack("childcare");
        }}>
            <button
              type="submit"
              data-testid="apply-pack-childcare"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 py-3 text-xs font-bold text-slate-100 transition-colors hover:bg-white/10"
            >
                <CheckCircle2 className="h-4 w-4 text-slate-400" />
                APPLY PACK
            </button>
        </form>
      </div>

      {/* 4. AGED CARE CARD */}
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/10 p-6 shadow-sm transition-all hover:border-white/10 hover:shadow-md">
        <div>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <HeartHandshake className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-100">Aged Care</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Aged Care Quality Standards for residential facilities.
            </p>
        </div>
        <form action={async () => {
            "use server";
            await applyIndustryPack("aged_care");
        }}>
            <button
              type="submit"
              data-testid="apply-pack-aged-care"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 py-3 text-xs font-bold text-slate-100 transition-colors hover:bg-white/10"
            >
                <CheckCircle2 className="h-4 w-4 text-slate-400" />
                APPLY PACK
            </button>
        </form>
      </div>
    </div>
  );
}
