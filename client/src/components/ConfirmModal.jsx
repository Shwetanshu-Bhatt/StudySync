import { useState, useEffect, createContext, useContext } from 'react';

// Confirm Context
const ConfirmContext = createContext();

export const useConfirm = () => useContext(ConfirmContext);

export const ConfirmProvider = ({ children }) => {
  const [confirmState, setConfirmState] = useState(null);

  const confirm = (message, onConfirm, onCancel) => {
    setConfirmState({ message, onConfirm, onCancel });
  };

  const close = () => {
    setConfirmState(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm, close }}>
      {children}
      {confirmState && (
        <ConfirmModal
          message={confirmState.message}
          onConfirm={() => {
            confirmState.onConfirm?.();
            close();
          }}
          onCancel={() => {
            confirmState.onCancel?.();
            close();
          }}
        />
      )}
    </ConfirmContext.Provider>
  );
};

const ConfirmModal = ({ message, onConfirm, onCancel }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onCancel?.();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-slate-800 rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl border border-slate-700 animate-scale-in">
        <div className="text-center">
          {/* Warning Icon */}
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-semibold text-white mb-2">Confirm Action</h3>
          <p className="text-slate-300 mb-6">{message}</p>
          
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmProvider;
