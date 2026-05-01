'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Video, UserSearch, Calendar } from 'lucide-react';
import { BookingModal } from '../booking/BookingModal';

export default function LandingHero() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/doctors?q=${encodeURIComponent(q)}` : '/doctors');
  }

  return (
    <section className="max-w-container-max mx-auto px-margin pt-30 pb-20 flex flex-col items-center text-center">
      <span className="bg-surface-container-high text-on-surface font-label-sm text-label-sm px-md py-sm rounded-full mb-gutter border border-surface-variant flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
        Over 10,000 verified specialists online
      </span>
      <h1 className="font-display text-display text-on-surface max-w-4xl mb-gutter leading-tight">
        Precision care, <br />delivered instantly.
      </h1>
      <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mb-12">
        Connect with top-tier medical professionals for consultations, second opinions, and immediate care planning through our secure platform.
      </p>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="w-full max-w-3xl bg-surface-container-lowest rounded-xl p-xs border border-surface-variant flex items-center shadow-sm relative z-10 transition-shadow focus-within:ring-1 focus-within:ring-primary focus-within:shadow-[0_0_0_3px_rgba(0,104,95,0.1)]">
        <Search className="text-outline ml-4 shrink-0" size={18} />
        <input
          className="flex-1 bg-transparent border-none focus:ring-0 font-body-lg text-body-lg text-on-surface placeholder:text-outline p-md outline-none"
          placeholder="Search doctors by specialty, location, or symptoms..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          type="text"
        />
        <button type="submit" className="bg-primary text-on-primary font-label-sm text-label-sm px-lg py-md rounded-lg flex items-center gap-2 hover:bg-surface-tint transition-colors">
          Search
        </button>
      </form>

      {/* Hero Actions */}
      <div className="flex flex-wrap items-center justify-center gap-md mt-margin">
        <button
          onClick={() => setIsBookingModalOpen(true)}
          className="bg-primary text-on-primary font-label-sm text-label-sm px-xl py-lg rounded-lg shadow-sm hover:bg-surface-tint transition-colors flex items-center gap-2"
        >
          <Calendar size={18} />
          Book Appointment
        </button>
        <a
          href="/instant"
          className="bg-surface-container-lowest text-secondary border border-surface-variant font-label-sm text-label-sm px-xl py-lg rounded-lg hover:bg-surface-container transition-colors flex items-center gap-2"
        >
          <Video size={18} />
          Consult Now
        </a>
        <a
          href="/doctors"
          className="bg-surface-container-lowest text-secondary border border-surface-variant font-label-sm text-label-sm px-xl py-lg rounded-lg hover:bg-surface-container transition-colors flex items-center gap-2"
        >
          <UserSearch size={18} />
          Find Doctors
        </a>
      </div>

      <BookingModal 
        open={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)} 
      />
    </section>
  );
}
