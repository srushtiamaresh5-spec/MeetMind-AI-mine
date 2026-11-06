/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { MeetingRecord } from './types/meeting';
import { fetchMeetings, saveMeeting, deleteMeeting } from './services/api';
import { initAuth, googleSignIn, logout, getAccessToken } from './services/auth';

import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { AudioRecorder } from './components/AudioRecorder';
import { AudioUploader } from './components/AudioUploader';
import { MeetingDetails } from './components/MeetingDetails';
import { GmailIntegrationModal } from './components/GmailIntegrationModal';
import { GmailInboxViewer } from './components/GmailInboxViewer';
import { BeginnerGuideModal } from './components/BeginnerGuideModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingRecord | null>(null);
  const [isLoadingMeetings, setIsLoadingMeetings] = useState<boolean>(true);

  // Auth & Gmail state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [gmailConnected, setGmailConnected] = useState<boolean>(false);
  const [isConnectingGmail, setIsConnectingGmail] = useState<boolean>(false);

  // Modals state
  const [gmailModalOpen, setGmailModalOpen] = useState<boolean>(false);
  const [meetingForGmail, setMeetingForGmail] = useState<MeetingRecord | null>(null);
  const [guideModalOpen, setGuideModalOpen] = useState<boolean>(false);

  // Notification message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load meetings on mount
  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchMeetings();
        setMeetings(data);
      } catch (err) {
        console.error('Failed to load meetings:', err);
      } finally {
        setIsLoadingMeetings(false);
      }
    }
    loadData();
  }, []);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setGmailConnected(Boolean(token));
      },
      () => {
        setCurrentUser(null);
        setGmailConnected(false);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Connect Google Gmail
  const handleConnectGmail = async () => {
    setIsConnectingGmail(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        setGmailConnected(true);
        showToast('Gmail connected successfully! You can now send summaries and search meeting emails.');
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      showToast(err.message || 'Failed to connect Gmail. Please check popup permissions.');
    } finally {
      setIsConnectingGmail(false);
    }
  };

  // Disconnect Google Gmail
  const handleDisconnectGmail = async () => {
    try {
      await logout();
      setCurrentUser(null);
      setGmailConnected(false);
      showToast('Gmail disconnected. In-memory access token cleared.');
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // Meeting Processed Callback
  const handleMeetingProcessed = (newMeeting: MeetingRecord) => {
    setMeetings(prev => [newMeeting, ...prev.filter(m => m.id !== newMeeting.id)]);
    setSelectedMeeting(newMeeting);
    setCurrentTab('details');
    showToast(`Meeting "${newMeeting.title}" successfully analyzed and saved!`);
  };

  // Update Meeting (title, action items, etc.)
  const handleUpdateMeeting = async (updated: MeetingRecord) => {
    try {
      setMeetings(prev => prev.map(m => (m.id === updated.id ? updated : m)));
      setSelectedMeeting(updated);
      await saveMeeting(updated);
    } catch (err) {
      console.error('Failed to save meeting update:', err);
    }
  };

  // Delete Meeting
  const handleDeleteMeeting = async (id: string) => {
    try {
      await deleteMeeting(id);
      setMeetings(prev => prev.filter(m => m.id !== id));
      if (selectedMeeting?.id === id) {
        setSelectedMeeting(null);
        setCurrentTab('dashboard');
      }
      showToast('Meeting deleted successfully.');
    } catch (err) {
      console.error('Failed to delete meeting:', err);
      showToast('Failed to delete meeting from database.');
    }
  };

  // Open Gmail Modal
  const handleOpenGmailModal = (meeting: MeetingRecord) => {
    setMeetingForGmail(meeting);
    setGmailModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Navbar */}
      <Navbar
        currentTab={currentTab === 'details' ? 'dashboard' : currentTab}
        setCurrentTab={tab => {
          if (tab === 'guide') {
            setGuideModalOpen(true);
          } else {
            setSelectedMeeting(null);
            setCurrentTab(tab);
          }
        }}
        currentUser={currentUser}
        gmailConnected={gmailConnected}
        onConnectGmail={handleConnectGmail}
        onDisconnectGmail={handleDisconnectGmail}
        isConnectingGmail={isConnectingGmail}
      />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className="px-4 py-2.5 rounded-xl bg-slate-900 border border-indigo-500/40 text-slate-100 text-xs font-semibold shadow-2xl flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {selectedMeeting ? (
          <MeetingDetails
            meeting={selectedMeeting}
            onBack={() => {
              setSelectedMeeting(null);
              setCurrentTab('dashboard');
            }}
            onUpdateMeeting={handleUpdateMeeting}
            onDeleteMeeting={handleDeleteMeeting}
            onOpenGmailModal={handleOpenGmailModal}
          />
        ) : currentTab === 'record' ? (
          <AudioRecorder onMeetingProcessed={handleMeetingProcessed} />
        ) : currentTab === 'upload' ? (
          <AudioUploader onMeetingProcessed={handleMeetingProcessed} />
        ) : currentTab === 'gmail' ? (
          <GmailInboxViewer
            gmailConnected={gmailConnected}
            onConnectGmail={handleConnectGmail}
            onDisconnectGmail={handleDisconnectGmail}
            onMeetingImported={handleMeetingProcessed}
          />
        ) : (
          <Dashboard
            meetings={meetings}
            onSelectMeeting={meeting => {
              setSelectedMeeting(meeting);
              setCurrentTab('details');
            }}
            onOpenGmailModal={handleOpenGmailModal}
            onDeleteMeeting={handleDeleteMeeting}
            onNavigateTab={tab => {
              if (tab === 'guide') setGuideModalOpen(true);
              else setCurrentTab(tab);
            }}
            gmailConnected={gmailConnected}
            onConnectGmail={handleConnectGmail}
          />
        )}
      </main>

      {/* Modals */}
      <GmailIntegrationModal
        isOpen={gmailModalOpen}
        onClose={() => {
          setGmailModalOpen(false);
          setMeetingForGmail(null);
        }}
        meeting={meetingForGmail}
        gmailConnected={gmailConnected}
        onConnectGmail={handleConnectGmail}
      />

      <BeginnerGuideModal
        isOpen={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 text-slate-500 text-xs py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-400">MeetMind AI</span>
            <span>—</span>
            <span>Intelligent Meeting Assistant with Speech AI & Gmail Integration</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setGuideModalOpen(true)}
              className="hover:text-indigo-400 transition-colors"
            >
              Architecture & Beginner Guide
            </button>
            <span>•</span>
            <span>Powered by Google Gemini 3.5 & 3.8</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
