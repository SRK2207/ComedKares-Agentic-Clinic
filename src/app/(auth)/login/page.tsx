'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [clinicId, setClinicId] = useState('clinic_alpha');
  const [role, setRole] = useState<'ADMIN' | 'RECEPTIONIST'>('ADMIN');
  const [email, setEmail] = useState('staff@sparshdental.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const handleClinicChange = (slug: string) => {
    setClinicId(slug);
    if (slug === 'clinic_alpha') {
      setEmail('staff@sparshdental.com');
    } else {
      setEmail('staff@sahyadriortho.com');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push(`/dashboard?clinicId=${clinicId}&role=${role}`);
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl">
            CK
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Clinic Staff Portal</h1>
            <p className="text-xs text-slate-500">Sign in to manage appointments & escalations</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Select Clinic Tenant
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleClinicChange('clinic_alpha')}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold text-left transition-all ${
                  clinicId === 'clinic_alpha'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                🦷 Sparsh Dental
              </button>
              <button
                type="button"
                onClick={() => handleClinicChange('clinic_beta')}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold text-left transition-all ${
                  clinicId === 'clinic_beta'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                🦴 Sahyadri Ortho
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Staff Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('ADMIN')}
                className={`py-1.5 px-3 rounded-lg border text-xs font-semibold text-center transition-all ${
                  role === 'ADMIN'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-700'
                }`}
              >
                Clinic Admin
              </button>
              <button
                type="button"
                onClick={() => setRole('RECEPTIONIST')}
                className={`py-1.5 px-3 rounded-lg border text-xs font-semibold text-center transition-all ${
                  role === 'RECEPTIONIST'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-700'
                }`}
              >
                Front Receptionist
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-600"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-200 text-center">
          <Link href="/onboarding" className="text-xs font-semibold text-indigo-600 hover:underline">
            Need to register a new clinic? Start onboarding →
          </Link>
        </div>
      </div>
    </div>
  );
}
