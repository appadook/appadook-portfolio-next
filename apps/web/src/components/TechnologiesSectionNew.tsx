'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Cloud, ChevronDown } from 'lucide-react';
import type { CSSProperties } from 'react';
import React, { useState, useMemo, useCallback } from 'react';
import CertificateModal from './CertificateModal';
import CertificateItem from './CertificateItem';
import AnimatedSection from './AnimatedSection';
import type { Technology, CloudProvider, Certificate } from '@/lib/portfolio.types';
import { useBreakpoint } from '@/hooks/use-mobile';
import { technologyIcons, cloudProviderIcons } from '@/data/technologyIcons';
import { getRegistryIcon } from '@/data/iconRegistry';

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

type TechWithIcon = Technology & { icon: React.ElementType; customIconUrl?: string };

function useFlatTechs(technologies: Technology[]): TechWithIcon[] {
  return useMemo(
    () =>
      [...technologies]
        .sort((a, b) => a.order - b.order)
        .map(t => ({
          ...t,
          icon: getRegistryIcon(t.iconName) ?? technologyIcons[t.name] ?? Cloud,
          customIconUrl: t.iconUrl,
        })),
    [technologies],
  );
}

function splitIntoRows(techs: TechWithIcon[]): [TechWithIcon[], TechWithIcon[]] {
  const a: TechWithIcon[] = [];
  const b: TechWithIcon[] = [];
  techs.forEach((t, i) => (i % 2 === 0 ? a : b).push(t));
  return [a, b];
}

/* ─── Cloud Provider Accordion Card ────────────────────────────────────────── */

