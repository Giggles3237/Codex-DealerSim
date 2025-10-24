import React, { useEffect, useState } from 'react';

interface DailySummaryModalProps {
  title: string;
  description: string;
  onDismiss: () => void;
  autoDismissDelay?: number; // in seconds
}

export const DailySummaryModal: React.FC<DailySummaryModalProps> = ({
  title,
  description,
  onDismiss,
  autoDismissDelay = 20,
}) => {
  const [countdown, setCountdown] = useState(autoDismissDelay);

  useEffect(() => {
    // Start countdown immediately - first tick happens right away
    const startCountdown = () => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    };
    
    // First decrement happens immediately
    startCountdown();
    
    // Then continue with regular interval
    const timer = setInterval(startCountdown, 1000);

    return () => clearInterval(timer);
  }, [onDismiss]);

  const handleDismiss = () => {
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80"
        onClick={handleDismiss}
      />
      
      {/* Modal */}
      <div className="relative z-10 max-w-2xl w-[90vw] rounded-xl border-2 border-blue-500/50 bg-slate-800 shadow-2xl p-6">
        <div className="flex flex-col w-full">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-blue-400">{title}</h3>
            <div className="flex items-center gap-3">
              {/* Countdown Animation */}
              <div className="flex items-center gap-2">
                <div className="text-sm text-slate-400">Auto-continue in: <span className="font-bold text-blue-400">{countdown}s</span></div>
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-2 border-blue-400 bg-slate-700"></div>
                  {/* Progress ring */}
                  <svg className="absolute inset-0 w-12 h-12 transform -rotate-90" viewBox="0 0 48 48">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      className="text-slate-600"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 20}`}
                      strokeDashoffset={`${2 * Math.PI * 20 * (1 - countdown / autoDismissDelay)}`}
                      className="text-blue-400 transition-all duration-1000 ease-linear"
                    />
                  </svg>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDismiss}
                className="text-slate-400 hover:text-slate-200 text-xl font-bold px-2"
              >
                ✕
              </button>
            </div>
          </div>
          
          <div className="text-base whitespace-pre-line font-mono leading-relaxed text-slate-200">
            {description}
          </div>
          
          <button
            type="button"
            onClick={handleDismiss}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Continue to Next Day
          </button>
        </div>
      </div>
    </div>
  );
};
