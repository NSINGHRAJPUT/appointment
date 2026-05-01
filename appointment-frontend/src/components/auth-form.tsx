"use client";

import { FormEvent, useState, useRef } from "react";
import { authService } from "@/services/auth.service";
import { useAuthToken } from "@/hooks/use-auth";
import {
  User,
  Mail,
  Lock,
  Stethoscope,
  MapPin,
  Clock,
  Upload,
  Phone,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff,
  Plus,
  X,
  Building2,
  FileText,
  Calendar,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type Mode = "login" | "register";
type Role = "PATIENT" | "DOCTOR";

interface TimeSlot {
  day: string;
  from: string;
  to: string;
}

interface DoctorForm {
  // Step 1 — Basic info
  fullName: string;
  email: string;
  password: string;
  phone: string;
  gender: string;
  // Step 2 — Professional details
  licenseNumber: string;
  experience: string;
  degree: string;
  university: string;
  graduationYear: string;
  // Step 3 — Specializations
  primarySpecialty: string;
  subSpecialties: string[];
  conditions: string[];
  // Step 4 — Clinic / location
  clinicName: string;
  clinicAddress: string;
  city: string;
  country: string;
  consultationFee: string;
  onlineConsultation: boolean;
  // Step 5 — Availability
  slots: TimeSlot[];
  // Step 6 — Documents
  documents: File[];
  // Step 7 — WhatsApp
  whatsapp: string;
  whatsappOptOut: boolean;
}

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const SPECIALTIES = [
  "Cardiology",
  "Dermatology",
  "Neurology",
  "Pediatrics",
  "Orthopedics",
  "Psychiatry",
  "Ophthalmology",
  "ENT",
  "Oncology",
  "Endocrinology",
  "Gastroenterology",
  "Urology",
];

const CONDITIONS = [
  "Hypertension",
  "Diabetes",
  "Asthma",
  "Arthritis",
  "Depression",
  "Anxiety",
  "Migraine",
  "Back Pain",
  "Heart Disease",
  "Thyroid Disorders",
  "Kidney Disease",
  "Allergies",
];

const STEPS = [
  { label: "Basic Info", icon: User },
  { label: "Professional", icon: Stethoscope },
  { label: "Specializations", icon: FileText },
  { label: "Clinic", icon: Building2 },
  { label: "Availability", icon: Calendar },
  { label: "Documents", icon: Upload },
  { label: "WhatsApp", icon: Phone },
  { label: "Submit", icon: CheckCircle },
];

// ─── Shared field components ─────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all";

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputCls} />;
}

function SelectInput(
  props: React.SelectHTMLAttributes<HTMLSelectElement> & {
    children: React.ReactNode;
  },
) {
  return (
    <select {...props} className={inputCls}>
      {props.children}
    </select>
  );
}

function PasswordInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Minimum 8 characters"}
        className={inputCls + " pr-10"}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

