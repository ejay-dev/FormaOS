import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation"; // 1. Added redirect import
import { ShieldCheck, CheckCircle2 } from "lucide-react";

// Force dynamic rendering - this page uses cookies() for Supabase client
export const dynamic = 'force-dynamic';

export default async function PublicFormPage({ 
  params,
  searchParams // 2. Added searchParams to check for success status
}: { 
  params: Promise<{ formId: string }>,
  searchParams: Promise<{ success?: string }>
}) {
  const supabase = await createSupabaseServerClient();
  const { formId } = await params;
  const { success } = await searchParams; // Await searchParams in Next.js 15

  // Fetch Form Definition
  const { data: form } = await supabase
    .from("forms")
    .select("*")
    .eq("id", formId)
    .single();

  if (!form || form.status === 'archived') return notFound();

  // 3. Fixed Submit Action
  async function submitResponse(formData: FormData) {
    "use server";
    const sb = await createSupabaseServerClient();
    const rawData: Record<string, any> = {};
    
    // Extract data based on fields
    form.fields.forEach((field: any) => {
      rawData[field.id] = formData.get(field.id);
    });

    await sb.from("form_responses").insert({
      form_id: formId,
      organization_id: form.organization_id,
      data: rawData,
    });
    
    // FIX: Redirect instead of returning an object. 
    // This clears the error and resets the form.
    redirect(`/submit/${formId}?success=true`);
  }

  // 4. Show Success State if redirected
  if (success === 'true') {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/5 rounded-2xl border border-white/10 shadow-sm p-8 text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-100">Submission Received</h1>
          <p className="text-slate-400 text-sm">
            {form.settings?.successMessage || "Thank you! Your response has been securely recorded."}
          </p>
          <a href={`/submit/${formId}`} className="inline-block mt-4 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-100">
            Submit Another Response
          </a>
        </div>
      </div>
    );
  }

  // Render Form
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white/5 rounded-2xl border border-white/10 shadow-sm overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 px-8 py-6 text-white">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-70 mb-2">
                <ShieldCheck className="h-4 w-4" />
                Secure Submission
            </div>
            <h1 className="text-2xl font-bold">{form.title}</h1>
            {form.description && <p className="mt-2 text-slate-400">{form.description}</p>}
        </div>

        {/* Dynamic Form Renderer */}
        <form action={submitResponse} className="p-8 space-y-8">
            {form.fields.map((field: any) => (
                <div key={field.id} className="space-y-2">
                    <label className="block text-sm font-bold text-slate-100">
                        {field.label}
                        {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    
                    {field.helpText && (
                        <p className="text-xs text-slate-400">{field.helpText}</p>
                    )}

                    {/* Field Inputs */}
                    {field.type === 'text' && (
                        <input name={field.id} type="text" required={field.validation?.required} placeholder={field.placeholder} className="w-full px-4 py-3 rounded-lg border border-white/10 focus:ring-2 focus:ring-sky-500/20 focus:border-transparent outline-none transition" />
                    )}
                    
                    {field.type === 'email' && (
                         <input name={field.id} type="email" required={field.validation?.required} placeholder={field.placeholder} className="w-full px-4 py-3 rounded-lg border border-white/10 focus:ring-2 focus:ring-sky-500/20 focus:border-transparent outline-none transition" />
                    )}
                    
                    {field.type === 'textarea' && (
                         <textarea name={field.id} rows={4} required={field.validation?.required} placeholder={field.placeholder} className="w-full px-4 py-3 rounded-lg border border-white/10 focus:ring-2 focus:ring-sky-500/20 focus:border-transparent outline-none transition resize-none" />
                    )}

                    {field.type === 'select' && (
                        <div className="relative">
                            <select name={field.id} required={field.validation?.required} className="w-full px-4 py-3 rounded-lg border border-white/10 focus:ring-2 focus:ring-sky-500/20 focus:border-transparent outline-none transition appearance-none bg-white/5">
                                <option value="">Select an option...</option>
                                {field.options?.map((opt: any) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            ))}

            <div className="pt-6 border-t border-white/10">
                <button type="submit" className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white py-4 rounded-xl font-bold text-sm uppercase tracking-widest hover:brightness-110 transition transform active:scale-[0.99]">
                    {form.settings?.submitButtonText || "Submit Response"}
                </button>
            </div>
        </form>
      </div>
      
      <div className="mt-8 text-center text-xs text-slate-400 font-mono uppercase tracking-widest">
        Powered by FormaOS • {new Date().getFullYear()}
      </div>
    </div>
  );
}
