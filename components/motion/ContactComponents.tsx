"use client";

import { motion } from "framer-motion";
import { Mail, MapPin, Clock, Phone, LucideIcon } from "lucide-react";

// Executive-grade contact form with premium styling
export function ExecutiveContactForm({ action }: { action: any }) {
  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      action={action}
      className="glass-intense rounded-3xl p-10 lg:p-12 shadow-premium-2xl relative overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0 command-grid opacity-5" />
      <div className="absolute top-0 right-0 h-64 w-64 bg-primary/5 rounded-full blur-3xl" />

      <div className="relative space-y-6">
        {/* Name and Email row */}
        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            label="Full name"
            name="name"
            required
            placeholder="John Smith"
          />
          <FormField
            label="Work email"
            name="email"
            type="email"
            required
            placeholder="john@company.com"
          />
        </div>

        {/* Organization and Industry row */}
        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            label="Organization"
            name="organization"
            required
            placeholder="Your Company Pty Ltd"
          />
          <FormField
            label="Industry"
            name="industry"
            placeholder="Healthcare, NDIS, etc."
          />
        </div>

        {/* Message */}
        <FormField
          label="What do you need help with?"
          name="message"
          type="textarea"
          rows={6}
          required
          placeholder="Tell us about your compliance needs, audit timeline, or any questions..."
        />

        {/* Submit button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="btn btn-primary w-full md:w-auto text-lg px-12 py-5 shadow-premium-xl"
        >
          Send Request
        </motion.button>
      </div>
    </motion.form>
  );
}

// Form field component
interface FormFieldProps {
  label: string;
  name: string;
  type?: "text" | "email" | "tel" | "textarea";
  required?: boolean;
  placeholder?: string;
  rows?: number;
}

function FormField({ 
  label, 
  name, 
  type = "text", 
  required = false, 
  placeholder,
  rows 
}: FormFieldProps) {
  const inputClasses = `
    w-full rounded-xl glass-panel px-4 py-4 text-base text-foreground 
    border border-border/30 
    focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 
    transition-all duration-300
    placeholder:text-muted-foreground/50
  `;

  return (
    <div className="space-y-2.5">
      <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
        {label} {required && "*"}
      </label>
      {type === "textarea" ? (
        <textarea
          name={name}
          required={required}
          rows={rows}
          placeholder={placeholder}
          className={`${inputClasses} resize-none`}
        />
      ) : (
        <input
          type={type}
          name={name}
          required={required}
          placeholder={placeholder}
          className={inputClasses}
        />
      )}
    </div>
  );
}

// Contact info card
interface ContactInfoCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  delay?: number;
}

export function ContactInfoCard({ icon: Icon, label, value, delay = 0 }: ContactInfoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5 }}
      className="glass-panel rounded-2xl p-8 shadow-premium-md group cursor-default"
    >
      <div className="rounded-xl bg-primary/10 p-3 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
        {label}
      </div>
      
      <div className="text-base font-medium text-foreground">
        {value}
      </div>
    </motion.div>
  );
}

// Contact hero section with multiple options
export function ContactOptionsGrid() {
  const options = [
    {
      icon: Mail,
      title: "Email us",
      description: "General inquiries and support",
      value: "sales@formaos.com",
      action: "mailto:sales@formaos.com"
    },
    {
      icon: Phone,
      title: "Call us",
      description: "Direct line for urgent matters",
      value: "+61 469 715 062",
      action: "tel:+61469715062"
    },
    {
      icon: MapPin,
      title: "Location",
      description: "Head office",
      value: "Adelaide, South Australia",
      action: null
    },
    {
      icon: Clock,
      title: "Response time",
      description: "Typical reply time",
      value: "Within 1 business day",
      action: null
    }
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {options.map((option, idx) => (
        <motion.div
          key={option.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: idx * 0.1 }}
          whileHover={option.action ? { y: -5, scale: 1.02 } : undefined}
          className={`glass-panel rounded-2xl p-8 shadow-premium-md group ${option.action ? 'cursor-pointer' : ''}`}
          onClick={option.action ? () => window.location.href = option.action : undefined}
        >
          <div className="rounded-xl bg-primary/10 p-3 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
            <option.icon className="h-6 w-6 text-primary" />
          </div>
          
          <h3 className="text-lg font-semibold font-display mb-1 group-hover:text-primary transition-colors">
            {option.title}
          </h3>
          
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
            {option.description}
          </div>
          
          <div className="text-sm font-medium text-foreground">
            {option.value}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Status message components
export function SuccessMessage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto glass-panel rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-6 py-5 text-base text-emerald-200 shadow-premium-md"
    >
      <div className="flex items-start gap-3">
        <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-emerald-400">✓</span>
        </div>
        <div>
          <div className="font-semibold mb-1">Request received</div>
          <div className="text-sm text-emerald-200/80">
            A compliance specialist will respond within one business day.
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function ErrorMessage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto glass-panel rounded-2xl border border-rose-400/30 bg-rose-500/10 px-6 py-5 text-base text-rose-200 shadow-premium-md"
    >
      <div className="flex items-start gap-3">
        <div className="h-6 w-6 rounded-full bg-rose-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-rose-400">✕</span>
        </div>
        <div>
          <div className="font-semibold mb-1">Submission failed</div>
          <div className="text-sm text-rose-200/80">
            Please email sales@formaos.com or try again shortly.
          </div>
        </div>
      </div>
    </motion.div>
  );
}
