"use client";

import { useState, useEffect } from 'react';

interface LoadingSpinnerProps {
  platform: 'tiktok' | 'instagram';
  className?: string;
}

export function LoadingSpinner({ platform, className = "" }: LoadingSpinnerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [stage, setStage] = useState(0);

  const stages = platform === 'instagram' 
    ? [
        { text: "Searching Instagram hashtags...", time: 0 },
        { text: "Collecting creator profiles...", time: 20 },
        { text: "Enriching profile data...", time: 45 },
        { text: "Calculating engagement metrics...", time: 70 },
        { text: "Finalizing results...", time: 85 }
      ]
    : [
        { text: "Searching TikTok hashtags...", time: 0 },
        { text: "Analyzing creator content...", time: 15 },
        { text: "Calculating engagement metrics...", time: 50 },
        { text: "Finalizing results...", time: 80 }
      ];

  const estimatedTime = platform === 'instagram' ? 90 : 60;

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const currentStage = stages.findIndex((stage, index) => {
      const nextStage = stages[index + 1];
      return elapsed >= stage.time && (!nextStage || elapsed < nextStage.time);
    });
    
    if (currentStage !== -1) {
      setStage(currentStage);
    }
  }, [elapsed, stages]);

  const progress = Math.min((elapsed / estimatedTime) * 100, 95);

  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="max-w-md mx-auto">
        {/* Main spinner */}
        <div className="w-12 h-12 mx-auto mb-6 relative">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
          <div 
            className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"
            style={{
              animationDuration: platform === 'instagram' ? '1.2s' : '1s'
            }}
          ></div>
        </div>

        {/* Status text */}
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Discovering Creators
        </h3>
        
        <p className="text-gray-600 mb-4">
          {stages[stage]?.text || "Processing..."}
        </p>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Time info */}
        <div className="flex justify-between text-xs text-gray-500">
          <span>
            {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')} elapsed
          </span>
          <span>
            ~{Math.max(0, estimatedTime - elapsed)}s remaining
          </span>
        </div>

        {/* Platform-specific notes */}
        <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            {platform === 'instagram' 
              ? "Instagram searches take longer as we enrich profile data with follower counts, verification status, and contact details."
              : "TikTok searches typically complete in 30-60 seconds. We're analyzing video performance and creator metrics."
            }
          </p>
        </div>

        {/* Tips during wait */}
        {elapsed > 30 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              💡 Tip: Searches are saved automatically. You can reload previous results without using Apify credits.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}