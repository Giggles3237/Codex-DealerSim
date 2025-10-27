import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { X, Clock, User } from 'lucide-react';
import { GameState } from '@dealership/shared';

interface AutoCloseDayModalProps {
  gameState: GameState;
  isOpen: boolean;
  onClose: () => void;
  onCloseDay: () => void;
}

export const AutoCloseDayModal: React.FC<AutoCloseDayModalProps> = ({
  gameState,
  isOpen,
  onClose,
  onCloseDay,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(10); // 10 seconds for popup display
  const [autoCloseTimeLeft, setAutoCloseTimeLeft] = useState<number>(10); // Start with 10 seconds

  useEffect(() => {
    // Start the countdown immediately when modal opens
    if (isOpen) {
      setAutoCloseTimeLeft(10);
    }
  }, [isOpen]);

  useEffect(() => {
    // Auto-close countdown timer
    if (isOpen && gameState.autoCloseDayScheduled) {
      const autoCloseTimer = setInterval(() => {
        setAutoCloseTimeLeft((prev) => {
          if (prev <= 1) {
            onCloseDay(); // Auto-close the day
            onClose(); // Close the modal
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(autoCloseTimer);
    }

    // Popup timer for when auto-close is not scheduled
    if (isOpen && !gameState.autoCloseDayScheduled) {
      const popupTimer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(popupTimer);
    }
  }, [isOpen, gameState.autoCloseDayScheduled, onClose, onCloseDay]);

  const handleCloseDay = () => {
    onCloseDay();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 p-6 bg-slate-800 border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-white">Sales Manager Auto-Close</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Clock className="h-4 w-4" />
            <span>Your Sales Manager will automatically close out the day in:</span>
          </div>

          <div className="flex items-center justify-center gap-4">
            <div className="text-sm text-slate-300">
              Auto-close in: <span className="font-bold text-blue-400">{autoCloseTimeLeft}s</span>
            </div>
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-blue-400 bg-slate-700"></div>
              {/* Progress ring */}
              <svg className="absolute inset-0 w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-slate-600"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - autoCloseTimeLeft / 10)}`}
                  className="text-blue-400 transition-all duration-1000 ease-linear"
                />
              </svg>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCloseDay}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Close Day Now
            </Button>
          </div>

          {!gameState.autoCloseDayScheduled && (
            <div className="text-xs text-slate-400 text-center">
              This popup will close in {timeLeft}s
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
