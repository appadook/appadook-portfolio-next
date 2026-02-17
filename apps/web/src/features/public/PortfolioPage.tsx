'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import AboutSection from '@/components/AboutSection';
import ProjectsSection from '@/components/ProjectsSection';
import ExperienceSection from '@/components/ExperienceSection';
import SkillsSection from '@/components/SkillsSection';
import TechnologiesSectionNew from '@/components/TechnologiesSectionNew';
import ContactSection from '@/components/ContactSection';
import AnimatedSection from '@/components/AnimatedSection';
import type { PortfolioSnapshot } from '@/lib/portfolio.types';

const BackgroundSpline = dynamic(() => import('@/components/BackgroundSpline'), {
  ssr: false,
});

const PortfolioPage = ({ snapshot }: { snapshot: PortfolioSnapshot }) => {
  return (
    <motion.div
      className="min-h-screen bg-background relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <BackgroundSpline />
      <div className="relative z-10">
        <Navigation siteSettings={snapshot.siteSettings} />
        <HeroSection siteSettings={snapshot.siteSettings} />
        <AboutSection
          categories={snapshot.aboutCategories}
          items={snapshot.aboutItems}
        />
        <ProjectsSection projects={snapshot.projects} />
        <ExperienceSection
          experiences={snapshot.experiences}
          siteSettings={snapshot.siteSettings}
        />
        <SkillsSection programmingLanguages={snapshot.programmingLanguages} />
        <TechnologiesSectionNew
          technologies={snapshot.technologies}
          cloudProviders={snapshot.cloudProviders}
        />
        <ContactSection />

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
                  © {new Date().getFullYear()} Kurtik Appadoo. Built with passion.
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
      </div>
    </motion.div>
  );
};

export default PortfolioPage;
