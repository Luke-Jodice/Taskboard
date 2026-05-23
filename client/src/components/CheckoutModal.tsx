import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Check, CreditCard, Sparkles } from 'lucide-react';

type Stage = 'form' | 'success';
type CardType = 'visa' | 'mastercard' | 'amex' | 'discover' | null;

function detectCard(digits: string): CardType {
  if (/^4/.test(digits)) return 'visa';
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'mastercard';
  if (/^3[47]/.test(digits)) return 'amex';
  if (/^6/.test(digits)) return 'discover';
  return null;
}

function formatCardNumber(digits: string, type: CardType): string {
  if (type === 'amex') {
    return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)]
      .filter(Boolean).join(' ');
  }
  const chunks = [];
  for (let i = 0; i < digits.length; i += 4) chunks.push(digits.slice(i, i + 4));
  return chunks.join(' ');
}

const CARD_LABEL: Record<NonNullable<CardType>, string> = {
  visa: 'VISA', mastercard: 'MC', amex: 'AMEX', discover: 'DISC',
};

const FEATURES = [
  'Unlimited boards',
  'Priority support',
  'Custom domains',
  'Team collaboration',
  'Advanced analytics',
];

interface CheckoutModalProps {
  onClose: () => void;
}

export default function CheckoutModal({ onClose }: CheckoutModalProps) {
  const [stage, setStage] = useState<Stage>('form');
  const [email, setEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');

  const digits = cardNumber.replace(/\D/g, '');
  const cardType = detectCard(digits);

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, cardType === 'amex' ? 15 : 16);
    setCardNumber(formatCardNumber(raw, detectCard(raw)));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    setExpiry(raw.length > 2 ? raw.slice(0, 2) + ' / ' + raw.slice(2) : raw);
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCvc(e.target.value.replace(/\D/g, '').slice(0, cardType === 'amex' ? 4 : 3));
  };

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
          className="relative z-10 w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex"
          style={{ maxHeight: 'calc(100vh - 2rem)' }}
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ type: 'spring', duration: 0.28, bounce: 0.15 }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X size={15} />
          </button>

          {/* ── Left panel ── */}
          <div className="w-[42%] shrink-0 bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 px-8 py-10 flex flex-col text-white overflow-y-auto">
            <div className="flex items-center gap-2.5 mb-10">
              <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
                <Sparkles size={15} />
              </div>
              <span className="font-semibold tracking-tight">TaskBoard</span>
            </div>

            <p className="text-white/60 text-sm mb-1">Subscribe to</p>
            <h2 className="text-2xl font-bold mb-1">Pro Plan</h2>
            <div className="mb-8">
              <span className="text-4xl font-bold">$12</span>
              <span className="text-white/60 text-sm ml-1">/ month</span>
            </div>

            <ul className="space-y-3 flex-1">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm">
                  <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <Check size={9} strokeWidth={3} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            <div className="border-t border-white/20 pt-5 mt-8 flex items-center justify-between text-sm">
              <span className="text-white/60">Today's total</span>
              <span className="font-bold text-lg">$12.00</span>
            </div>
          </div>

          {/* ── Right panel ── */}
          <div className="flex-1 px-8 py-10 flex flex-col overflow-y-auto">
            <AnimatePresence mode="wait" initial={false}>
              {stage === 'form' ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col h-full"
                >
                  <h3 className="text-gray-900 font-semibold text-lg mb-6">Payment details</h3>

                  <form
                    onSubmit={(e) => { e.preventDefault(); setStage('success'); }}
                    className="flex flex-col gap-4 flex-1"
                  >
                    {/* Email */}
                    <div>
                      <Label>Email</Label>
                      <StripeInput
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        autoFocus
                      />
                    </div>

                    {/* Card info group */}
                    <div>
                      <Label>Card information</Label>
                      <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                        {/* Number row */}
                        <div className="flex items-center px-3.5 py-2.5 border-b border-gray-200">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={cardNumber}
                            onChange={handleCardChange}
                            placeholder="1234 1234 1234 1234"
                            required
                            className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
                          />
                          <span className="ml-2 shrink-0">
                            {cardType
                              ? <span className="text-[10px] font-bold tracking-wider text-gray-400">{CARD_LABEL[cardType]}</span>
                              : <CreditCard size={15} className="text-gray-300" />
                            }
                          </span>
                        </div>
                        {/* Expiry + CVC row */}
                        <div className="flex">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={expiry}
                            onChange={handleExpiryChange}
                            placeholder="MM / YY"
                            required
                            className="flex-1 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent border-r border-gray-200"
                          />
                          <input
                            type="text"
                            inputMode="numeric"
                            value={cvc}
                            onChange={handleCvcChange}
                            placeholder="CVC"
                            required
                            className="w-24 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Name */}
                    <div>
                      <Label>Name on card</Label>
                      <StripeInput
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Full name"
                        required
                      />
                    </div>

                    <div className="flex-1 min-h-[1rem]" />

                    {/* Pay */}
                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <Lock size={13} />
                      Pay $12.00
                    </button>

                    {/* Stripe branding */}
                    <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mt-1">
                      <Lock size={10} />
                      <span>Powered by</span>
                      <span className="font-bold text-gray-500 tracking-tight">stripe</span>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center justify-center flex-1 text-center"
                >
                  <motion.div
                    className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-5"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                  >
                    <Check size={28} className="text-green-600" strokeWidth={2.5} />
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1.5">Payment successful!</h3>
                  <p className="text-gray-500 text-sm mb-1">Welcome to TaskBoard Pro</p>
                  <p className="text-gray-400 text-xs mb-8">
                    A receipt has been sent to <span className="font-medium">{email || 'your email'}</span>
                  </p>
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    Get started
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
      {children}
    </label>
  );
}

function StripeInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
    />
  );
}
