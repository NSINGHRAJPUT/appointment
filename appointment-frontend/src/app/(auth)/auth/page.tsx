import { AuthForm } from '@/components/auth-form';

export default function AuthPage() {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-120px)] w-full max-w-5xl items-center gap-8 px-6 py-10 md:grid-cols-2">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">One account for appointments, chat, and calls</h1>
        <p className="mt-3 text-zinc-600">Patients can book and review. Doctors can onboard, manage slots, and consult via realtime chat.</p>
      </div>
      <AuthForm />
    </main>
  );
}
