'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Stethoscope,
  Building2,
  IndianRupee,
  ArrowLeft,
  CheckCircle2,
  BadgeCheck,
  Layers,
} from 'lucide-react';
import { doctorService } from '@/services/doctor.service';
import {
  profileUpdateSchema,
  formatZodError,
  optionalIndianMobileSchema,
} from '@/lib/validation/schemas';
import { getStoredToken } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PhoneInput } from '@/components/ui/phone-input';

interface DoctorProfile {
  id: string;
  specialization?: string | null;
  bio?: string | null;
  yearsOfExperience?: number | null;
  licenseNumber?: string | null;
  clinicName?: string | null;
  clinicAddress?: string | null;
  city?: string | null;
  country?: string | null;
  degree?: string | null;
  university?: string | null;
  graduationYear?: number | null;
  onlineConsultation?: boolean;
  priceCents?: number;
  currency?: string;
  whatsappNumber?: string | null;
  subSpecialties?: string[];
  conditions?: string[];
  onboardingStatus: string;
  fullName?: string;
  user?: {
    fullName?: string;
    whatsappNumber?: string | null;
  };
}

const SUB_SPECIALTY_OPTIONS = [
  'Surgery',
  'Dermatology',
  'Emergency Care',
  'Internal Medicine',
  'Oncology',
  'Orthopedics',
  'Cardiology',
  'Nutrition',
];

const CONDITION_OPTIONS = [
  'Dogs',
  'Cats',
  'Birds',
  'Rabbits',
  'Exotic Pets',
  'Senior Pets',
  'Puppies & Kittens',
];

