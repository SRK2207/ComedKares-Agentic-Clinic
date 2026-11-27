'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [clinicName, setClinicName] = useState('Apollo Spectra Multispeciality');
  const [clinicSlug, setClinicSlug] = useState('apollo_spectra');
  const [themeColor, setThemeColor] = useState('#2563eb');
  const [emergencyPhone, setEmergencyPhone] = useState('+91 80 4455 6677');
  const [bookingPolicy, setBookingPolicy] = useState('Patients must arrive 15 minutes before the booked slot.');
  
  const [doctors, setDoctors] = useState([
    { name: 'Dr. Arun Kumar', qualification: 'MBBS, MD', department: 'General Medicine', fee: 600 },
    { name: 'Dr. Shalini Gupta', qualification: 'MBBS, DNB (Pediatrics)', department: 'Pediatrics', fee: 750 },
  ]);

  const [newDocName, setNewDocName] = useState('');
  const [newDocDept, setNewDocDept] = useState('');
  const [newDocFee, setNewDocFee] = useState(500);

  const [copied, setCopied] = useState(false);

  const embedScriptTag = `<script src="${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/widget.js" data-clinic-id="${clinicSlug}" async></script>`;

  const addDoctor = () => {
    if (!newDocName || !newDocDept) return;
    setDoctors([...doctors, { name: newDocName, qualification: 'MBBS, MD', department: newDocDept, fee: Number(newDocFee) }]);
    setNewDocName('');
    setNewDocDept('');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedScriptTag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl">
              CK
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Self-Service Clinic Onboarding</h1>
              <p className="text-xs text-slate-500">Configure your clinic and generate your zero-infrastructure embed script</p>
            </div>
          </div>
          <Link href="/dashboard" className="text-xs font-bold text-indigo-600 hover:underline">
            Go to Staff Dashboard →
          </Link>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-xl border border-slate-200">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>1</span>
            <span className="text-xs">Clinic Profile</span>
          </div>
          <div className="flex-1 h-0.5 mx-4 bg-slate-200"></div>
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>2</span>
            <span className="text-xs">Doctors & Specialties</span>
          </div>
          <div className="flex-1 h-0.5 mx-4 bg-slate-200"></div>
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>3</span>
            <span className="text-xs">Generate Embed Script</span>
          </div>
        </div>

        {/* Step 1: Clinic Identity */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Step 1: Clinic Profile & Brand Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinic Name</label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={(e) => {
                    setClinicName(e.target.value);
                    setClinicSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'));
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tenant Slug (Unique ID for script embed)</label>
                <input
                  type="text"
                  value={clinicSlug}
                  onChange={(e) => setClinicSlug(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono bg-slate-50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Widget Brand Theme Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="w-10 h-10 rounded border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Trauma Hotline</label>
                  <input
                    type="text"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Booking Policy & Notice</label>
                <textarea
                  value={bookingPolicy}
                  onChange={(e) => setBookingPolicy(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="py-2.5 px-6 rounded-lg bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700"
              >
                Next: Configure Doctors →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Doctors & Specialties */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Step 2: Doctors, Consultation Fees & Specialties</h2>
            
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <input
                  type="text"
                  placeholder="Doctor Name (e.g. Dr. Rajesh)"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
                <input
                  type="text"
                  placeholder="Department (e.g. Cardiology)"
                  value={newDocDept}
                  onChange={(e) => setNewDocDept(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
                <input
                  type="number"
                  placeholder="Fee (INR)"
                  value={newDocFee}
                  onChange={(e) => setNewDocFee(Number(e.target.value))}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={addDoctor}
                  className="py-2 px-3 bg-indigo-600 text-white font-bold text-xs rounded-lg hover:bg-indigo-700"
                >
                  + Add Doctor
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {doctors.map((doc, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-900">{doc.name}</div>
                      <div className="text-xs text-slate-500">{doc.department} • {doc.qualification}</div>
                    </div>
                    <div className="text-sm font-semibold text-indigo-600">
                      ₹{doc.fee}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="py-2.5 px-6 rounded-lg border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="py-2.5 px-6 rounded-lg bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700"
              >
                Next: Get Embed Snippet →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Embed Script Generator */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xl mb-4">
              ✓
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Clinic Ready for Integration!</h2>
            <p className="text-sm text-slate-600 mb-6">
              Paste the single line below into any HTML page on your existing clinic website before the closing <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">&lt;/body&gt;</code> tag.
            </p>

            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-sm relative mb-6 overflow-x-auto">
              <code>{embedScriptTag}</code>
              <button
                onClick={copyToClipboard}
                className="absolute top-3 right-3 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-xs font-bold transition-all"
              >
                {copied ? '✓ Copied!' : 'Copy Script'}
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 mb-8">
              <strong>💡 Zero Infrastructure Requirement:</strong> The script injects an isolated Shadow DOM container (<code className="font-mono">#comedkares-widget-root</code>) that guarantees zero CSS leakage or conflicts with your clinic website's existing styling.
            </div>

            <div className="flex gap-4">
              <Link
                href="/dashboard"
                className="flex-1 py-3 text-center rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700"
              >
                Open Staff Dashboard
              </Link>
              <Link
                href="/"
                className="py-3 px-6 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
