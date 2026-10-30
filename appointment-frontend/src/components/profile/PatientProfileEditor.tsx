'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  User,
  Phone,
  MapPin,
  Heart,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { patientService } from '@/services/patient.service';
import {
  patientProfileUpdateSchema,
  formatZodError,
} from '@/lib/validation/schemas';
import { getStoredToken } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PhoneInput } from '@/components/ui/phone-input';

type PatientProfile = {
  id: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  user: {
    id: string;
    email: string;
    fullName: string;
    phoneNumber?: string | null;
    whatsappNumber?: string | null;
    gender?: string | null;
  };
};

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];

function initials(name: string) {
  return name
    .split(' ')
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
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-secondary">
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

export function PatientProfileEditor() {
  const router = useRouter();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.replace('/auth');
      return;
    }

    patientService
      .getProfile(token)
      .then((data) => {
        const p = data as PatientProfile;
        setProfile(p);
        setFullName(p.user.fullName ?? '');
        setPhoneNumber(p.user.phoneNumber ?? '');
        setWhatsappNumber(p.user.whatsappNumber ?? '');
        setGender(p.user.gender ?? p.gender ?? '');
        setDateOfBirth(
          p.dateOfBirth
            ? new Date(p.dateOfBirth).toISOString().slice(0, 10)
            : '',
        );
        setAddress(p.address ?? '');
      })
      .catch((err) =>
        setMessage((err as Error).message || 'Failed to load profile'),
      )
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSave() {
    const token = getStoredToken();
    if (!token) return;

    const parsed = patientProfileUpdateSchema.safeParse({
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      whatsappNumber: whatsappNumber.trim(),
      gender: gender.trim(),
      dateOfBirth: dateOfBirth.trim(),
      address: address.trim(),
    });
    if (!parsed.success) {
      setMessage(formatZodError(parsed.error));
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await patientService.updateProfile(token, {
        fullName: parsed.data.fullName,
        phoneNumber: parsed.data.phoneNumber || undefined,
        whatsappNumber: parsed.data.whatsappNumber || undefined,
        gender: parsed.data.gender || undefined,
        dateOfBirth: parsed.data.dateOfBirth || undefined,
        address: parsed.data.address || undefined,
      });
      setMessage('Profile updated successfully');
    } catch (err) {
      setMessage((err as Error).message || 'Failed to update profile');
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

  return (
    <main className="mx-auto w-full max-w-3xl px-margin py-10 space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
      >
        <ArrowLeft size={16} /> Back to dashboard
      </button>

      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-secondary via-brand-forest to-brand-ink p-8 text-inverse-on-surface shadow-lg">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-6 h-24 w-24 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold backdrop-blur-sm">
            {initials(fullName || 'P')}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-inverse-primary/80">
              Pet parent profile
            </p>
            <h1 className="font-bold text-2xl">{fullName || 'Your profile'}</h1>
            <p className="text-sm text-inverse-on-surface/70">
              {profile?.user.email}
            </p>
          </div>
        </div>
      </div>

      <ProfileSection
        icon={User}
        title="Personal details"
        description="Keep your name and basic information up to date."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
          />
          <label className="block space-y-1.5">
            <span className="text-sm text-on-surface-variant">Gender</span>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full rounded-xl border border-outline-variant px-4 py-3 text-sm bg-surface-container-lowest"
            >
              <option value="">Select gender</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="Date of birth"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
          />
          <Input
            label="Email"
            value={profile?.user.email ?? ''}
            disabled
            onChange={() => {}}
          />
        </div>
      </ProfileSection>

      <ProfileSection
        icon={Phone}
        title="Contact"
        description="Used for appointment reminders and vet communication."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-sm text-on-surface-variant">
              Mobile number
            </span>
            <PhoneInput
              value={phoneNumber}
              onChange={setPhoneNumber}
              placeholder="9876543210"
            />
          </label>
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-sm text-on-surface-variant">
              WhatsApp number
            </span>
            <PhoneInput
              value={whatsappNumber}
              onChange={setWhatsappNumber}
              placeholder="Optional"
            />
          </label>
        </div>
      </ProfileSection>

      <ProfileSection
        icon={MapPin}
        title="Address"
        description="Helps vets understand your location for in-clinic visits."
      >
        <label className="block space-y-1.5">
          <span className="text-sm text-on-surface-variant">Home address</span>
          <textarea
            className="min-h-[100px] w-full rounded-xl border border-outline-variant p-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street, city, state"
          />
        </label>
      </ProfileSection>

      {message && (
        <div
          className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
            message.includes('success')
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'bg-error/10 text-error border border-error/20'
          }`}
        >
          {message.includes('success') && <CheckCircle2 size={16} />}
          {message}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
          <Heart size={12} className="text-primary" />
          Your pet&apos;s care starts with accurate details
        </p>
        <Button
          loading={saving}
          disabled={saving || !fullName.trim()}
          onClick={handleSave}
        >
          Save profile
        </Button>
      </div>
    </main>
  );
}