function TagSelect({
  options,
  selected,
  onToggle,
  placeholder,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${active ? "bg-primary text-on-primary border-primary" : "bg-surface-container border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary"}`}
          >
            {active && <span className="mr-1">✓</span>}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ─── Step progress bar ────────────────────────────────────────────────────────

function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-1 mb-3">
        {STEPS.map((s, i) => {
          const done = i < current;
          const active = i === current;
          const Icon = s.icon;
          return (
            <div key={i} className="flex items-center flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${done ? "bg-primary text-on-primary" : active ? "bg-primary/15 border-2 border-primary text-primary" : "bg-surface-container border border-outline-variant text-on-surface-variant"}`}
              >
                {done ? (
                  <CheckCircle size={13} strokeWidth={2.5} />
                ) : (
                  <Icon size={12} strokeWidth={2} />
                )}
              </div>
              {i < total - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 transition-all duration-500 ${done ? "bg-primary" : "bg-outline-variant"}`}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between">
        <span className="text-xs text-on-surface-variant">
          Step {current + 1} of {total}
        </span>
        <span className="text-xs font-semibold text-primary">
          {STEPS[current].label}
        </span>
      </div>
    </div>
  );
}

// ─── Doctor steps ─────────────────────────────────────────────────────────────

function Step1({
  form,
  set,
}: {
  form: DoctorForm;
  set: (k: keyof DoctorForm, v: any) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-on-surface">Basic Information</h3>
        <p className="text-sm text-on-surface-variant mt-0.5">
          Tell us about yourself to get started.
        </p>
      </div>
      <Field label="Full Name">
        <TextInput
          value={form.fullName}
          onChange={(e) => set("fullName", e.target.value)}
          placeholder="Dr. Jane Doe"
        />
      </Field>
      <Field label="Email Address">
        <TextInput
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="doctor@example.com"
        />
      </Field>
      <Field label="Password">
        <PasswordInput
          value={form.password}
          onChange={(v) => set("password", v)}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Phone Number">
          <TextInput
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+1 234 567 8900"
          />
        </Field>
        <Field label="Gender">
          <SelectInput
            value={form.gender}
            onChange={(e) => set("gender", e.target.value)}
          >
            <option value="">Select gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Prefer not to say</option>
          </SelectInput>
        </Field>
      </div>
    </div>
  );
}

function Step2({
  form,
  set,
}: {
  form: DoctorForm;
  set: (k: keyof DoctorForm, v: any) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-on-surface">
          Professional Details
        </h3>
        <p className="text-sm text-on-surface-variant mt-0.5">
          Your medical credentials and background.
        </p>
      </div>
      <Field label="Medical License Number">
        <TextInput
          value={form.licenseNumber}
          onChange={(e) => set("licenseNumber", e.target.value)}
          placeholder="LIC-12345678"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Years of Experience">
          <TextInput
            type="number"
            value={form.experience}
            onChange={(e) => set("experience", e.target.value)}
            placeholder="e.g. 10"
            min="0"
            max="60"
          />
        </Field>
        <Field label="Graduation Year">
          <TextInput
            type="number"
            value={form.graduationYear}
            onChange={(e) => set("graduationYear", e.target.value)}
            placeholder="e.g. 2010"
          />
        </Field>
      </div>
      <Field label="Highest Degree">
        <SelectInput
          value={form.degree}
          onChange={(e) => set("degree", e.target.value)}
        >
          <option value="">Select degree</option>
          <option>MBBS</option>
          <option>MD</option>
          <option>MS</option>
          <option>DM</option>
          <option>MCh</option>
          <option>PhD</option>
        </SelectInput>
      </Field>
      <Field label="University / Medical School">
        <TextInput
          value={form.university}
          onChange={(e) => set("university", e.target.value)}
          placeholder="Harvard Medical School"
        />
      </Field>
    </div>
  );
}

function Step3({
  form,
  set,
}: {
  form: DoctorForm;
  set: (k: keyof DoctorForm, v: any) => void;
}) {
  const toggle = (key: "subSpecialties" | "conditions", val: string) => {
    const arr: string[] = form[key];
    set(key, arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-on-surface">Specializations</h3>
        <p className="text-sm text-on-surface-variant mt-0.5">
          What do you specialize in?
        </p>
      </div>
      <Field label="Primary Specialty">
        <SelectInput
          value={form.primarySpecialty}
          onChange={(e) => set("primarySpecialty", e.target.value)}
        >
          <option value="">Select primary specialty</option>
          {SPECIALTIES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </SelectInput>
      </Field>
      <Field label="Additional Specialties">
        <TagSelect
          options={SPECIALTIES}
          selected={form.subSpecialties}
          onToggle={(v) => toggle("subSpecialties", v)}
        />
      </Field>
      <Field label="Conditions Treated">
        <TagSelect
          options={CONDITIONS}
          selected={form.conditions}
          onToggle={(v) => toggle("conditions", v)}
        />
      </Field>
    </div>
  );
}

function Step4({
  form,
  set,
}: {
  form: DoctorForm;
  set: (k: keyof DoctorForm, v: any) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-on-surface">Clinic & Location</h3>
        <p className="text-sm text-on-surface-variant mt-0.5">
          Where do you practice?
        </p>
      </div>
      <Field label="Clinic / Hospital Name">
        <TextInput
          value={form.clinicName}
          onChange={(e) => set("clinicName", e.target.value)}
          placeholder="City Heart Hospital"
        />
      </Field>
      <Field label="Clinic Address">
        <TextInput
          value={form.clinicAddress}
          onChange={(e) => set("clinicAddress", e.target.value)}
          placeholder="123 Medical Plaza, Suite 4B"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="City">
          <TextInput
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            placeholder="New York"
          />
        </Field>
        <Field label="Country">
          <TextInput
            value={form.country}
            onChange={(e) => set("country", e.target.value)}
            placeholder="United States"
          />
        </Field>
      </div>
      <Field label="Consultation Fee (USD)">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-medium text-sm">
            $
          </span>
          <TextInput
            value={form.consultationFee}
            onChange={(e) => set("consultationFee", e.target.value)}
            placeholder="150"
            className="pl-8"
          />
        </div>
      </Field>
      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-outline-variant hover:bg-surface-container transition-colors">
        <div
          onClick={() => set("onlineConsultation", !form.onlineConsultation)}
          className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${form.onlineConsultation ? "bg-primary border-primary" : "border-outline-variant"}`}
        >
          {form.onlineConsultation && (
            <CheckCircle size={12} className="text-on-primary" />
          )}
        </div>
        <div>
          <div className="text-sm font-medium text-on-surface">
            Available for Online Consultations
          </div>
          <div className="text-xs text-on-surface-variant">
            Patients can book video/chat sessions
          </div>
        </div>
      </label>
    </div>
  );
}

