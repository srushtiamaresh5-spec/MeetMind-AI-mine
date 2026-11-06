import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileAudio,
  AlertCircle,
  Sparkles,
  FileText,
  X,
  Clock,
  HardDrive
} from 'lucide-react';
import { MeetingRecord } from '../types/meeting';
import { transcribeAndSummarizeAudio, summarizeTranscript } from '../services/api';

interface AudioUploaderProps {
  onMeetingProcessed: (meeting: MeetingRecord) => void;
}

const SUPPORTED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.webm', '.ogg', '.aac', '.flac'];
const MAX_FILE_SIZE_MB = 25;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const AudioUploader: React.FC<AudioUploaderProps> = ({ onMeetingProcessed }) => {
  const [activeTab, setActiveTab] = useState<'audio' | 'transcript'>('audio');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [meetingTitle, setMeetingTitle] = useState<string>('');
  const [manualTranscript, setManualTranscript] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSelectFile = (file: File) => {
    setErrorMessage(null);

    // Validate size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(
        `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). The maximum allowed audio file size is ${MAX_FILE_SIZE_MB} MB.`
      );
      return;
    }

    // Validate extension / MIME
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    const isAudioMime = file.type.startsWith('audio/') || file.type.includes('video/webm');
    const isAudioExt = SUPPORTED_EXTENSIONS.includes(fileExt);

    if (!isAudioMime && !isAudioExt) {
      setErrorMessage(
        `Unsupported file format. Please upload an audio file (${SUPPORTED_EXTENSIONS.join(', ')}).`
      );
      return;
    }

    setSelectedFile(file);
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioPreviewUrl(URL.createObjectURL(file));

    // Auto suggest meeting title from file name
    const cleanedName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    if (!meetingTitle) {
      setMeetingTitle(cleanedName);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const clearSelectedFile = () => {
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setSelectedFile(null);
    setAudioPreviewUrl(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProcessAudio = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setProcessingStatus('Reading and preparing audio payload...');

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(selectedFile);
      const base64Audio = await base64Promise;

      setProcessingStatus('Converting speech to text via Gemini 3.5 Transcribe...');
      await new Promise(r => setTimeout(r, 600));

      setProcessingStatus('Synthesizing executive recap, action items & decisions...');

      const meeting = await transcribeAndSummarizeAudio({
        audioBase64: base64Audio,
        mimeType: selectedFile.type || 'audio/mp3',
        meetingTitle: meetingTitle.trim() || selectedFile.name,
        durationEstimate: `${(selectedFile.size / (1024 * 1024 * 0.5)).toFixed(0)} min (est.)`
      });

      setProcessingStatus('Finalizing meeting database...');
      await new Promise(r => setTimeout(r, 400));

      onMeetingProcessed(meeting);
    } catch (err: any) {
      console.error('Failed to process uploaded audio:', err);
      setErrorMessage(err.message || 'Failed to process audio recording. Please try another file.');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleProcessTranscript = async () => {
    if (!manualTranscript.trim()) {
      setErrorMessage('Please enter or paste your meeting transcript or notes.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setProcessingStatus('Analyzing transcript with Gemini 3.8 AI...');

    try {
      const meeting = await summarizeTranscript({
        transcript: manualTranscript,
        meetingTitle: meetingTitle.trim() || 'Meeting Notes & Transcript'
      });

      onMeetingProcessed(meeting);
    } catch (err: any) {
      console.error('Failed to process transcript:', err);
      setErrorMessage(err.message || 'Failed to analyze transcript.');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Upload Meeting Content</h2>
            <p className="text-sm text-slate-400 mt-1">
              Upload pre-recorded audio from Zoom, Google Meet, Microsoft Teams, or paste a raw transcript.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('audio')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'audio'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileAudio className="w-3.5 h-3.5" />
              <span>Audio File</span>
            </button>
            <button
              onClick={() => setActiveTab('transcript')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'transcript'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Paste Notes/Text</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'audio' ? (
        /* Audio File Upload Box */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          {!selectedFile ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                  : 'border-slate-700 hover:border-indigo-500/60 bg-slate-950/60 hover:bg-slate-950'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.aac,.flac"
                onChange={handleFileInput}
                className="hidden"
              />

              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                <UploadCloud className="w-8 h-8 text-indigo-400" />
              </div>

              <h3 className="text-lg font-bold text-white">Drag & drop your meeting audio file here</h3>
              <p className="text-sm text-slate-400 mt-1.5">
                or <span className="text-indigo-400 underline font-medium">browse from your computer</span>
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs text-slate-500">
                <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">MP3</span>
                <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">WAV</span>
                <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">M4A</span>
                <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">WEBM</span>
                <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">AAC / OGG</span>
                <span className="text-slate-400 ml-2">Max: {MAX_FILE_SIZE_MB}MB</span>
              </div>
            </div>
          ) : (
            /* Selected File Review Card */
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                    <FileAudio className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white truncate max-w-sm sm:max-w-md">
                      {selectedFile.name}
                    </h4>
                    <div className="flex items-center space-x-3 text-xs text-slate-400 mt-0.5">
                      <span className="flex items-center space-x-1">
                        <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                        <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                      </span>
                      <span>•</span>
                      <span className="uppercase">{selectedFile.name.split('.').pop()} Audio</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={clearSelectedFile}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title="Remove file"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* In-browser preview */}
              {audioPreviewUrl && (
                <div className="pt-2">
                  <span className="text-xs font-semibold text-slate-400 mb-1.5 block">
                    Audio Preview
                  </span>
                  <audio controls src={audioPreviewUrl} className="w-full h-10 accent-indigo-500" />
                </div>
              )}

              {/* Title Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Meeting Title (Customizable)
                </label>
                <input
                  type="text"
                  value={meetingTitle}
                  onChange={e => setMeetingTitle(e.target.value)}
                  placeholder="e.g. Q4 Executive Strategy Sync"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleProcessAudio}
                disabled={isProcessing}
                className="w-full flex items-center justify-center space-x-2.5 py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-xl shadow-indigo-600/25 transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                <Sparkles className="w-5 h-5 text-cyan-200" />
                <span>Transcribe & Extract Meeting Intel</span>
              </button>
            </div>
          )}

          {/* Processing Animation */}
          {isProcessing && (
            <div className="p-6 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-center space-y-2">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-semibold text-indigo-200">MeetMind AI Processing</span>
              </div>
              <p className="text-xs text-indigo-300/80 animate-pulse">{processingStatus}</p>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-200">Upload Issue</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Manual Transcript / Text Mode */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Meeting Title
            </label>
            <input
              type="text"
              value={meetingTitle}
              onChange={e => setMeetingTitle(e.target.value)}
              placeholder="e.g. Design Architecture Review"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Paste Meeting Transcript, Notes, or Discussion Log
            </label>
            <textarea
              rows={8}
              value={manualTranscript}
              onChange={e => setManualTranscript(e.target.value)}
              placeholder="Speaker 1: Hi everyone, let's review our release blockers...&#10;Speaker 2: Yes, the database migration needs to run before Friday."
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Character count: {manualTranscript.length}
            </span>
          </div>

          <button
            onClick={handleProcessTranscript}
            disabled={isProcessing || !manualTranscript.trim()}
            className="w-full flex items-center justify-center space-x-2 py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-cyan-200" />
            <span>Generate Executive Summary & Action Items</span>
          </button>

          {isProcessing && (
            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-center">
              <span className="text-xs text-indigo-300">{processingStatus}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
