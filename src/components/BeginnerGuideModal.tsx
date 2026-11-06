import React from 'react';
import {
  X,
  BookOpen,
  Mic,
  Cpu,
  Mail,
  ShieldCheck,
  Terminal,
  CheckCircle2,
  FileText,
  Key
} from 'lucide-react';

interface BeginnerGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BeginnerGuideModal: React.FC<BeginnerGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/95">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">MeetMind AI — Beginner's Architecture Guide</h3>
              <p className="text-xs text-slate-400">
                Simple explanations of how each component works under the hood
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto text-xs sm:text-sm text-slate-300">
          {/* Section 1: How the whole app works */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h4>1. What is MeetMind AI and How Does it Work?</h4>
            </div>
            <p className="leading-relaxed">
              MeetMind AI is a full-stack web application designed to save you from listening to long audio recordings. It works in three simple phases:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="font-bold text-indigo-300 block">Phase 1: Audio Capture</span>
                <p className="text-slate-400 text-xs">
                  Your browser records sound through your microphone using the HTML5 MediaRecorder API or accepts uploaded audio files (.mp3, .wav, .m4a).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="font-bold text-indigo-300 block">Phase 2: AI Speech & Analysis</span>
                <p className="text-slate-400 text-xs">
                  The audio is transcribed accurately using Google Gemini AI, separating speakers, extracting 8 distinct summary sections, and identifying action items.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="font-bold text-indigo-300 block">Phase 3: Gmail Collaboration</span>
                <p className="text-slate-400 text-xs">
                  Using official Google OAuth 2.0, you can search relevant meeting emails and dispatch beautiful summary emails directly with user approval.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Browser Recording & Privacy */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
              <Mic className="w-4 h-4" />
              <h4>2. How Browser Recording Works with Strict Privacy</h4>
            </div>
            <p className="leading-relaxed">
              When you click <strong className="text-white">"Start Meeting Recording"</strong>, your browser asks for permission to access your microphone. MeetMind AI uses the Web Audio API to render live frequency waves on screen so you can see your voice in real time.
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-xs">
              <li>No audio is recorded in secret — the microphone indicator is visible at all times.</li>
              <li>You can pause or stop whenever confidential matters arise.</li>
              <li>Audio data is only submitted when you explicitly click "Generate AI Transcript".</li>
            </ul>
          </div>

          {/* Section 3: Gmail Integration & Security */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
              <Mail className="w-4 h-4" />
              <h4>3. Gmail Integration & Security Explained</h4>
            </div>
            <p className="leading-relaxed">
              We use Google's industry-standard <strong className="text-white">OAuth 2.0</strong> authorization protocol:
            </p>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong className="text-slate-200">No passwords stored:</strong> MeetMind never sees or stores your Google password.</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong className="text-slate-200">In-memory tokens:</strong> The OAuth access token is retained only in browser memory and is never written to disk or localStorage.</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong className="text-slate-200">No silent dispatches:</strong> Sending an email requires your explicit review and confirmation checkbox every single time.</span>
              </div>
            </div>
          </div>

          {/* Section 4: Running Locally for Beginners */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
              <Terminal className="w-4 h-4" />
              <h4>4. How to Run this Project Locally on Your Laptop</h4>
            </div>
            <p className="leading-relaxed">
              As a beginner, here are the exact steps to run MeetMind AI on your machine:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-400">
              <li>
                <span className="text-slate-200 font-semibold">Install Node.js:</span> Download and install Node.js (version 20 or newer) from{' '}
                <span className="text-indigo-400">nodejs.org</span>.
              </li>
              <li>
                <span className="text-slate-200 font-semibold">Clone or Download the Project Folder:</span> Open your computer terminal inside the project directory.
              </li>
              <li>
                <span className="text-slate-200 font-semibold">Install Dependencies:</span>
                <div className="mt-1 p-2 rounded bg-slate-900 font-mono text-slate-200 text-xs">
                  npm install
                </div>
              </li>
              <li>
                <span className="text-slate-200 font-semibold">Set your Gemini API key in <code className="text-indigo-300">.env</code>:</span>
                <div className="mt-1 p-2 rounded bg-slate-900 font-mono text-slate-200 text-xs">
                  GEMINI_API_KEY="your-gemini-key-from-google-ai-studio"
                </div>
              </li>
              <li>
                <span className="text-slate-200 font-semibold">Start the Development Server:</span>
                <div className="mt-1 p-2 rounded bg-slate-900 font-mono text-slate-200 text-xs">
                  npm run dev
                </div>
              </li>
              <li>
                <span className="text-slate-200 font-semibold">Open in Browser:</span> Navigate to{' '}
                <span className="text-indigo-400 font-mono">http://localhost:3000</span>.
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-900">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all"
          >
            Got It, Let's Start!
          </button>
        </div>
      </div>
    </div>
  );
};