const ProviderCard = ({
  provider,
  isExpanded,
  onToggle,
  onCertClick,
}: {
  provider: CloudProvider;
  isExpanded: boolean;
  onToggle: () => void;
  onCertClick: (cert: Certificate, name: string) => void;
}) => {
  const CpIcon = getRegistryIcon(provider.iconName) ?? cloudProviderIcons[provider.name] ?? Cloud;
  const hasCustomIcon = !!provider.iconUrl;
  const certCount = provider.certificates?.length || 0;

  return (
    <motion.div
      layout
      className={`rounded-2xl border backdrop-blur-md transition-colors duration-500 overflow-hidden ${
        isExpanded
          ? 'border-primary/25 bg-primary/[0.04]'
          : 'border-border/20 bg-card/30 hover:border-primary/15 hover:bg-card/40'
      }`}
    >
      {/* Trigger */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 sm:px-6 sm:py-5 text-left cursor-pointer group"
      >
        <div
          className={`shrink-0 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl border transition-all duration-500 ${
            isExpanded
              ? 'bg-primary/15 border-primary/30'
              : 'bg-primary/[0.06] border-primary/15 group-hover:bg-primary/10'
          }`}
        >
          {hasCustomIcon ? (
            <img
              src={provider.iconUrl}
              alt={provider.name}
              className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
            />
          ) : (
            <CpIcon
              className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors duration-500 ${
                isExpanded ? 'text-primary' : 'text-primary/70 group-hover:text-primary'
              }`}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <span className="block font-semibold text-base sm:text-lg text-foreground leading-tight">
            {provider.name}
          </span>
          <span className="block text-[11px] sm:text-xs font-mono text-muted-foreground/60 mt-0.5">
            {certCount > 0
              ? `${certCount} certification${certCount > 1 ? 's' : ''}`
              : 'In progress'}
          </span>
        </div>

        {certCount > 0 && (
          <>
            {/* Cert count pill */}
            <span className="hidden sm:flex items-center justify-center h-7 min-w-[28px] px-2 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-mono font-bold text-primary tabular-nums">
              {certCount}
            </span>

            {/* Chevron */}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="shrink-0"
            >
              <ChevronDown className="w-5 h-5 text-muted-foreground/40" />
            </motion.div>
          </>
        )}
      </button>

      {/* Expanded certificate list */}
      <AnimatePresence initial={false}>
        {isExpanded && certCount > 0 && (
          <motion.div
            key="certs"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 sm:px-6 sm:pb-6">
              {/* Thin gold separator */}
              <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent mb-4" />

              <div className="space-y-2">
                {provider.certificates!.map(cert => (
                  <CertificateItem
                    key={cert._id}
                    certificate={cert}
                    onClick={() => onCertClick(cert, provider.name)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ─── Main Component ───────────────────────────────────────────────────────── */

const TechnologiesSectionNew = ({
  technologies,
  cloudProviders,
}: {
  technologies: Technology[];
  cloudProviders: CloudProvider[];
}) => {
  const allTechs = useFlatTechs(technologies);
  const reducedMotion = useReducedMotion();
  const { isMobile } = useBreakpoint();

  // Certificate modal state
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [certProvider, setCertProvider] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const openCert = useCallback((cert: Certificate, providerName: string) => {
    setSelectedCert(cert);
    setCertProvider(providerName);
    setModalOpen(true);
  }, []);
  const closeCert = useCallback(() => {
    setModalOpen(false);
    setSelectedCert(null);
  }, []);

  // Cloud accordion state
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const toggleProvider = useCallback(
    (id: string) => setExpandedProvider(prev => (prev === id ? null : id)),
    [],
  );

  // Split techs into two rows
  const [rowA, rowB] = useMemo(() => splitIntoRows(allTechs), [allTechs]);

  // 4x duplication for seamless loop
  const loopA = useMemo(() => [...rowA, ...rowA, ...rowA, ...rowA], [rowA]);
  const loopB = useMemo(() => [...rowB, ...rowB, ...rowB, ...rowB], [rowB]);

  const shouldAnimate = !reducedMotion && allTechs.length > 0;

  const rows = [
    { techs: loopA, duration: '48s', direction: 'normal' },
    { techs: loopB, duration: '44s', direction: 'reverse' },
  ];

  return (
    <AnimatedSection id="technologies" className="py-20 md:py-32 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-[600px] h-[400px] bg-primary/[0.025] rounded-full blur-[140px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-primary/[0.02] rounded-full blur-[120px]" />
      </div>

      {/* ── Section Header ── */}
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mb-10 sm:mb-14"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        >
          <motion.div
            className="mb-6 flex items-center gap-4"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="h-px w-12 bg-primary/50" />
            <span className="text-sm font-mono uppercase tracking-widest text-primary">
              Tech Stack
            </span>
          </motion.div>

          <motion.h2
            className="mb-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <span className="text-foreground">Frameworks & </span>
            <span className="italic text-primary">Tools</span>
          </motion.h2>

          <motion.p
            className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            The technologies I work with daily, from frontend frameworks to cloud
            infrastructure.
          </motion.p>
        </motion.div>
      </div>

      {/* ── Dual-Stream Marquee ── */}
      <motion.div
        className="relative z-10"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="mx-auto w-full max-w-[1400px] px-3 sm:px-6">
          <div className="relative overflow-hidden rounded-[28px] sm:rounded-[32px] bg-gradient-to-r from-background/20 via-primary/[0.05] to-background/20 py-10 sm:py-14">
            {/* Gold accent line along top */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

            {/* Edge fades */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-16 bg-gradient-to-r from-background via-background/80 to-transparent sm:w-28 lg:w-36" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-16 bg-gradient-to-l from-background via-background/80 to-transparent sm:w-28 lg:w-36" />

            <div className="space-y-6 sm:space-y-8">
              {rows.map((row, rowIdx) => (
                <div key={rowIdx} className="tech-marquee overflow-hidden">
                  <div
                    className={`flex w-max gap-4 sm:gap-6 ${shouldAnimate ? 'tech-track-animate' : ''}`}
                    style={
                      {
                        '--marquee-duration': row.duration,
                        '--marquee-direction': row.direction,
                      } as CSSProperties
                    }
                  >
                    {row.techs.map((tech, i) => {
                      const TechIcon = tech.icon;
                      return (
                        <div
                          key={`${tech._id}-${rowIdx}-${i}`}
                          className="flex flex-col items-center justify-center gap-2 w-[84px] sm:w-[100px] py-3.5 sm:py-4 rounded-2xl border border-border/20 bg-background/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/25 hover:bg-primary/[0.05] group flex-shrink-0"
                        >
                          {tech.customIconUrl ? (
                            <img
                              src={tech.customIconUrl}
                              alt={tech.name}
                              className="w-7 h-7 sm:w-9 sm:h-9 object-contain"
                            />
                          ) : (
                            <TechIcon className="w-7 h-7 sm:w-9 sm:h-9 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                          )}
                          <span className="text-[10px] sm:text-[11px] font-semibold text-foreground/60 group-hover:text-foreground text-center leading-tight transition-colors duration-300 line-clamp-2 px-1.5">
                            {tech.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom accent + tech count */}
            <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
          </div>

          {/* Subtle count */}
          <p className="mt-4 text-center text-[11px] font-mono text-muted-foreground/30">
            {technologies.length} technologies &middot;{' '}
            {reducedMotion ? 'motion reduced' : 'hover to pause'}
          </p>
        </div>
      </motion.div>

      {/* ── Gold Divider ── */}
      <div className="mx-auto max-w-[1400px] px-8 sm:px-12 my-12 sm:my-16">
        <div className="flex items-center gap-4">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
          <Cloud className="w-4 h-4 text-primary/30" />
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
        </div>
      </div>

      {/* ── Cloud Providers ── */}
      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.1 }}
      >
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          {/* Cloud heading */}
          <div className="mb-6 sm:mb-8 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/[0.08] border border-primary/15">
              <Cloud className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-xl sm:text-2xl font-semibold text-foreground">
                Cloud Platforms
              </h3>
              <p className="text-[11px] font-mono text-muted-foreground/50 mt-0.5">
                Infrastructure &amp; Certifications
              </p>
            </div>
          </div>

          {/* Provider grid — 1 col mobile, 2 col tablet, 3 col desktop */}
          <div className={`grid gap-3 sm:gap-4 ${
            isMobile
              ? 'grid-cols-1'
              : cloudProviders.length <= 3
                ? 'grid-cols-1 sm:grid-cols-3'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}>
            {cloudProviders.map((cp, i) => (
              <motion.div
                key={cp._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.05 * i }}
              >
                <ProviderCard
                  provider={cp}
                  isExpanded={expandedProvider === cp._id}
                  onToggle={() => toggleProvider(cp._id)}
                  onCertClick={openCert}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Certificate detail modal */}
      <CertificateModal
        isOpen={modalOpen}
        onClose={closeCert}
        certificate={selectedCert}
        providerName={certProvider}
      />

      {/* Marquee CSS — plain <style> so it's global, not scoped */}
      <style>{`
        .tech-marquee:hover .tech-track-animate,
        .tech-marquee:focus-within .tech-track-animate {
          animation-play-state: paused;
        }
        .tech-track-animate {
          animation: tech-scroll var(--marquee-duration, 45s) linear infinite;
          animation-direction: var(--marquee-direction, normal);
          will-change: transform;
        }
        @keyframes tech-scroll {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(-25%, 0, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .tech-track-animate {
            animation: none;
            transform: none;
          }
        }
      `}</style>
    </AnimatedSection>
  );
};

export default TechnologiesSectionNew;
