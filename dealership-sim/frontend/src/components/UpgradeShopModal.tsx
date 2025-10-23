import { GameState } from '@dealership/shared';
import UpgradeShop from '../features/upgrades/UpgradeShop';

interface Props {
  state: GameState;
  isOpen: boolean;
  onClose: () => void;
}

const UpgradeShopModal = ({ state, isOpen, onClose }: Props) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center" style={{ zIndex: 100000 }}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 max-w-7xl w-[95vw] h-[90vh] rounded-xl border-2 border-blue-500/50 bg-slate-800 shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h3 className="text-2xl font-bold text-blue-400">💎 Upgrade Shop</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-2xl font-bold px-2"
          >
            ✕
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <UpgradeShop state={state} />
        </div>
      </div>
    </div>
  );
};

export default UpgradeShopModal;