function initials(name: string) {
  return name
    .split(' ')
    .filter((w) => w.length > 0)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function ProfileSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="premium-card space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-container text-primary">
          <Icon size={18} />
        </div>
        <div>
          <h2 className="font-h3 text-h3 text-on-surface">{title}</h2>
          <p className="text-sm text-on-surface-variant">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function TagSelect({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
              active
                ? 'border-primary bg-primary text-on-primary'
                : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary hover:text-primary'
            }`}
          >
            {active ? '✓ ' : ''}
            {option}
          </button>
        );
      })}
    </div>
  );
}

function mapProfileToForm(p: DoctorProfile) {
  return {
    fullName: p.fullName || p.user?.fullName || '',
    specialization: p.specialization || '',
    yearsOfExperience:
      p.yearsOfExperience != null ? String(p.yearsOfExperience) : '',
    bio: p.bio || '',
    clinicName: p.clinicName || '',
    clinicAddress: p.clinicAddress || '',
    city: p.city || '',
    country: p.country || '',
    priceInr: p.priceCents ? String(p.priceCents / 100) : '',
    whatsappNumber: p.whatsappNumber || p.user?.whatsappNumber || '',
    licenseNumber: p.licenseNumber || '',
    degree: p.degree || '',
    university: p.university || '',
    graduationYear: p.graduationYear != null ? String(p.graduationYear) : '',
    onlineConsultation: p.onlineConsultation ?? false,
    subSpecialties: p.subSpecialties ?? [],
    conditions: p.conditions ?? [],
  };
}

export function DoctorProfileEditor() {
  const router = useRouter();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [bio, setBio] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [priceInr, setPriceInr] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [degree, setDegree] = useState('');
  const [university, setUniversity] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [onlineConsultation, setOnlineConsultation] = useState(false);
  const [subSpecialties, setSubSpecialties] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.replace('/auth');
      return;
    }

    doctorService
      .getProfile(token)
      .then((data) => {
        const p = data as DoctorProfile;
        setProfile(p);
        const form = mapProfileToForm(p);
        setFullName(form.fullName);
        setSpecialization(form.specialization);
        setYearsOfExperience(form.yearsOfExperience);
        setBio(form.bio);
        setClinicName(form.clinicName);
        setClinicAddress(form.clinicAddress);
        setCity(form.city);
        setCountry(form.country);
        setPriceInr(form.priceInr);
        setWhatsappNumber(form.whatsappNumber);
        setLicenseNumber(form.licenseNumber);
        setDegree(form.degree);
        setUniversity(form.university);
        setGraduationYear(form.graduationYear);
        setOnlineConsultation(form.onlineConsultation);
        setSubSpecialties(form.subSpecialties);
        setConditions(form.conditions);
      })
      .catch((err) =>
        setMessage((err as Error).message || 'Failed to load profile'),
      )
      .finally(() => setLoading(false));
  }, [router]);

  function toggleTag(
    key: 'subSpecialties' | 'conditions',
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    current: string[],
  ) {
    setter(
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  async function handleSave() {
    const token = getStoredToken();
    if (!token) return;

    if (whatsappNumber.trim()) {
      const phoneCheck = optionalIndianMobileSchema.safeParse(whatsappNumber);
      if (!phoneCheck.success) {
        setMessage(formatZodError(phoneCheck.error));
        return;
      }
    }

    const parsed = profileUpdateSchema.safeParse({
      specialization: specialization.trim(),
      clinicName: clinicName.trim(),
      bio: bio.trim() || undefined,
    });
    if (!parsed.success) {
      setMessage(formatZodError(parsed.error));
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const priceNum = priceInr.trim() ? Number(priceInr) : 0;
      await doctorService.updateProfile(token, {
        specialization: specialization.trim(),
        bio: bio.trim() || undefined,
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
        graduationYear: graduationYear.trim()
          ? Number(graduationYear)
          : undefined,
        onlineConsultation,
        priceCents: Math.round(priceNum * 100),
        currency: 'INR',
        whatsappNumber: whatsappNumber.trim() || undefined,
        subSpecialties,
        conditions,
      });
      setMessage('Profile updated successfully');
    } catch (err) {
      setMessage((err as Error).message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitForApproval() {
    const token = getStoredToken();
    if (!token) return;
    if (
      !confirm(
        'Submit your profile for admin approval? You can still edit it after submission.',
      )
    ) {
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await doctorService.submitOnboarding(token);
      setMessage('Profile submitted for admin approval');
      setProfile((prev) =>
        prev ? { ...prev, onboardingStatus: 'SUBMITTED' } : null,
      );
    } catch (err) {
      setMessage((err as Error).message || 'Failed to submit profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  const statusLabel =
    profile?.onboardingStatus === 'APPROVED'
      ? 'Verified & live'
      : profile?.onboardingStatus === 'SUBMITTED'
        ? 'Pending review'
        : 'Draft profile';

  const subSpecialtyOptions = Array.from(
    new Set([...SUB_SPECIALTY_OPTIONS, ...subSpecialties]),
  );
  const conditionOptions = Array.from(
    new Set([...CONDITION_OPTIONS, ...conditions]),
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-margin py-10 space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
      >
        <ArrowLeft size={16} /> Back to dashboard
      </button>

      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary via-brand-teal to-brand-forest p-8 text-on-primary shadow-lg">
        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-xl font-bold backdrop-blur-sm">
              {initials(fullName || specialization || 'Dr')}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-on-primary/80">
                Veterinarian profile
              </p>
              <h1 className="font-bold text-2xl">
                {fullName || 'Your profile'}
              </h1>
              <p className="text-sm text-on-primary/80">
                {specialization || 'Add specialization'}
                {clinicName ? ` • ${clinicName}` : ''}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
            <BadgeCheck size={14} />
            {statusLabel}
          </span>
        </div>
      </div>

      <ProfileSection
        icon={Stethoscope}
        title="Professional credentials"
        description="Your specialization and qualifications shown to pet parents."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Specialization"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            placeholder="e.g. Dermatology, Surgery"
          />
          <Input
            label="Years of experience"
            type="number"
            value={yearsOfExperience}
            onChange={(e) => setYearsOfExperience(e.target.value)}
            placeholder="e.g. 8"
          />
          <Input
            label="License number"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            placeholder="Vet council registration"
          />
          <Input
            label="Degree"
            value={degree}
            onChange={(e) => setDegree(e.target.value)}
            placeholder="BVSc, MVSc"
          />
          <Input
            label="University"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
          />
          <Input
            label="Graduation year"
            type="number"
            value={graduationYear}
            onChange={(e) => setGraduationYear(e.target.value)}
          />
        </div>
        <label className="block space-y-1.5">
          <span className="text-sm text-on-surface-variant">Professional bio</span>
          <textarea
            className="min-h-[120px] w-full rounded-xl border border-outline-variant p-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Describe your expertise, approach, and what pet parents can expect."
          />
        </label>
      </ProfileSection>

      <ProfileSection
        icon={Layers}
        title="Expertise & species"
        description="Sub-specialties and species you treat — carried over from registration."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-on-surface">Sub-specialties</p>
            <TagSelect
              options={subSpecialtyOptions}
              selected={subSpecialties}
              onToggle={(value) =>
                toggleTag('subSpecialties', value, setSubSpecialties, subSpecialties)
              }
            />
            {subSpecialties.length > 0 && (
              <p className="text-xs text-on-surface-variant">
                Selected: {subSpecialties.join(', ')}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-on-surface">Species / conditions</p>
            <TagSelect
              options={conditionOptions}
              selected={conditions}
              onToggle={(value) =>
                toggleTag('conditions', value, setConditions, conditions)
              }
            />
            {conditions.length > 0 && (
              <p className="text-xs text-on-surface-variant">
                Selected: {conditions.join(', ')}
              </p>
            )}
          </div>
        </div>
      </ProfileSection>

      <ProfileSection
        icon={Building2}
        title="Clinic & location"
        description="Where pet parents can find you for in-clinic visits."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Clinic name"
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
          />
          <Input
            label="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <div className="sm:col-span-2">
            <Input
              label="Clinic address"
              value={clinicAddress}
              onChange={(e) => setClinicAddress(e.target.value)}
            />
          </div>
          <Input
            label="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>
      </ProfileSection>

      <ProfileSection
        icon={IndianRupee}
        title="Consultation settings"
        description="Fees and how patients can reach you."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Consultation fee (INR)"
            type="number"
            value={priceInr}
            onChange={(e) => setPriceInr(e.target.value)}
            placeholder="e.g. 799"
          />
          <label className="block space-y-1.5">
            <span className="text-sm text-on-surface-variant">WhatsApp</span>
            <PhoneInput
              value={whatsappNumber}
              onChange={setWhatsappNumber}
              placeholder="For patient queries"
            />
          </label>
        </div>
        <label className="flex items-center gap-3 rounded-xl border border-outline-variant px-4 py-3">
          <input
            type="checkbox"
            checked={onlineConsultation}
            onChange={(e) => setOnlineConsultation(e.target.checked)}
            className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
          />
          <span className="text-sm text-on-surface">
            Offer online video consultations
          </span>
        </label>
      </ProfileSection>

      {message && (
        <div
          className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
            message.includes('success') || message.includes('submitted')
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'bg-error/10 text-error border border-error/20'
          }`}
        >
          {(message.includes('success') || message.includes('submitted')) && (
            <CheckCircle2 size={16} />
          )}
          {message}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {profile?.onboardingStatus === 'DRAFT' ? (
          <Button
            variant="secondary"
            loading={saving}
            disabled={saving}
            onClick={handleSubmitForApproval}
          >
            Submit for approval
          </Button>
        ) : (
          <span />
        )}
        <Button
          loading={saving}
          disabled={
            saving ||
            !specialization.trim() ||
            !clinicName.trim() ||
            !city.trim()
          }
          onClick={handleSave}
        >
          Save changes
        </Button>
      </div>
    </main>
  );
}
