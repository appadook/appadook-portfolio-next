import { PortfolioFrame, PortfolioFooter } from './components/PortfolioFrame';
import Navigation from '@/features/public/components/Navigation';
import HeroSection from '@/features/public/components/HeroSection';
import AboutSection from '@/features/public/components/AboutSection';
import ProjectsSection from '@/features/public/components/ProjectsSection';
import ExperienceSection from '@/features/public/components/ExperienceSection';
import SkillsSection from '@/features/public/components/SkillsSection';
import TechnologiesSectionNew from '@/features/public/components/TechnologiesSectionNew';
import ContactSection from '@/features/public/components/ContactSection';
import type { PortfolioSnapshot } from '@/features/public/types';

const PortfolioPage = ({ snapshot }: { snapshot: PortfolioSnapshot }) => {
  return (
    <PortfolioFrame>
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

        <PortfolioFooter year={new Date().getFullYear()} />
      </div>
    </PortfolioFrame>
  );
};

export default PortfolioPage;
