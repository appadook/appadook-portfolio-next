import type { CSSProperties } from 'react';
import { useMemo } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { Code2 } from 'lucide-react';
import AnimatedSection from './AnimatedSection';
import type { ProgrammingLanguage } from '@/features/public/types';

const LanguageChip = ({ language }: { language: ProgrammingLanguage }) => {
  const hasLogo = Boolean(language.logoUrl);

  return (
    <article className="group flex min-w-[132px] max-w-[168px] flex-col items-center justify-center gap-2.5 rounded-2xl bg-background/65 px-4 py-4 shadow-card backdrop-blur-md transition-all duration-300 hover:bg-background/85 sm:min-w-[152px] sm:px-5 sm:py-5">
      {hasLogo ? (
        <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg sm:h-20 sm:w-20">
          <Image
            src={String(language.logoUrl)}
            alt={`${language.name} logo`}
            fill
            sizes="80px"
            className="object-contain"
            unoptimized
          />
        </span>
      ) : null}
      <span className="line-clamp-1 w-full text-center text-xs font-semibold text-foreground sm:text-sm">
        {language.name}
      </span>
    </article>
  );
};

const SkillsSection = ({ programmingLanguages }: { programmingLanguages: ProgrammingLanguage[] }) => {
  const reducedMotion = useReducedMotion();

  const loopedLanguages = useMemo(
    () => [
      ...programmingLanguages,
      ...programmingLanguages,
      ...programmingLanguages,
      ...programmingLanguages,
    ],
    [programmingLanguages],
  );

  const shouldAnimate = !reducedMotion && programmingLanguages.length > 0;
  const durationSeconds = Math.max(20, programmingLanguages.length * 4);
  const animationStyle = shouldAnimate
    ? ({ '--marquee-duration': `${durationSeconds}s` } as CSSProperties)
    : undefined;

  return (
    <AnimatedSection id="skills" className="py-20 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 h-[500px] w-[500px] rounded-full bg-primary/4 blur-3xl" />
        <div className="absolute bottom-1/4 left-0 h-[420px] w-[420px] rounded-full bg-primary/3 blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mb-10 sm:mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          viewport={{ once: true }}
        >
          <motion.div
            className="mb-6 flex items-center gap-4"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <span className="h-px w-12 bg-primary/50" />
            <span className="text-sm font-mono uppercase tracking-widest text-primary">Core Skills</span>
          </motion.div>

          <motion.h2
            className="mb-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <span className="text-foreground">Programming </span>
            <span className="italic text-primary">Languages</span>
          </motion.h2>

          <motion.p
            className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            A live banner of languages synced from Convex.
          </motion.p>
        </motion.div>
      </div>

      {programmingLanguages.length > 0 ? (
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className="mx-auto w-full max-w-[1240px] px-3 sm:px-6">
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-background/20 via-primary/10 to-background/20 py-8 sm:py-10 lg:py-12">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-16 bg-gradient-to-r from-background via-background/80 to-transparent sm:w-24" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-16 bg-gradient-to-l from-background via-background/80 to-transparent sm:w-24" />

              <div className="mb-6 flex items-center justify-center gap-3 px-4">
                <div className="rounded-xl bg-primary/15 p-2.5">
                  <Code2 className="h-5 w-5 text-primary" />
                </div>
                <p className="text-center text-xs font-mono uppercase tracking-wide text-muted-foreground sm:text-sm">
                  {programmingLanguages.length} languages
                </p>
              </div>

              <div className={`skills-marquee ${reducedMotion ? 'overflow-x-auto' : 'overflow-hidden'}`}>
                <div
                  className={`skills-track flex w-max gap-4 px-3 sm:gap-5 sm:px-4 lg:gap-7 ${shouldAnimate ? 'skills-track-animate' : ''}`}
                  style={animationStyle}
                >
                  {loopedLanguages.map((language, index) => (
                    <LanguageChip key={`${language._id}-${index}`} language={language} />
                  ))}
                </div>
              </div>

              <p className="mt-6 px-4 text-center text-xs font-mono text-muted-foreground">
                {reducedMotion
                  ? 'Reduced motion is enabled, so auto-scroll is disabled.'
                  : 'Auto-scroll pauses on hover for readability.'}
              </p>
            </div>
          </div>

          <style jsx>{`
            .skills-marquee:hover .skills-track-animate,
            .skills-marquee:focus-within .skills-track-animate {
              animation-play-state: paused;
            }

            .skills-track-animate {
              animation: skills-marquee var(--marquee-duration, 30s) linear infinite;
              will-change: transform;
            }

            @keyframes skills-marquee {
              from {
                transform: translate3d(0, 0, 0);
              }
              to {
                transform: translate3d(-25%, 0, 0);
              }
            }

            @media (prefers-reduced-motion: reduce) {
              .skills-track-animate {
                animation: none;
                transform: none;
              }
            }
          `}</style>
        </motion.div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-muted-foreground">No programming languages available yet.</p>
        </div>
      )}
    </AnimatedSection>
  );
};

export default SkillsSection;
