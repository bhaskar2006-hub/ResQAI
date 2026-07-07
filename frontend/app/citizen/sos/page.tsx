"use client";

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api, apiRequest } from '@/utils/api';
import { AlertTriangle, Phone, Camera, Mic } from 'lucide-react';

export default function CitizenSosPage() {
  const [sosText, setSosText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sosSuccess, setSosSuccess] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocation({ lat: 17.385, lng: 78.4867 })
    );
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);
      const interval = setInterval(() => setRecordingTime(t => t + 1), 1000);

      mediaRecorder.onstop = async () => {
        clearInterval(interval);
        stream.getTracks().forEach(t => t.stop());

        if (audioChunksRef.current.length === 0) return;
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'voice_note.webm', { type: 'audio/webm' });

        setIsUploadingAudio(true);
        try {
          const formData = new FormData();
          formData.append('file', audioFile);
          const res = await apiRequest<{ success?: boolean; data?: { url: string } }>('/upload', {
            method: 'POST',
            body: formData,
          });
          if (res.success && res.data?.url) {
            setUploadedAudioUrl(res.data.url);
          }
        } catch (err) {
          alert('Failed to upload voice note: ' + (err instanceof Error ? err.message : 'Unknown error'));
        } finally {
          setIsUploadingAudio(false);
        }
      };
    } catch {
      alert('Microphone access denied');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiRequest<{ success?: boolean; data?: { url: string } }>('/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.success && res.data?.url) {
        setUploadedImageUrl(res.data.url);
      }
    } catch (err) {
      alert('Failed to upload image file: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSendSOS = async () => {
    if (!sosText.trim() && !uploadedAudioUrl && !uploadedImageUrl) return;
    setIsSending(true);
    try {
      const lat = location?.lat || 17.385;
      const lng = location?.lng || 78.4867;
      const res = await api.post('/sos', {
        description: sosText || 'Emergency SOS Broadcast with media attachment',
        latitude: lat,
        longitude: lng,
        imageUrl: uploadedImageUrl || null,
        audioUrl: uploadedAudioUrl || null,
      }) as { success?: boolean };
      if (res.success) {
        setSosSuccess(true);
        setSosText('');
        setUploadedImageUrl('');
        setUploadedAudioUrl('');
        audioChunksRef.current = [];
        setTimeout(() => setSosSuccess(false), 5000);
      }
    } catch (err) {
      alert('Failed to send SOS: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <DashboardLayout role="citizen" title="Emergency SOS" subtitle="Distress transmission console">
      <div className="max-w-xl mx-auto bg-[#0d1b2e] border border-[#1e3352] rounded-xl p-5 md:p-6 flex flex-col space-y-4 glass-panel">
        <div className="border-b border-[#1e3352] pb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#ef4444] animate-pulse-severity shrink-0" />
          <h3 className="text-sm font-semibold text-[#ef4444]">Emergency SOS Trigger</h3>
        </div>

        {sosSuccess && (
          <div className="p-3 rounded-lg text-xs" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>
            SOS sent successfully. AI Agent Command deck has triaged your alert.
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium text-[#64748b] uppercase tracking-wider">Describe Crisis / Situation</label>
            <textarea
              value={sosText}
              onChange={(e) => setSosText(e.target.value)}
              placeholder="Water level rising, fire hazard, injury report. Provide coordinates or landmarks if possible..."
              rows={5}
              className="w-full text-xs p-3 resize-none bg-[#060e1d] border border-[#1e3352] text-foreground rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          {/* Inline Media Attachment Previews */}
          {(isUploadingImage || isUploadingAudio || uploadedImageUrl || uploadedAudioUrl) && (
            <div className="p-3.5 rounded-lg border border-[#1e3352] bg-[#060e1d]/50 space-y-3">
              <p className="text-[10px] font-medium text-[#64748b] uppercase tracking-wider">Attached Media Previews</p>
              
              <div className="flex flex-col gap-2.5">
                {isUploadingImage && (
                  <div className="text-xs text-[#64748b] animate-pulse flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span>Uploading photo attachment...</span>
                  </div>
                )}
                {!isUploadingImage && uploadedImageUrl && (
                  <div className="relative w-fit border border-[#1e3352] rounded overflow-hidden">
                    <img src={uploadedImageUrl} alt="Staged SOS Preview" className="max-h-24 max-w-[150px] object-cover" />
                    <button 
                      type="button" 
                      onClick={() => setUploadedImageUrl('')}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-0.5 text-[9px] w-4.5 h-4.5 flex items-center justify-center cursor-pointer font-bold"
                    >
                      ×
                    </button>
                  </div>
                )}

                {isUploadingAudio && (
                  <div className="text-xs text-[#64748b] animate-pulse flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span>Uploading voice message...</span>
                  </div>
                )}
                {!isUploadingAudio && uploadedAudioUrl && (
                  <div className="flex items-center gap-3">
                    <audio src={uploadedAudioUrl} controls className="h-7 max-w-[200px] bg-[#060e1d] rounded overflow-hidden" />
                    <button 
                      type="button" 
                      onClick={() => setUploadedAudioUrl('')}
                      className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`h-10 px-3 rounded-lg border flex items-center justify-center gap-2 text-xs font-medium transition-colors cursor-pointer ${
                isRecording 
                  ? 'border-[#ef4444] bg-[#ef4444]/15 text-[#ef4444]' 
                  : 'border-[#1e3352] bg-[#060e1d] hover:bg-[#0d2040] text-[#64748b] hover:text-foreground'
              }`}
            >
              <Mic className={`h-4 w-4 ${isRecording ? 'animate-pulse' : ''}`} />
              <span>{isRecording ? `00:${recordingTime.toString().padStart(2, '0')}` : 'Voice Note'}</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-10 px-3 rounded-lg border border-[#1e3352] bg-[#060e1d] hover:bg-[#0d2040] text-[#64748b] hover:text-foreground flex items-center justify-center gap-2 text-xs font-medium transition-colors cursor-pointer"
            >
              <Camera className="h-4 w-4" />
              <span>{uploadedImageUrl ? 'Photo Attached' : 'Attach Photo'}</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            className="hidden"
          />

          <button
            type="button"
            onClick={handleSendSOS}
            disabled={isSending || isUploadingImage || isUploadingAudio || (!sosText.trim() && !uploadedAudioUrl && !uploadedImageUrl)}
            className="h-11 w-full rounded-lg bg-[#ef4444] hover:bg-[#ef4444]/90 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-lg"
          >
            <Phone className="h-4 w-4" />
            <span>{isSending ? 'Transmitting Distress...' : 'Broadcast Distress SOS'}</span>
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
