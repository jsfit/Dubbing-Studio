'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, Film, Loader2 } from 'lucide-react';
import { ApiClient } from '../../lib/api';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (projectId: string) => void;
}

const COMMON_LANGUAGES = [
  'English',
  'Spanish',
  'Punjabi',
  'Hindi',
  'French',
  'German',
  'Japanese',
  'Chinese (Mandarin)',
  'Arabic',
  'Portuguese',
  'Italian',
  'Korean',
  'Turkish',
  'Russian',
  'Urdu',
];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('Punjabi');
  const [customTargetLanguage, setCustomTargetLanguage] = useState('');
  const [isCustomLanguage, setIsCustomLanguage] = useState(false);
  const [whisperModel, setWhisperModel] = useState('small');
  const [device, setDevice] = useState('auto');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a project name');
      return;
    }
    if (!videoFile) {
      setError('Please select a video file to dub');
      return;
    }

    const finalTargetLanguage = isCustomLanguage
      ? (customTargetLanguage.trim() || 'Dubbed')
      : targetLanguage;

    setIsSubmitting(true);
    setError(null);
    setUploadStatus('Creating project...');

    try {
      const project = await ApiClient.createProject({
        name,
        description,
        sourceLanguage,
        targetLanguage: finalTargetLanguage,
        whisperModel,
        device,
      });

      setUploadStatus('Uploading video and starting transcription pipeline...');
      await ApiClient.uploadVideo(project.id, videoFile);

      onCreated(project.id);
      onClose();
    } catch (err: unknown) {
      const errObj = err as Error;
      setError(errObj.message || 'Failed to create project');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Film className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-slate-900 text-base">New Dubbing Project</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Comedy Scene #01 - Spanish Dub"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Video File <span className="text-rose-500">*</span>
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-4 text-center cursor-pointer bg-slate-50 hover:bg-indigo-50/20 transition flex flex-col items-center justify-center gap-1.5"
            >
              <Upload className="w-6 h-6 text-slate-400" />
              {videoFile ? (
                <div className="text-xs font-medium text-slate-800">
                  Selected: <span className="text-indigo-600">{videoFile.name}</span> ({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)
                </div>
              ) : (
                <>
                  <p className="text-xs font-medium text-slate-700">
                    Click to select original video file
                  </p>
                  <p className="text-[11px] text-slate-400">MP4, WebM, MOV, MKV up to 2GB</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setVideoFile(e.target.files[0]);
                    if (!name) {
                      setName(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Original Audio Language
              </label>
              <select
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="ja">Japanese</option>
                <option value="pa">Punjabi</option>
                <option value="hi">Hindi</option>
                <option value="ur">Urdu</option>
                <option value="ar">Arabic</option>
                <option value="auto">Auto Detect</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Dubbing Language
              </label>
              {!isCustomLanguage ? (
                <select
                  value={targetLanguage}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomLanguage(true);
                    } else {
                      setTargetLanguage(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                >
                  {COMMON_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                  <option value="__custom__">+ Other / Custom Language...</option>
                </select>
              ) : (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Enter language..."
                    value={customTargetLanguage}
                    onChange={(e) => setCustomTargetLanguage(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-indigo-400 rounded-lg text-xs text-slate-800 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomLanguage(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 text-xs"
                    title="Choose from list"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Whisper Model
              </label>
              <select
                value={whisperModel}
                onChange={(e) => setWhisperModel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="tiny">Tiny (Fastest)</option>
                <option value="base">Base</option>
                <option value="small">Small (Recommended)</option>
                <option value="medium">Medium</option>
                <option value="large-v3">Large-v3 (Most Accurate)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Transcription Device
              </label>
              <select
                value={device}
                onChange={(e) => setDevice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="auto">Auto (CUDA if available, else CPU)</option>
                <option value="cuda">CUDA (NVIDIA GPU)</option>
                <option value="cpu">CPU (Standard)</option>
              </select>
            </div>
          </div>

          {isSubmitting && (
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center gap-2 text-xs text-indigo-700">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>{uploadStatus}</span>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 disabled:opacity-50 transition flex items-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Create Project</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
