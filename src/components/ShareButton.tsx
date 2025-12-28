import React, { useState, useCallback } from 'react';
import { Share2, Twitter, Facebook, Copy, Check, MessageCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { GameResult } from '../types/gameModes';
import { shareResult, getShareUrls, generateShareText } from '../utils/social';

interface ShareButtonProps {
  result: GameResult;
  streakDays?: number;
  variant?: 'button' | 'icons';
}

export function ShareButton({ result, streakDays, variant = 'button' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleShare = useCallback(async () => {
    const success = await shareResult(result, streakDays);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [result, streakDays]);

  const shareUrls = getShareUrls(result);

  const handleCopy = useCallback(async () => {
    const text = generateShareText(result);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [result]);

  const openShareUrl = (url: string) => {
    window.open(url, '_blank', 'width=600,height=400');
  };

  if (variant === 'icons') {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => openShareUrl(shareUrls.twitter)}
          className="p-3 rounded-xl bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/30 transition-colors"
          title="Share on Twitter"
        >
          <Twitter className="w-5 h-5 text-[#1DA1F2]" />
        </button>
        <button
          onClick={() => openShareUrl(shareUrls.facebook)}
          className="p-3 rounded-xl bg-[#4267B2]/20 hover:bg-[#4267B2]/30 transition-colors"
          title="Share on Facebook"
        >
          <Facebook className="w-5 h-5 text-[#4267B2]" />
        </button>
        <button
          onClick={() => openShareUrl(shareUrls.whatsapp)}
          className="p-3 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 transition-colors"
          title="Share on WhatsApp"
        >
          <MessageCircle className="w-5 h-5 text-[#25D366]" />
        </button>
        <button
          onClick={handleCopy}
          className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          title="Copy to clipboard"
        >
          {copied ? (
            <Check className="w-5 h-5 text-green-400" />
          ) : (
            <Copy className="w-5 h-5" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="secondary"
        onClick={() => setShowOptions(!showOptions)}
        icon={copied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
      >
        {copied ? 'Copied!' : 'Share'}
      </Button>

      {showOptions && (
        <div className="absolute bottom-full mb-2 left-0 right-0 bg-gray-800 rounded-xl p-3 shadow-xl border border-white/10 z-50">
          <div className="space-y-2">
            <button
              onClick={() => {
                openShareUrl(shareUrls.twitter);
                setShowOptions(false);
              }}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Twitter className="w-4 h-4 text-[#1DA1F2]" />
              <span className="text-sm">Twitter</span>
            </button>
            <button
              onClick={() => {
                openShareUrl(shareUrls.facebook);
                setShowOptions(false);
              }}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Facebook className="w-4 h-4 text-[#4267B2]" />
              <span className="text-sm">Facebook</span>
            </button>
            <button
              onClick={() => {
                openShareUrl(shareUrls.whatsapp);
                setShowOptions(false);
              }}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span className="text-sm">WhatsApp</span>
            </button>
            <button
              onClick={() => {
                handleCopy();
                setShowOptions(false);
              }}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span className="text-sm">Copy Text</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
