import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  Volume2,
  CheckCircle,
  FileAudio
} from 'lucide-react';
import { MeetingRecord } from '../types/meeting';
import { transcribeAndSummarizeAudio } from '../services/api';

interface AudioRecorderProps {
  onMeetingProcessed: (meeting: MeetingRecord) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onMeetingProcessed }) => {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'paused' | 'stopped'>('idle');
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [meetingTitle, setMeetingTitle] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [micPermissionGranted, setMicPermissionGranted] = useState<boolean | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Setup Visualizer
  const setupVisualizer = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const canvasCtx = canvas.getContext('2d');
      if (!canvasCtx) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        animationFrameRef.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        canvasCtx.fillStyle = 'rgb(15 23 42)'; // bg-slate-900
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height * 0.85;

          // Gradient color: indigo to cyan
          const gradient = canvasCtx.createLinearGradient(0, canvas.height, 0, 0);
          gradient.addColorStop(0, '#6366f1'); // Indigo
          gradient.addColorStop(1, '#06b6d4'); // Cyan

          canvasCtx.fillStyle = gradient;
          canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

          x += barWidth + 1;
        }
      };

      draw();
    } catch (e) {
      console.warn('Web Audio API Visualizer not supported or failed to init:', e);
    }
  };

  const cleanupAudio = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      cleanupAudio();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, []);

  const startRecording = async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      mediaStreamRef.current = stream;
      setMicPermissionGranted(true);

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = event => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm'
        });
        setAudioBlob(finalBlob);
        const url = URL.createObjectURL(finalBlob);
        setAudioUrl(url);
        cleanupAudio();
      };

      recorder.start(250); // Collect data every 250ms
      setRecordingState('recording');
      setRecordingTime(0);

      // Start visualizer
      setupVisualizer(stream);

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access denied or error:', err);
      setMicPermissionGranted(false);
      setErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Microphone access was denied. Please allow microphone permissions in your browser to record live meetings.'
          : `Failed to access microphone: ${err.message || 'Unknown error'}`
      );
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState !== 'idle' && recordingState !== 'stopped') {
      mediaRecorderRef.current.stop();
      setRecordingState('stopped');
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const resetRecording = () => {
    cleanupAudio();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setRecordingState('idle');
    setRecordingTime(0);
    setAudioBlob(null);
    setAudioUrl(null);
    setErrorMessage(null);
  };

  const handleSubmitForTranscription = async () => {
    if (!audioBlob) {
      setErrorMessage('No audio recorded yet.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setProcessingStep('Preparing and encoding audio file...');

    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const res = reader.result as string;
          resolve(res);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(audioBlob);
      const base64Audio = await base64Promise;

      setProcessingStep('Transcribing audio with Gemini 3.5 Speech AI...');
      // Wait slight interval for visual feedback
      await new Promise(r => setTimeout(r, 600));

      setProcessingStep('Extracting executive summaries, decisions & action items with Gemini 3.8...');
      const durationStr = formatTime(recordingTime);

      const meeting = await transcribeAndSummarizeAudio({
        audioBase64: base64Audio,
        mimeType: audioBlob.type || 'audio/webm',
        meetingTitle: meetingTitle.trim() || `Live Meeting (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
        durationEstimate: durationStr
      });

      setProcessingStep('Completed! Finalizing meeting record...');
      await new Promise(r => setTimeout(r, 400));

      onMeetingProcessed(meeting);
    } catch (err: any) {
      console.error('Transcription failed:', err);
      setErrorMessage(err.message || 'An error occurred during audio processing. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-300 text-xs font-semibold border border-rose-500/20 mb-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>In-Browser Live Recording</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Record Meeting Audio</h2>
            <p className="text-sm text-slate-400 mt-1">
              Capture meeting audio directly from your microphone. MeetMind AI will transcribe each voice, summarize the discussion, and extract action items automatically.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/60">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Strict User Consent: Microphone is only active while recording.</span>
          </div>
        </div>
      </div>

      {/* Main Recorder Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl text-center relative overflow-hidden">
        {/* Visualizer Canvas */}
        <div className="relative mb-6 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 h-32 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={700}
            height={128}
            className="w-full h-full object-cover"
          />

          {recordingState === 'idle' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 text-slate-400 space-y-2">
              <Mic className="w-8 h-8 text-indigo-400 opacity-60" />
              <p className="text-xs font-medium">Click "Start Recording" when your meeting begins</p>
            </div>
          )}

          {recordingState === 'paused' && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/85">
              <div className="px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center space-x-2">
                <Pause className="w-3.5 h-3.5" />
                <span>Recording Paused</span>
              </div>
            </div>
          )}
        </div>

        {/* Timer Display */}
        <div className="mb-6">
          <div className="inline-flex items-center space-x-3 px-5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-3xl font-mono font-bold tracking-wider text-white shadow-inner">
            <span className={`w-3 h-3 rounded-full ${recordingState === 'recording' ? 'bg-rose-500 animate-pulse' : 'bg-slate-600'}`} />
            <span>{formatTime(recordingTime)}</span>
          </div>
          <div className="text-xs text-slate-400 mt-2 font-medium">
            {recordingState === 'recording' && 'Recording active — Speak into your microphone'}
            {recordingState === 'paused' && 'Paused — Click Resume to continue'}
            {recordingState === 'stopped' && 'Recording finished — Review audio and submit below'}
            {recordingState === 'idle' && 'Ready to record'}
          </div>
        </div>

        {/* Recording Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {recordingState === 'idle' && (
            <button
              onClick={startRecording}
              className="flex items-center space-x-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-semibold text-sm shadow-lg shadow-rose-600/30 transition-all active:scale-95"
            >
              <Mic className="w-5 h-5" />
              <span>Start Meeting Recording</span>
            </button>
          )}

          {recordingState === 'recording' && (
            <>
              <button
                onClick={pauseRecording}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-medium text-sm transition-all"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>
              <button
                onClick={stopRecording}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-md transition-all active:scale-95"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Stop Recording</span>
              </button>
            </>
          )}

          {recordingState === 'paused' && (
            <>
              <button
                onClick={resumeRecording}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-md"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Resume</span>
              </button>
              <button
                onClick={stopRecording}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-md transition-all active:scale-95"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Finish & Review</span>
              </button>
            </>
          )}

          {recordingState === 'stopped' && (
            <button
              onClick={resetRecording}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-sm font-medium transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Record New Session</span>
            </button>
          )}
        </div>

        {/* Audio Preview & Submission section once stopped */}
        {recordingState === 'stopped' && audioUrl && (
          <div className="mt-8 pt-6 border-t border-slate-800 text-left max-w-xl mx-auto space-y-4">
            <div className="flex items-center space-x-2 text-indigo-300 font-semibold text-sm">
              <FileAudio className="w-4 h-4" />
              <span>Step 2: Preview Recording & Add Meeting Info</span>
            </div>

            {/* Audio player */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <audio controls src={audioUrl} className="w-full h-10 accent-indigo-500" />
            </div>

            {/* Title Input */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Meeting Title (Optional)
              </label>
              <input
                type="text"
                value={meetingTitle}
                onChange={e => setMeetingTitle(e.target.value)}
                placeholder="e.g., Weekly Product Standup & Tech Architecture"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitForTranscription}
              disabled={isProcessing}
              className="w-full flex items-center justify-center space-x-2.5 py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-xl shadow-indigo-600/25 transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              <Sparkles className="w-5 h-5 text-cyan-200" />
              <span>Generate AI Transcript & Executive Summary</span>
            </button>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="mt-6 p-6 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 max-w-xl mx-auto">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-semibold text-indigo-200">MeetMind AI is Analyzing Meeting</span>
            </div>
            <p className="text-xs text-indigo-300/80 animate-pulse">{processingStep}</p>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-3 text-left max-w-xl mx-auto">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-200">Recording Notice</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* Beginner Tips Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 text-xs text-slate-400 space-y-2">
        <div className="flex items-center space-x-2 text-slate-300 font-semibold">
          <CheckCircle className="w-4 h-4 text-indigo-400" />
          <span>Tips for best transcription results:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 ml-1 text-slate-400">
          <li>Ensure speakers are near the microphone and speak at normal conversation volume.</li>
          <li>For multi-person meetings, allow a brief pause between speakers to improve speaker diarization.</li>
          <li>You can pause anytime if taking a bio break or stepping into confidential discussions.</li>
        </ul>
      </div>
    </div>
  );
};
