'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAdminAuthForm, type AdminAuthMode } from '@/features/admin/hooks/useAdminAuthForm';

export function AdminAuthForm({ mode }: { mode: AdminAuthMode }) {
  const { email, password, error, isSubmitting, isLogin, setEmail, setPassword, submit } =
    useAdminAuthForm(mode);

  return (
    <>
      <style>{`
        .noir-input::placeholder { color: rgba(255,255,255,0.12); }
        .noir-input:focus { border-color: hsl(43,74%,49%) !important; }
        .noir-grain::after {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          opacity: 0.025; mix-blend-mode: overlay;
        }
      `}</style>

      <div className="noir-grain relative min-h-screen bg-[#080808] text-white overflow-hidden flex flex-col lg:flex-row">
        {/* Structural grid lines */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-[25%] w-px h-full bg-white/[0.03]" />
          <div className="absolute top-0 left-[50%] w-px h-full bg-white/[0.03]" />
          <div className="absolute top-0 left-[75%] w-px h-full bg-white/[0.03]" />
          <div className="absolute top-[33%] left-0 w-full h-px bg-white/[0.03]" />
          <div className="absolute top-[66%] left-0 w-full h-px bg-white/[0.03]" />
        </div>

        {/* Diagonal gold slash */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          transition={{ delay: 1, duration: 1.5 }}
          className="absolute top-0 right-[30%] w-px h-[250%] bg-gradient-to-b from-transparent via-[hsl(43,74%,49%)] to-transparent origin-top rotate-[25deg]"
        />

        {/* Back link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute top-8 left-8 z-20"
        >
          <Link
            href="/"
            className="group flex items-center gap-3"
            style={{ fontFamily: 'var(--font-admin-mono)' }}
          >
            <motion.span
              className="inline-block w-6 h-px bg-white/30 group-hover:bg-[hsl(43,74%,49%)] group-hover:w-10 transition-all duration-500"
            />
            <span className="text-[10px] uppercase tracking-[0.35em] text-white/30 group-hover:text-[hsl(43,74%,49%)] transition-colors duration-500">
              Portfolio
            </span>
          </Link>
        </motion.div>

        {/* Left column - monumental typography */}
        <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.25, 0.1, 0, 1] }}
            className="relative"
          >
            <h1
              className="text-[15vw] leading-[0.82] font-bold text-white/[0.025] select-none whitespace-pre-line"
              style={{ fontFamily: 'var(--font-admin-display)' }}
            >
              {isLogin ? 'SIGN\nIN' : 'JOIN\nUS'}
            </h1>
            {/* Gold accent stroke on text */}
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.6, duration: 1, ease: [0.25, 0.1, 0, 1] }}
              className="absolute top-0 left-[8%] w-[3px] h-full bg-[hsl(43,74%,49%)]/20 origin-top"
            />
          </motion.div>

          {/* Bottom left label */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="absolute bottom-12 left-12"
            style={{ fontFamily: 'var(--font-admin-mono)' }}
          >
            <span className="text-[10px] text-white/15 tracking-[0.5em] uppercase">
              Admin Portal &mdash; {new Date().getFullYear()}
            </span>
          </motion.div>
        </div>

        {/* Right column - the form */}
        <div className="flex-1 flex items-center justify-center px-8 py-20 lg:py-8 lg:px-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.25, 0.1, 0, 1] }}
            className="w-full max-w-md"
          >
            {/* Gold line + heading */}
            <div className="mb-14">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.7, delay: 0.5, ease: [0.25, 0.1, 0, 1] }}
                className="h-px bg-[hsl(43,74%,49%)] mb-10 origin-left w-16"
              />
              <h2
                className="text-5xl md:text-6xl font-bold tracking-tight mb-4"
                style={{ fontFamily: 'var(--font-admin-display)', letterSpacing: '0.02em' }}
              >
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p
                className="text-white/25 text-xs tracking-[0.15em]"
                style={{ fontFamily: 'var(--font-admin-mono)' }}
              >
                {isLogin
                  ? 'Enter your credentials to continue'
                  : 'Set up your admin access below'}
              </p>
            </div>

            <form onSubmit={submit} className="space-y-10">
              <div>
                <label
                  className="text-[10px] uppercase tracking-[0.35em] text-white/35 mb-4 block"
                  style={{ fontFamily: 'var(--font-admin-mono)' }}
                >
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="noir-input w-full bg-transparent border-0 border-b border-white/10 text-white text-base py-3 px-0 outline-none transition-all duration-500"
                  style={{
                    fontFamily: 'var(--font-admin-mono)',
                    borderRadius: 0,
                  }}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label
                  className="text-[10px] uppercase tracking-[0.35em] text-white/35 mb-4 block"
                  style={{ fontFamily: 'var(--font-admin-mono)' }}
                >
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="noir-input w-full bg-transparent border-0 border-b border-white/10 text-white text-base py-3 px-0 outline-none transition-all duration-500"
                  style={{
                    fontFamily: 'var(--font-admin-mono)',
                    borderRadius: 0,
                  }}
                  placeholder="••••••••"
                  minLength={8}
                  required
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-red-400/80 text-xs tracking-wide"
                  style={{ fontFamily: 'var(--font-admin-mono)' }}
                >
                  &gt; {error}
                </motion.p>
              )}

              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-[hsl(43,74%,49%)] text-[#080808] text-[11px] uppercase tracking-[0.4em] font-medium hover:bg-[hsl(43,74%,58%)] transition-all duration-500 disabled:opacity-30 relative overflow-hidden"
                style={{ fontFamily: 'var(--font-admin-mono)', borderRadius: 0 }}
              >
                <span className="relative z-10">
                  {isSubmitting
                    ? 'Authenticating...'
                    : isLogin
                      ? 'Sign In'
                      : 'Create Account'}
                </span>
              </motion.button>
            </form>

            <div className="mt-12 pt-8 border-t border-white/[0.05]">
              <p
                className="text-white/25 text-xs tracking-wide"
                style={{ fontFamily: 'var(--font-admin-mono)' }}
              >
                {isLogin ? "Don't have an account?" : 'Already registered?'}{' '}
                <Link
                  href={isLogin ? '/admin/signup' : '/admin/login'}
                  className="text-[hsl(43,74%,49%)]/70 hover:text-[hsl(43,74%,49%)] transition-colors duration-300 underline underline-offset-4 decoration-[hsl(43,74%,49%)]/20 hover:decoration-[hsl(43,74%,49%)]/60"
                >
                  {isLogin ? 'Request access' : 'Sign in'}
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
