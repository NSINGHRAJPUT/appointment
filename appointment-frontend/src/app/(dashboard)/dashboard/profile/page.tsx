'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getStoredToken } from '@/hooks/use-auth';
import { authService } from '@/services/auth.service';
import { PatientProfileEditor } from '@/components/profile/PatientProfileEditor';
import { DoctorProfileEditor } from '@/components/profile/DoctorProfileEditor';

export default function ProfilePage() {
  const router = useRouter();
  const [role, setRole] = useState<'PATIENT' | 'DOCTOR' | 'ADMIN' | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.replace('/auth');
      return;
    }

    authService
      .me(token)
      .then((data) => {
        const me = data as { role?: string };
        if (me.role === 'PATIENT' || me.role === 'DOCTOR' || me.role === 'ADMIN') {
          setRole(me.role);
          return;
        }
        router.replace('/dashboard');
      })
      .catch(() => router.replace('/auth'));
  }, [router]);

  if (!role) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  if (role === 'PATIENT') return <PatientProfileEditor />;
  return <DoctorProfileEditor />;
}
