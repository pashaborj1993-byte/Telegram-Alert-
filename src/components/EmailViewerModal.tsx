import React, { useState } from 'react';
import {
  X,
  Mail,
  ExternalLink,
  MessageSquare,
  Copy,
  Check,
  Calendar,
  User,
  ShieldCheck,
} from 'lucide-react';
import { AlertLog } from '../types.ts';

interface EmailViewerModalProps {
  alert: AlertLog | null;
  onClose: () => void;
}

export const EmailViewerModal: React.FC<EmailViewerModalProps> = ({
  alert,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'text' | 'headers'>('preview');
  const [copied, setCopied] = useState(false);

  if (!alert) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(alert.postSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white truncate max-w-md">
                  {alert.emailSubject || `Alert: ${alert.ruleName}`}
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Delivered to <span className="text-sky-400 font-semibold">{alert.emailRecipient}</span>
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

        {/* Email Metadata Strip */}
        <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>From: <strong>TeleAlert Dispatcher</strong> &lt;alerts@telealert.live&gt;</span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{new Date(alert.timestamp).toLocaleString()}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3" />
              Verified Delivery
            </span>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center px-4 pt-2 border-b border-slate-800 gap-1 bg-slate-900">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'preview'
                ? 'text-sky-400 border-sky-400 bg-slate-800/50'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            Rendered HTML Email
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'text'
                ? 'text-sky-400 border-sky-400 bg-slate-800/50'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            Plain Text
          </button>
          <button
            onClick={() => setActiveTab('headers')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'headers'
                ? 'text-sky-400 border-sky-400 bg-slate-800/50'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            Delivery Details
          </button>
        </div>

        {/* Body View */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-slate-950/50">
          {activeTab === 'preview' ? (
            alert.emailHtml ? (
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-inner">
                <iframe
                  title="Rendered Email"
                  srcDoc={alert.emailHtml}
                  className="w-full h-96 border-0 bg-slate-900"
                  sandbox="allow-popups allow-popups-to-escape-sandbox"
                />
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">
                HTML preview was not generated for this legacy alert.
              </div>
            )
          ) : activeTab === 'text' ? (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed select-text">
              {alert.postSnippet}
            </div>
          ) : (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs font-mono text-slate-400">
              <div><strong>Message-ID:</strong> &lt;{alert.id}@telealert.local&gt;</div>
              <div><strong>To:</strong> {alert.emailRecipient}</div>
              <div><strong>Subject:</strong> {alert.emailSubject}</div>
              <div><strong>Channel:</strong> @{alert.channel}</div>
              <div><strong>Rule:</strong> {alert.ruleName} ({alert.priority} priority)</div>
              <div><strong>Matched Keywords:</strong> {alert.matchedKeywords.join(', ')}</div>
              <div><strong>WhatsApp Dispatched:</strong> {alert.whatsAppRecipient || 'Disabled'}</div>
              <div><strong>Status:</strong> Delivered / Sent</div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Message'}</span>
            </button>

            {alert.postUrl && (
              <a
                href={alert.postUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-medium transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Telegram</span>
              </a>
            )}
          </div>

          {alert.whatsAppUrl && (
            <a
              href={alert.whatsAppUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Forward to WhatsApp</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
