"use client";

import { motion } from "framer-motion";
import { Mail, MapPin, Clock, Phone, LucideIcon } from "lucide-react";

// Executive-grade contact form with premium styling
export function ExecutiveContactForm({ action }: { action: any }) {
  return (
    <motion.form
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7 }}
      action={action}
      className="relative glass-intense rounded-3xl p-10 lg:p-14 shadow-premium-2xl overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0 command-grid opacity-3" />
      <div className="absolute top-0 right-0 h-80 w-80 bg-primary/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 left-0 h-64 w-64 bg-secondary/5 rounded-full blur-[80px]" />
      
      {/* Top edge highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="relative space-y-8">
        {/* Name and Email row */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
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
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
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
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="relative btn btn-primary w-full md:w-auto text-lg px-14 py-5 shadow-premium-xl overflow-hidden group"
        >
          <span className="relative z-10">Send Request</span>
          <div className="absolute inset-0 bg-gradient-to-r from-secondary to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
    w-full rounded-xl glass-panel px-5 py-4 text-base text-foreground 
    border border-white/10
    focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 
    hover:border-white/20
    transition-all duration-300
    placeholder:text-muted-foreground/40
    shadow-inner
  `;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="space-y-3"
    >
      <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
        {label}
        {required && <span className="text-primary">*</span>}
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
    </motion.div>
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
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="relative glass-panel rounded-2xl p-8 lg:p-10 shadow-premium-lg group cursor-default overflow-hidden border border-white/5"
    >
      {/* Top edge highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-primary/30 transition-colors duration-300" />
      
      {/* Hover glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <motion.div 
        whileHover={{ rotate: [0, -5, 5, 0] }}
        transition={{ duration: 0.5 }}
        className="relative rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-4 w-fit mb-5 border border-primary/20 group-hover:border-primary/40 transition-all duration-300"
      >
        <Icon className="h-6 w-6 text-primary" />
      </motion.div>
      
      <div className="relative text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
        {label}
      </div>
      
      <div className="relative text-lg font-semibold text-foreground group-hover:text-primary/90 transition-colors duration-300">
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
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-30px" }}
          transition={{ duration: 0.6, delay: idx * 0.1 }}
          whileHover={option.action ? { y: -10, scale: 1.03 } : { y: -5 }}
          className={`relative glass-panel rounded-2xl p-8 shadow-premium-lg group overflow-hidden border border-white/5 ${option.action ? 'cursor-pointer' : ''}`}
          onClick={option.action ? () => window.location.href = option.action : undefined}
        >
          {/* Top edge highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-primary/30 transition-colors duration-300" />
          
          {/* Hover ambient glow */}
          <div className="absolute -top-16 -right-16 w-32 h-32 bg-primary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <motion.div 
            whileHover={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.4 }}
            className="relative rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-4 w-fit mb-5 border border-primary/20 group-hover:border-primary/40 transition-all duration-300"
          >
            <option.icon className="h-6 w-6 text-primary" />
          </motion.div>
          
          <h3 className="relative text-lg font-semibold font-display mb-1 group-hover:text-primary transition-colors duration-300">
            {option.title}
          </h3>
          
          <div className="relative text-xs text-muted-foreground uppercase tracking-wider mb-3">
            {option.description}
          </div>
          
          <div className="relative text-sm font-semibold text-foreground group-hover:text-foreground transition-colors duration-300">
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
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="max-w-2xl mx-auto relative glass-panel rounded-2xl border border-emerald-400/30 bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 px-8 py-6 text-base text-emerald-200 shadow-premium-lg overflow-hidden"
    >
      {/* Top edge highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
      
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl" />
      
      <div className="relative flex items-start gap-4">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400/30 to-emerald-500/10 flex items-center justify-center flex-shrink-0 border border-emerald-400/30"
        >
          <span className="text-emerald-400 text-lg">✓</span>
        </motion.div>
        <div>
          <div className="font-semibold text-lg mb-1">Request received</div>
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
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="max-w-2xl mx-auto relative glass-panel rounded-2xl border border-rose-400/30 bg-gradient-to-r from-rose-500/15 to-rose-500/5 px-8 py-6 text-base text-rose-200 shadow-premium-lg overflow-hidden"
    >
      {/* Top edge highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-400/50 to-transparent" />
      
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-400/10 rounded-full blur-2xl" />
      
      <div className="relative flex items-start gap-4">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="h-8 w-8 rounded-full bg-gradient-to-br from-rose-400/30 to-rose-500/10 flex items-center justify-center flex-shrink-0 border border-rose-400/30"
        >
          <span className="text-rose-400 text-lg">✕</span>
        </motion.div>
        <div>
          <div className="font-semibold text-lg mb-1">Submission failed</div>
          <div className="text-sm text-rose-200/80">
            Please email sales@formaos.com or try again shortly.
          </div>
        </div>
      </div>
    </motion.div>
  );
}
