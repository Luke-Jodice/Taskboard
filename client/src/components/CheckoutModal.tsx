import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { PricingTable } from '@clerk/react';

interface CheckoutModalProps {
  onClose: () => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

class PricingTableErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
            <Sparkles size={20} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Billing not configured</h3>
            <p className="text-sm text-gray-500 max-w-xs">
              Enable Billing and create plans in your{' '}
              <a
                href="https://dashboard.clerk.com"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 underline"
              >
                Clerk Dashboard
              </a>{' '}
              to show pricing here.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function CheckoutModal({ onClose }: CheckoutModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        />

        <motion.div
          className="relative z-10 w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden"
          style={{ maxHeight: 'calc(100vh - 2rem)' }}
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ type: 'spring', duration: 0.28, bounce: 0.15 }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-colors"
          >
            <X size={15} />
          </button>

          <div className="overflow-y-auto p-8" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            <PricingTableErrorBoundary>
              <PricingTable />
            </PricingTableErrorBoundary>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
