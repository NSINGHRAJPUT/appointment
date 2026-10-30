'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

type AccordionItem = { question: string; answer: string };
type AccordionSectionProps = {
  id: string;
  icon: React.ReactNode;
  title: string;
  items: AccordionItem[];
};

export function AccordionSection({ id, icon, title, items }: AccordionSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="scroll-mt-32" id={id}>
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-outline-variant">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-container text-primary">
          {icon}
        </span>
        <h2 className="font-bold text-2xl md:text-3xl text-on-surface">{title}</h2>
      </div>
      <div className="space-y-4">
        {items.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-colors ${
                isOpen ? 'border-primary/40' : 'border-outline-variant hover:border-primary/30'
              }`}
            >
              <button
                className={`w-full px-6 py-5 flex items-center justify-between focus:outline-none focus:bg-surface-container-low transition-colors text-left ${
                  isOpen ? 'bg-surface-container-low' : 'bg-white'
                }`}
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
              >
                <span className="font-semibold text-base md:text-lg text-on-surface pr-4">
                  {item.question}
                </span>
                <ChevronDown
                  size={20}
                  className={`shrink-0 transition-transform duration-200 ${
                    isOpen ? 'text-primary rotate-180' : 'text-on-surface-variant'
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-6 pb-6 pt-2 bg-surface-container-lowest">
                  <p className="text-on-surface-variant leading-relaxed">{item.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
