"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, HelpCircle, MessageCircle, PawPrint } from "lucide-react";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

const FAQS = [
  {
    question: "When should I book an online vet consultation?",
    answer:
      "Online consults work well for follow-ups, mild symptoms, skin or coat issues, diet and nutrition advice, behavior concerns, and post-surgery check-ins. If your pet has severe bleeding, difficulty breathing, collapse, or suspected poisoning, seek emergency in-clinic care immediately.",
  },
  {
    question: "Can I book for any type of pet?",
    answer:
      "Yes. PawCare lists veterinarians for dogs, cats, birds, rabbits, and exotic animals. Use the specialty filters on the Find Vets page to match your pet's needs — from general practice to surgery, dermatology, and exotic care.",
  },
  {
    question: "How do I know the vet is qualified?",
    answer:
      "All veterinarians must complete onboarding and admin verification before their profile goes live. You can view their specialization, experience, ratings from other pet parents, and consultation fees before booking.",
  },
  {
    question: "What is the difference between instant consult and scheduled booking?",
    answer:
      "Instant consult connects you with a vet who is online right now — ideal for urgent but non-emergency questions. Scheduled booking lets you pick a specific date and time for a video call or in-clinic visit in advance.",
  },
  {
    question: "How much does a consultation cost?",
    answer:
      "Fees vary by veterinarian and consultation type. Each vet's profile shows their price before you confirm. Some offer free introductory sessions; others charge per visit. You will always see the amount before payment.",
  },
];

export default function HomeFaq() {
  const [active, setActive] = useState(0);
  const activeFaq = FAQS[active];

  return (
    <section className="py-20 md:py-28 bg-surface-container-low">
      <div className="max-w-container-max mx-auto px-margin">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          <AnimateOnScroll variant="left" className="lg:col-span-4">
            <p className="inline-flex items-center gap-2 rounded-full bg-primary-container border border-primary/20 px-4 py-1.5 text-sm font-semibold text-primary mb-4">
              <PawPrint size={14} />
              Common questions
            </p>
            <h2 className="font-bold text-4xl text-on-surface mb-5 text-balance">
              Everything pet parents ask us
            </h2>
            <p className="text-on-surface-variant leading-relaxed mb-8">
              Tap a question to see the answer. New to online vet care? We have got you covered.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/faq"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary shadow-md hover:shadow-lg hover:scale-105 transition-all group"
              >
                <HelpCircle size={16} />
                View all FAQs
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border-2 border-outline-variant bg-white px-6 py-3 text-sm font-semibold text-on-surface hover:border-primary hover:bg-primary-container transition-all"
              >
                <MessageCircle size={16} />
                Ask support
              </Link>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll variant="right" delay={100} className="lg:col-span-8">
            <div className="flex flex-wrap gap-2.5 md:gap-3">
              {FAQS.map((faq, index) => {
                const isActive = active === index;
                return (
                  <button
                    key={faq.question}
                    type="button"
                    onClick={() => setActive(index)}
                    className={`rounded-full px-4 py-2.5 md:px-5 md:py-3 text-left text-sm font-medium transition-all duration-300 border ${
                      isActive
                        ? "bg-primary text-on-primary border-primary shadow-md scale-[1.02]"
                        : "bg-white text-on-surface border-outline-variant hover:border-primary/40 hover:bg-primary-container/50 hover:scale-[1.01]"
                    }`}
                  >
                    {faq.question}
                  </button>
                );
              })}
            </div>

            <div
              key={active}
              className="mt-6 rounded-3xl border border-primary/20 bg-white p-6 md:p-8 shadow-sm animate-fade-in-up"
            >
              <p className="inline-flex items-center gap-2 rounded-full bg-primary-container px-3 py-1 text-xs font-semibold text-primary mb-4">
                <HelpCircle size={12} />
                Answer
              </p>
              <h3 className="font-bold text-lg text-on-surface mb-3 leading-snug">
                {activeFaq.question}
              </h3>
              <p className="text-sm md:text-base text-on-surface-variant leading-relaxed">
                {activeFaq.answer}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/doctors"
                  className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-on-secondary hover:opacity-90 transition-opacity"
                >
                  Find a vet
                </Link>
                <Link
                  href="/instant"
                  className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary-container px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary hover:text-on-primary transition-colors"
                >
                  Instant consult
                </Link>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </div>
    </section>
  );
}
