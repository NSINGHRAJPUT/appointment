import { ArrowRight } from 'lucide-react';

const CATEGORIES = [
  { label: 'Cardiology', icon: 'favorite', count: '124 Specialists' },
  { label: 'Neurology', icon: 'psychology', count: '86 Specialists' },
  { label: 'Pediatrics', icon: 'pediatrics', count: '210 Specialists' },
  { label: 'Dentistry', icon: 'dentistry', count: '150 Specialists' },
  { label: 'Dermatology', icon: 'face', count: '98 Specialists' },
  { label: 'Psychiatry', icon: 'self_improvement', count: '72 Specialists' },
  { label: 'Orthopedics', icon: 'accessibility_new', count: '115 Specialists' },
  { label: 'Gastroenterology', icon: 'medical_services', count: '63 Specialists' },
];

export default function PopularCategories() {
  return (
    <section className="max-w-container-max mx-auto px-margin py-25">
      <div className="flex justify-between items-end mb-xl">
        <div>
          <h2 className="font-h1 text-h1 text-on-surface mb-sm">Specialties</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Browse our highly-rated medical categories.</p>
        </div>
        <a className="text-primary font-label-sm text-label-sm flex items-center gap-xs hover:underline" href="/doctors">
          View all <ArrowRight size={16} />
        </a>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
        {CATEGORIES.map(cat => (
          <a
            key={cat.label}
            href={`/doctors?q=${encodeURIComponent(cat.label)}`}
            className="bg-surface-container-lowest border border-surface-variant rounded-xl p-lg flex flex-col items-start gap-md transition-all shadow-level-2 cursor-pointer group hover:border-primary/40 hover:shadow-md"
          >
            <div className="p-sm bg-secondary-container text-on-secondary-container rounded-lg group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
              <span className="material-symbols-outlined">{cat.icon}</span>
            </div>
            <div>
              <h3 className="font-h3 text-h3 text-on-surface">{cat.label}</h3>
              <p className="font-body-md text-body-md text-secondary mt-xs">{cat.count}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
