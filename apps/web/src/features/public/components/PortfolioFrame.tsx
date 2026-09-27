'use client';
import dynamic from 'next/dynamic';
import { motion, MotionConfig } from 'framer-motion';
import type { ReactNode } from 'react';
import AnimatedSection from './AnimatedSection';
import { Toaster } from '@/components/ui/toaster';
const BackgroundSpline = dynamic(() => import('./BackgroundSpline'), {
  ssr: false,
});
export function PortfolioFrame({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        className="portfolio-root min-h-screen bg-background relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <BackgroundSpline />
        {children}
        <Toaster />
        <noscript>
          <style>{`.portfolio-root, .portfolio-root [style*="opacity:0"], .portfolio-root [style*="opacity: 0"] { opacity: 1 !important; transform: none !important; } .portfolio-root .typewriter-fallback { display: inline; } .portfolio-root [data-typewriter] { display: none; }`}</style>
        </noscript>
      </motion.div>
    </MotionConfig>
  );
}
export function PortfolioFooter({ year }: { year: number }) {
  return (
    <AnimatedSection>
      <motion.footer
        className="py-8 border-t border-border"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <motion.p
              className="text-sm text-muted-foreground font-mono"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              © {year} Kurtik Appadoo. Built with passion.
            </motion.p>
            <motion.a
              href="/admin"
              className="text-xs text-muted-foreground/50 hover:text-primary transition-colors font-mono"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              Admin Portal
            </motion.a>
          </div>
        </div>
      </motion.footer>
    </AnimatedSection>
  );
}
