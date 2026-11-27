import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-indigo-100">
              CK
            </div>
            <div>
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">ComedKares</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Multi-Tenant AI Receptionist
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Staff Portal
            </Link>
            <Link
              href="/onboarding"
              className="text-sm font-semibold px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all"
            >
              Onboard Clinic
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Zero-Infrastructure Script Integration • Multilingual Voice
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight mb-6">
            Plug-and-Play Voice-First <br />
            <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Agentic AI Receptionist
            </span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed mb-10">
            Empower multiple healthcare clinics with an autonomous AI receptionist. Understands English, Hindi, and Kannada voice & text, executes atomic 5-minute slot locks, verifies patient OTPs, initiates Razorpay payments, and escalates emergency red-flags in real time.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/dashboard"
              className="px-6 py-3.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
            >
              <span>Open Staff Dashboard</span>
              <span>→</span>
            </Link>
            <Link
              href="/onboarding"
              className="px-6 py-3.5 rounded-xl bg-white border border-slate-300 text-slate-800 font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <span>Generate Embed Script</span>
            </Link>
          </div>
        </div>

        {/* Live Demo Clinic Cards */}
        <div className="mt-20">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-slate-900">
              Interactive Multi-Tenant Demos
            </h2>
            <p className="text-sm text-slate-600">
              The exact same widget script (<code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">public/widget.js</code>) embedded into two completely distinct clinic websites:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Clinic Alpha Demo */}
            <div className="bg-white rounded-2xl border border-indigo-100 p-8 shadow-xl shadow-indigo-50/50 hover:border-indigo-300 transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-0 group-hover:scale-105 transition-transform"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                    Demo Clinic 1
                  </span>
                  <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    clinic_alpha
                  </span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">
                  Sparsh Dental & Maxillofacial Clinic
                </h3>
                <p className="text-sm text-slate-600 mb-6">
                  Specializing in root canals, clear aligners, and dental implants. Embedded with an Indigo-themed AI receptionist.
                </p>
                <div className="space-y-2 text-xs text-slate-500 mb-6">
                  <div>• Doctors: Dr. Priya Sharma, Dr. Vikram Kulkarni, Dr. Sandeep Narayan</div>
                  <div>• Consultation Fees: ₹500 - ₹900</div>
                  <div>• Emergency Line: +91 80 2345 6789</div>
                </div>
                <a
                  href="/demo/clinic-alpha.html"
                  target="_blank"
                  className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all"
                >
                  Launch Clinic Alpha Demo ↗
                </a>
              </div>
            </div>

            {/* Clinic Beta Demo */}
            <div className="bg-white rounded-2xl border border-emerald-100 p-8 shadow-xl shadow-emerald-50/50 hover:border-emerald-300 transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-0 group-hover:scale-105 transition-transform"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                    Demo Clinic 2
                  </span>
                  <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    clinic_beta
                  </span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">
                  Sahyadri Ortho & Spine Center
                </h3>
                <p className="text-sm text-slate-600 mb-6">
                  Specializing in robotic joint replacement, sciatica disc surgery, and sports injuries. Embedded with an Emerald-themed AI receptionist.
                </p>
                <div className="space-y-2 text-xs text-slate-500 mb-6">
                  <div>• Doctors: Dr. Rajeshwar Rao, Dr. Ananya Deshmukh, Dr. Harish Gowda</div>
                  <div>• Consultation Fees: ₹650 - ₹1000</div>
                  <div>• Emergency Trauma: +91 80 8765 4321</div>
                </div>
                <a
                  href="/demo/clinic-beta.html"
                  target="_blank"
                  className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all"
                >
                  Launch Clinic Beta Demo ↗
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Architectural Highlights */}
        <div className="mt-20 border-t border-slate-200 pt-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <div className="text-2xl mb-3">🗣️</div>
              <h4 className="font-bold text-slate-900 mb-1">Multilingual Voice</h4>
              <p className="text-xs text-slate-600">
                Native Web Speech API voice input & output for English, Hindi (Devanagari), and Kannada.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <div className="text-2xl mb-3">🔒</div>
              <h4 className="font-bold text-slate-900 mb-1">Atomic 5-Min Slot Lock</h4>
              <p className="text-xs text-slate-600">
                Single conditional update prevents double bookings with automatic live hold countdown timer.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <div className="text-2xl mb-3">🚨</div>
              <h4 className="font-bold text-slate-900 mb-1">Emergency Red-Flags</h4>
              <p className="text-xs text-slate-600">
                Detects chest pain or stroke symptoms, stops booking, and triggers instant hospital staff alerts.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <div className="text-2xl mb-3">💳</div>
              <h4 className="font-bold text-slate-900 mb-1">Razorpay & HMAC</h4>
              <p className="text-xs text-slate-600">
                Secure checkout modal with HMAC-SHA256 signature verification and immutable audit logging.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        ComedKares Multi-Clinic Healthcare Receptionist Platform • Strictly Multi-Tenant & Zero-Cost Stack
      </footer>
    </div>
  );
}
