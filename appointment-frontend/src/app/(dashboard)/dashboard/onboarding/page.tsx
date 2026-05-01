"use client";

import { useState } from "react";
import { doctorService } from '@/services/doctor.service';
import { getStoredToken } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from "next/navigation";

export default function DoctorOnboardingPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const navigate = useRouter();
  const [specialization, setSpecialization] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState<string>("");
  const [bio, setBio] = useState("");

  const [clinicName, setClinicName] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [priceInr, setPriceInr] = useState<string>("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [degree, setDegree] = useState("");
  const [university, setUniversity] = useState("");
  const [graduationYear, setGraduationYear] = useState<string>("");
  const [onlineConsultation, setOnlineConsultation] = useState(true);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Card className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Doctor onboarding
            </h1>
            <p className="text-sm text-zinc-600">
              A quick 3-step profile submission for admin review.
            </p>
          </div>
          <Badge tone="neutral">Step {step} / 3</Badge>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { n: 1, label: "Basics" },
            { n: 2, label: "Clinic & Pricing" },
            { n: 3, label: "Submit" },
          ].map((s) => (
            <div
              key={s.n}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-center"
            >
              <p
                className={
                  step === s.n
                    ? "text-sm font-semibold text-zinc-900"
                    : "text-sm text-zinc-600"
                }
              >
                {s.label}
              </p>
              <p
                className={
                  step === s.n
                    ? "mt-0.5 text-xs font-medium text-zinc-900"
                    : "mt-0.5 text-xs text-zinc-500"
                }
              >
                #{s.n}
              </p>
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <Input
              label="Specialization"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="Cardiology, Dermatology, ..."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Years of experience (optional)"
                value={yearsOfExperience}
                type="number"
                onChange={(e) => setYearsOfExperience(e.target.value)}
                placeholder="e.g. 6"
              />
              <Input
                label="License Number (optional)"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="e.g. LIC-12345"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Degree (optional)"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                placeholder="e.g. MBBS, MD"
              />
              <Input
                label="University (optional)"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="e.g. AIIMS"
              />
              <Input
                label="Graduation Year (optional)"
                value={graduationYear}
                type="number"
                onChange={(e) => setGraduationYear(e.target.value)}
                placeholder="e.g. 2010"
              />
            </div>
            <label className="block space-y-1.5">
              <span className="text-sm text-zinc-600">Bio</span>
              <textarea
                className="min-h-[140px] w-full rounded-xl border border-zinc-200 p-3 text-sm focus:border-zinc-400 focus:outline-none"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your approach, expertise, and how patients can benefit from you."
              />
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Clinic name"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder="Sunrise Clinics"
              />
              <Input
                label="Clinic Address (optional)"
                value={clinicAddress}
                onChange={(e) => setClinicAddress(e.target.value)}
                placeholder="123 Main St"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Bengaluru"
              />
              <Input
                label="Country (optional)"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="India"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Consultation price (INR)"
                value={priceInr}
                type="number"
                onChange={(e) => setPriceInr(e.target.value)}
                placeholder="e.g. 999"
              />
              <Input
                label="WhatsApp number (optional)"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+91 98xxxxxx"
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="onlineConsultation"
                checked={onlineConsultation}
                onChange={(e) => setOnlineConsultation(e.target.checked)}
                className="rounded border-zinc-300 text-primary focus:ring-primary"
              />
              <label htmlFor="onlineConsultation" className="text-sm text-zinc-700">
                Offer online video consultations
              </label>
            </div>
            <p className="text-xs text-zinc-500">
              You can update this later—admin review happens after submission.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">
              Review your details before submitting for admin approval.
            </p>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
              <p className="font-medium text-zinc-900">
                {specialization || "Specialization"}
              </p>
              <p className="text-zinc-600 mt-1">
                {clinicName || "Clinic"} • {city || "City"}
              </p>
              <p className="text-zinc-600 mt-1">
                Price: {priceInr ? `INR ${priceInr}` : "—"}
              </p>
              <p className="text-zinc-600 mt-3 whitespace-pre-wrap">
                {bio ? bio.slice(0, 260) : "Bio not added yet."}
              </p>
            </div>
          </div>
        )}

        {message && (
          <p className="rounded-lg bg-zinc-100 p-2 text-sm text-zinc-700">
            {message}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <Button
            variant="ghost"
            disabled={step === 1 || loading}
            onClick={() => {
              setMessage(null);
              setStep((s) => (s === 1 ? 1 : ((s - 1) as any)));
            }}
          >
            Back
          </Button>
          {step < 3 ? (
            <Button
              disabled={
                loading ||
                (step === 1 && (!specialization.trim() || !bio.trim())) ||
                (step === 2 &&
                  (!clinicName.trim() || !city.trim() || !priceInr.trim()))
              }
              onClick={() => {
                setMessage(null);
                setStep((s) => (s + 1) as any);
              }}
            >
              Continue
            </Button>
          ) : (
            <Button
              loading={loading}
              disabled={loading}
              onClick={async () => {
                const token = getStoredToken();
                if (!token) {
                  setMessage("Please login as doctor");
                  return;
                }
                setLoading(true);
                setMessage(null);
                try {
                  const priceNum = priceInr.trim() ? Number(priceInr) : 0;
                  await doctorService.onboarding(token, {
                    specialization: specialization.trim(),
                    bio: bio.trim(),
                    yearsOfExperience: yearsOfExperience.trim()
                      ? Number(yearsOfExperience)
                      : undefined,
                    clinicName: clinicName.trim(),
                    clinicAddress: clinicAddress.trim() || undefined,
                    city: city.trim(),
                    country: country.trim() || undefined,
                    licenseNumber: licenseNumber.trim() || undefined,
                    degree: degree.trim() || undefined,
                    university: university.trim() || undefined,
                    graduationYear: graduationYear.trim() ? Number(graduationYear) : undefined,
                    onlineConsultation,
                    priceCents: Math.round(priceNum * 100),
                    currency: "INR",
                    whatsappNumber: whatsappNumber.trim() || undefined,
                  });
                  setMessage("Onboarding submitted for admin approval.");
                  navigate.push('/dashboard')
                } catch (err) {
                  setMessage((err as Error).message);
                } finally {
                  setLoading(false);
                }
              }}
            >
              Submit for admin approval
            </Button>
          )}
        </div>
      </Card>
    </main>
  );
}