function Step5({
  form,
  set,
}: {
  form: DoctorForm;
  set: (k: keyof DoctorForm, v: any) => void;
}) {
  const addSlot = () =>
    set("slots", [
      ...form.slots,
      { day: "Monday", from: "09:00", to: "17:00" },
    ]);
  const removeSlot = (i: number) =>
    set(
      "slots",
      form.slots.filter((_, idx) => idx !== i),
    );
  const updateSlot = (i: number, field: keyof TimeSlot, value: string) => {
    const updated = form.slots.map((s, idx) =>
      idx === i ? { ...s, [field]: value } : s,
    );
    set("slots", updated);
  };
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-on-surface">Availability</h3>
        <p className="text-sm text-on-surface-variant mt-0.5">
          Set the days and times you're available for consultations.
        </p>
      </div>
      <div className="space-y-2">
        {form.slots.map((slot, i) => (
          <div
            key={i}
            className="flex items-center gap-2 p-3 rounded-xl border border-outline-variant bg-surface-container"
          >
            <SelectInput
              value={slot.day}
              onChange={(e) => updateSlot(i, "day", e.target.value)}
              className="flex-1 text-sm py-2"
            >
              {DAYS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </SelectInput>
            <input
              type="time"
              value={slot.from}
              onChange={(e) => updateSlot(i, "from", e.target.value)}
              className="px-2 py-2 rounded-lg border border-outline-variant text-sm text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <span className="text-on-surface-variant text-xs">to</span>
            <input
              type="time"
              value={slot.to}
              onChange={(e) => updateSlot(i, "to", e.target.value)}
              className="px-2 py-2 rounded-lg border border-outline-variant text-sm text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => removeSlot(i)}
              className="text-error hover:bg-error/10 p-1.5 rounded-lg transition-colors shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addSlot}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-primary text-primary text-sm font-medium hover:bg-primary/5 transition-colors w-full justify-center"
      >
        <Plus size={15} /> Add Time Slot
      </button>
      {form.slots.length === 0 && (
        <p className="text-xs text-on-surface-variant text-center py-2">
          Add at least one availability slot.
        </p>
      )}
    </div>
  );
}

function Step6({
  form,
  set,
}: {
  form: DoctorForm;
  set: (k: keyof DoctorForm, v: any) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    set("documents", [...form.documents, ...Array.from(files)]);
  };
  const removeDoc = (i: number) =>
    set(
      "documents",
      form.documents.filter((_, idx) => idx !== i),
    );
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-on-surface">Documents Upload</h3>
        <p className="text-sm text-on-surface-variant mt-0.5">
          Upload your medical license, degree certificates, and ID proof.
        </p>
      </div>
      <div
        onClick={() => ref.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        className="border-2 border-dashed border-outline-variant rounded-2xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group"
      >
        <Upload
          size={28}
          className="mx-auto mb-3 text-on-surface-variant group-hover:text-primary transition-colors"
        />
        <p className="text-sm font-medium text-on-surface">
          Drag & drop files here
        </p>
        <p className="text-xs text-on-surface-variant mt-1">
          or <span className="text-primary underline">browse files</span> — PDF,
          JPG, PNG up to 10 MB each
        </p>
        <input
          ref={ref}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {form.documents.length > 0 && (
        <div className="space-y-2">
          {form.documents.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant bg-surface-container"
            >
              <FileText size={16} className="text-primary shrink-0" />
              <span className="text-sm text-on-surface flex-1 truncate">
                {file.name}
              </span>
              <span className="text-xs text-on-surface-variant">
                {(file.size / 1024).toFixed(0)} KB
              </span>
              <button
                type="button"
                onClick={() => removeDoc(i)}
                className="text-on-surface-variant hover:text-error transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="bg-surface-tint/10 rounded-xl p-4">
        <p className="text-xs font-semibold text-on-surface mb-1">
          Required Documents
        </p>
        <ul className="text-xs text-on-surface-variant space-y-0.5">
          <li>• Valid medical license / registration certificate</li>
          <li>• Highest degree certificate (MD, MBBS, etc.)</li>
          <li>• Government-issued ID (passport or national ID)</li>
        </ul>
      </div>
    </div>
  );
}

function Step7({
  form,
  set,
}: {
  form: DoctorForm;
  set: (k: keyof DoctorForm, v: any) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-on-surface">WhatsApp Contact</h3>
        <p className="text-sm text-on-surface-variant mt-0.5">
          Allow patients to reach you directly via WhatsApp (optional).
        </p>
      </div>
      {!form.whatsappOptOut && (
        <Field label="WhatsApp Number">
          <div className="relative">
            <Phone
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <TextInput
              value={form.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
              placeholder="+1 234 567 8900"
              style={{ paddingLeft: "2.5rem" }}
            />
          </div>
        </Field>
      )}
      <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border border-outline-variant hover:bg-surface-container transition-colors">
        <div
          onClick={() => {
            set("whatsappOptOut", !form.whatsappOptOut);
            if (!form.whatsappOptOut) set("whatsapp", "");
          }}
          className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors cursor-pointer ${form.whatsappOptOut ? "bg-primary border-primary" : "border-outline-variant"}`}
        >
          {form.whatsappOptOut && (
            <CheckCircle size={12} className="text-on-primary" />
          )}
        </div>
        <div>
          <div className="text-sm font-medium text-on-surface">
            Skip this step
          </div>
          <div className="text-xs text-on-surface-variant mt-0.5">
            I don't want to share my WhatsApp number with patients
          </div>
        </div>
      </label>
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-emerald-800 mb-1">
          Why add WhatsApp?
        </p>
        <p className="text-xs text-emerald-700">
          Patients can send quick questions, follow-ups, or appointment
          reminders directly — leading to higher satisfaction and fewer
          no-shows.
        </p>
      </div>
    </div>
  );
}

function Step8({ form }: { form: DoctorForm }) {
  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto mb-3">
          <CheckCircle size={28} className="text-primary" />
        </div>
        <h3 className="text-lg font-bold text-on-surface">Review & Submit</h3>
        <p className="text-sm text-on-surface-variant mt-1">
          Please review your information before submitting.
        </p>
      </div>
      <div className="space-y-3 text-sm">
        {[
          { label: "Name", value: form.fullName },
          { label: "Email", value: form.email },
          { label: "Specialty", value: form.primarySpecialty },
          { label: "License", value: form.licenseNumber },
          { label: "Clinic", value: form.clinicName },
          { label: "City", value: form.city },
          {
            label: "Fee",
            value: form.consultationFee ? `$${form.consultationFee}` : "—",
          },
          {
            label: "Availability slots",
            value: `${form.slots.length} slot${form.slots.length !== 1 ? "s" : ""}`,
          },
          {
            label: "Documents",
            value: `${form.documents.length} file${form.documents.length !== 1 ? "s" : ""}`,
          },
          {
            label: "WhatsApp",
            value: form.whatsappOptOut ? "Skipped" : form.whatsapp || "—",
          },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="flex justify-between items-center py-2 border-b border-outline-variant/50 last:border-0"
          >
            <span className="text-on-surface-variant text-xs font-medium uppercase tracking-wide">
              {label}
            </span>
            <span className="text-on-surface font-medium text-right max-w-[60%] truncate">
              {value || "—"}
            </span>
          </div>
        ))}
      </div>
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <p className="text-xs text-primary font-medium">
          Your profile will be reviewed within 24–48 hours. You'll receive a
          confirmation email once approved.
        </p>
      </div>
    </div>
  );
}

// ─── Patient Register ─────────────────────────────────────────────────────────

function PatientRegister({
  onSubmit,
  loading,
  error,
  fullName,
  setFullName,
  email,
  setEmail,
  password,
  setPassword,
}: {
  onSubmit: (e: FormEvent) => void;
  loading: boolean;
  error: string | null;
  fullName: string;
  setFullName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Full Name">
        <div className="relative">
          <User
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Smith"
            className={inputCls}
            style={{ paddingLeft: "2.5rem" }}
          />
        </div>
      </Field>
      <Field label="Email Address">
        <div className="relative">
          <Mail
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="patient@example.com"
            className={inputCls}
            style={{ paddingLeft: "2.5rem" }}
          />
        </div>
      </Field>
      <Field label="Password">
        <PasswordInput value={password} onChange={setPassword} />
      </Field>
      {error && <ErrorBox>{error}</ErrorBox>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
      >
        {loading ? "Creating account…" : "Create Patient Account"}
      </button>
    </form>
  );
}

// ─── Shared error box ─────────────────────────────────────────────────────────

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-error/10 border border-error/20 px-4 py-3 text-sm text-error">
      <X size={14} className="shrink-0" />
      {children}
    </div>
  );
}

// ─── Main AuthForm ────────────────────────────────────────────────────────────

export function AuthForm() {
  const { saveToken } = useAuthToken();
  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<Role>("PATIENT");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Patient register state
  const [patientEmail, setPatientEmail] = useState("");
  const [patientPassword, setPatientPassword] = useState("");
  const [patientName, setPatientName] = useState("");

  // Doctor multi-step state
  const [step, setStep] = useState(0);
  const [doctorForm, setDoctorForm] = useState<DoctorForm>({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    gender: "",
    licenseNumber: "",
    experience: "",
    degree: "",
    university: "",
    graduationYear: "",
    primarySpecialty: "",
    subSpecialties: [],
    conditions: [],
    clinicName: "",
    clinicAddress: "",
    city: "",
    country: "",
    consultationFee: "",
    onlineConsultation: false,
    slots: [{ day: "Monday", from: "09:00", to: "17:00" }],
    documents: [],
    whatsapp: "",
    whatsappOptOut: false,
  });

  const setDoctorField = (key: keyof DoctorForm, value: any) =>
    setDoctorForm((p) => ({ ...p, [key]: value }));

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authService.login({
        email: loginEmail,
        password: loginPassword,
      });
      saveToken(res.accessToken);
      window.location.href = "/dashboard";
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      console.log('patient details:::::', {email: patientEmail, password: patientPassword, fullName: patientName});
      const res = await authService.register({
        email: patientEmail,
        password: patientPassword,
        fullName: patientName,
        role: "PATIENT",
      });
      saveToken(res.accessToken);
      window.location.href = "/dashboard";
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await authService.register({ role: "DOCTOR", ...doctorForm });
      saveToken(res.accessToken);
      window.location.href = "/dashboard";
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const doctorStepComponents = [
    <Step1 form={doctorForm} set={setDoctorField} />,
    <Step2 form={doctorForm} set={setDoctorField} />,
    <Step3 form={doctorForm} set={setDoctorField} />,
    <Step4 form={doctorForm} set={setDoctorField} />,
    <Step5 form={doctorForm} set={setDoctorField} />,
    <Step6 form={doctorForm} set={setDoctorField} />,
    <Step7 form={doctorForm} set={setDoctorField} />,
    <Step8 form={doctorForm} />,
  ];

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full">
        {/* Brand mark */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-on-primary mb-3">
            <Stethoscope size={22} />
          </div>
          <h1 className="text-2xl font-bold text-on-surface">Lumina Health</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Healthcare made accessible
          </p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl shadow-lg overflow-hidden">
          {/* Mode tabs */}
          <div className="flex border-b border-outline-variant">
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setStep(0);
                  setError(null);
                }}
                className={`flex-1 py-4 text-sm font-semibold capitalize transition-colors ${mode === m ? "text-primary border-b-2 border-primary bg-primary/5" : "text-on-surface-variant hover:bg-surface-container"}`}
              >
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* ── LOGIN ── */}
            {mode === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="mb-2">
                  <h2 className="text-lg font-bold text-on-surface">
                    Welcome back
                  </h2>
                  <p className="text-sm text-on-surface-variant">
                    Sign in to your account
                  </p>
                </div>
                <Field label="Email">
                  <div className="relative">
                    <Mail
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
                    />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="name@example.com"
                      className={inputCls}
                      style={{ paddingLeft: "2.5rem" }}
                    />
                  </div>
                </Field>
                <Field label="Password">
                  <PasswordInput
                    value={loginPassword}
                    onChange={setLoginPassword}
                  />
                </Field>
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                {error && <ErrorBox>{error}</ErrorBox>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
                >
                  {loading ? "Signing in…" : "Sign In"}
                </button>
              </form>
            )}

            {/* ── REGISTER ── */}
            {mode === "register" && (
              <div>
                {/* Role selector — only shown on first step */}
                {(role === "PATIENT" || step === 0) && (
                  <div className="mb-5">
                    {role === "PATIENT" && (
                      <div>
                        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                          I am a
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {(["PATIENT", "DOCTOR"] as Role[]).map((r) => {
                            const Icon = r === "PATIENT" ? User : Stethoscope;
                            return (
                              <button
                                key={r}
                                type="button"
                                onClick={() => {
                                  setRole(r);
                                  setStep(0);
                                }}
                                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${role === r ? "border-primary bg-primary/10 text-primary" : "border-outline-variant text-on-surface-variant hover:border-primary/40"}`}
                              >
                                <Icon size={16} />
                                {r === "PATIENT" ? "Patient" : "Doctor"}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {role === "DOCTOR" && step === 0 && (
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                          Registering as
                        </p>
                        <button
                          type="button"
                          onClick={() => setRole("PATIENT")}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <User size={11} /> Switch to Patient
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ── PATIENT simple form ── */}
                {role === "PATIENT" && (
                  <PatientRegister
                    onSubmit={handlePatientRegister}
                    loading={loading}
                    error={error}
                    fullName={patientName}
                    setFullName={setPatientName}
                    email={patientEmail}
                    setEmail={setPatientEmail}
                    password={patientPassword}
                    setPassword={setPatientPassword}
                  />
                )}

                {/* ── DOCTOR multi-step ── */}
                {role === "DOCTOR" && (
                  <div>
                    <StepProgress current={step} total={STEPS.length} />
                    <div className="min-h-85">{doctorStepComponents[step]}</div>
                    {error && (
                      <div className="mt-4">
                        <ErrorBox>{error}</ErrorBox>
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-6 pt-4 border-t border-outline-variant">
                      {step > 0 && (
                        <button
                          type="button"
                          onClick={() => setStep((s) => s - 1)}
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-outline-variant text-sm font-medium text-on-surface hover:bg-surface-container transition-colors"
                        >
                          <ChevronLeft size={15} /> Back
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={
                          step < STEPS.length - 1
                            ? () => setStep((s) => s + 1)
                            : handleDoctorSubmit
                        }
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
                      >
                        {step < STEPS.length - 1 ? (
                          <>
                            <span>Continue</span>
                            <ChevronRight size={15} />
                          </>
                        ) : loading ? (
                          "Submitting…"
                        ) : (
                          <>
                            <CheckCircle size={15} />
                            <span>Submit Application</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-on-surface-variant mt-6">
          By continuing, you agree to our{" "}
          <a href="/terms" className="text-primary hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
