'use client';

import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { DocSectionCard, docSections } from './DocSectionCard';

export function DocsContent() {
 return (
 <section className="relative py-24 ">
 <SectionChoreography pattern="cascade" className="relative max-w-4xl mx-auto px-6 lg:px-12 space-y-6">
 {docSections.map((section, index) => (
 <DocSectionCard key={section.id} section={section} index={index} />
 ))}
 </SectionChoreography>
 </section>
 );
}
