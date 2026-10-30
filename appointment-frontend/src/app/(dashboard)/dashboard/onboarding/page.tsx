"use client";

import { useState, useEffect } from "react";
import { doctorService } from '@/services/doctor.service';
import { getStoredToken } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from "next/navigation";
import { Upload, X, File, Loader2 } from "lucide-react";

interface DoctorDocument {
  id: string;
  title: string;
  fileUrl: string;
  createdAt: string;
}

export default function DoctorOnboardingPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
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
  
  // Document management state
  const [documents, setDocuments] = useState<DoctorDocument[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [deleting, setDeleting] = useState<string | null>(null);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  // Fetch existing documents on mount
  useEffect(() => {
    const fetchDocuments = async () => {
      const token = getStoredToken();
      if (!token) return;
      
      try {
        setDocumentsLoading(true);
        const data = await doctorService.listDocuments(token);
        setDocuments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch documents:', err);
      } finally {
        setDocumentsLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  // File validation helper
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: `Invalid file type: ${file.name}. Only PDF, JPG, and PNG are allowed.` };
    }
    
    if (file.size > maxSize) {
      return { valid: false, error: `File too large: ${file.name}. Maximum size is 5MB.` };
    }
    
    return { valid: true };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + selectedFiles.length > 5) {
      setMessage("Error: Maximum 5 files allowed per upload");
      return;
    }

    const validFiles: File[] = [];
    let hasError = false;

    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) {
        setMessage(`Error: ${validation.error}`);
        hasError = true;
        break;
      }
      validFiles.push(file);
    }

    if (!hasError) {
      setSelectedFiles([...selectedFiles, ...validFiles]);
      setMessage(null);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const uploadDocuments = async () => {
    if (selectedFiles.length === 0) return;

    const token = getStoredToken();
    if (!token) {
      setMessage("Error: Please login as doctor");
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];

        try {
          const newDoc = await doctorService.uploadDocument(token, file, file.name);
          setDocuments((prev) => [...prev, newDoc as DoctorDocument]);
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        } catch (err) {
          setMessage(`Error: Failed to upload ${file.name}`);
          setUploading(false);
          return;
        }
      }

      setMessage("Documents uploaded successfully!");
      setSelectedFiles([]);
      setUploadProgress({});
    } catch (err) {
      setMessage(`Error: ${(err as Error).message}`);
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (docId: string) => {
    const token = getStoredToken();
    if (!token) {
      setMessage("Error: Please login as doctor");
      return;
    }

    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    setDeleting(docId);
    setMessage(null);

    try {
      await doctorService.deleteDocument(token, docId);

      setDocuments(documents.filter(d => d.id !== docId));
      setMessage("Document deleted successfully");
    } catch (err) {
      setMessage(`Error: ${(err as Error).message}`);
    } finally {
      setDeleting(null);
    }
  };

  const VET_SPECIALTIES = [
    "General Practice",
    "Surgery",
    "Dermatology",
    "Dentistry",
    "Emergency Care",
    "Nutrition",
    "Behavior",
    "Exotic Pets",
    "Cardiology",
    "Neurology",
    "Ophthalmology",
    "Orthopedics",
  ];

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Card className="space-y-5 rounded-2xl border-outline-variant p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-on-surface">
              Vet onboarding
            </h1>
            <p className="text-sm text-on-surface-variant">
              A quick 4-step profile submission for admin review.
            </p>
          </div>
          <Badge tone="neutral">Step {step} / 4</Badge>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { n: 1, label: "Basics" },
            { n: 2, label: "Clinic & Pricing" },
            { n: 3, label: "Documents" },
            { n: 4, label: "Submit" },
          ].map((s) => (
            <div
              key={s.n}
              className={`rounded-2xl border px-3 py-2 text-center ${
                step === s.n
                  ? "border-primary bg-primary/5"
                  : "border-outline-variant bg-surface-container-lowest"
              }`}
            >
              <p
                className={
                  step === s.n
                    ? "text-sm font-semibold text-primary"
                    : "text-sm text-on-surface-variant"
                }
              >
                {s.label}
              </p>
              <p
                className={
                  step === s.n
                    ? "mt-0.5 text-xs font-medium text-primary"
                    : "mt-0.5 text-xs text-on-surface-variant"
                }
              >
                #{s.n}
              </p>
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm text-on-surface-variant">Specialization</span>
              <select
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select specialty</option>
                {VET_SPECIALTIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
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
              <span className="text-sm text-on-surface-variant">Bio</span>
              <textarea
                className="min-h-[140px] w-full rounded-2xl border border-outline-variant bg-surface-container-lowest p-3 text-sm text-on-surface focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your approach to pet care, species you treat, and how pet parents can benefit from you."
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
                className="rounded border-outline-variant text-primary focus:ring-primary"
              />
              <label htmlFor="onlineConsultation" className="text-sm text-on-surface">
                Offer online video consultations
              </label>
            </div>
            <p className="text-xs text-on-surface-variant">
              You can update this later—admin review happens after submission.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-on-surface">Document Management</h3>
              <p className="text-sm text-on-surface-variant mt-1">
                Upload professional documents (licenses, certificates) to complete your profile.
              </p>
            </div>

            {/* Existing Documents */}
            {documentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-on-surface-variant" />
              </div>
            ) : documents.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-on-surface">Existing Documents</p>
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container-low p-3"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <File className="w-4 h-4 text-on-surface-variant shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-on-surface truncate">
                            {doc.title}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        disabled={deleting === doc.id}
                        className="ml-2 p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded transition-colors disabled:opacity-50"
                        title="Delete document"
                      >
                        {deleting === doc.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-outline-variant bg-surface-container-low p-4 text-center">
                <p className="text-sm text-on-surface-variant">No documents uploaded yet</p>
              </div>
            )}

            {/* File Upload */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-on-surface">Upload New Documents</p>
              <div className="rounded-lg border-2 border-dashed border-outline-variant p-6 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="w-5 h-5 text-on-surface-variant" />
                  <div>
                    <p className="text-sm font-medium text-on-surface">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-on-surface-variant mt-1">
                      PDF, JPG, PNG up to 5MB each (max 5 files)
                    </p>
                  </div>
                </label>
              </div>

              {/* Selected Files Preview */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-on-surface">
                    Selected Files ({selectedFiles.length})
                  </p>
                  <div className="space-y-2">
                    {selectedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg border border-outline-variant bg-white p-3"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <File className="w-4 h-4 text-on-surface-variant shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-on-surface truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-on-surface-variant">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(idx)}
                          disabled={uploading}
                          className="ml-2 p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded transition-colors disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Button */}
              {selectedFiles.length > 0 && (
                <Button
                  onClick={uploadDocuments}
                  loading={uploading}
                  disabled={uploading}
                  className="w-full"
                >
                  {uploading ? "Uploading..." : "Upload Documents"}
                </Button>
              )}
            </div>

            {message && (
              <div className={`rounded-lg p-3 text-sm ${
                message.includes("Error") || message.includes("failed")
                  ? "bg-error/10 text-error border border-error/20"
                  : "bg-primary/10 text-primary border border-primary/20"
              }`}>
                {message}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-on-surface-variant">
              Review your details before submitting for admin approval.
            </p>
            <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4 text-sm">
              <p className="font-medium text-on-surface">
                {specialization || "Specialization"}
              </p>
              <p className="text-on-surface-variant mt-1">
                {clinicName || "Clinic"} • {city || "City"}
              </p>
              <p className="text-on-surface-variant mt-1">
                Price: {priceInr ? `INR ${priceInr}` : "—"}
              </p>
              <p className="text-on-surface-variant mt-3 whitespace-pre-wrap">
                {bio ? bio.slice(0, 260) : "Bio not added yet."}
              </p>
            </div>
          </div>
        )}

        {message && (
          <p className="rounded-lg bg-surface-container p-2 text-sm text-on-surface">
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
          {step < 4 ? (
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
