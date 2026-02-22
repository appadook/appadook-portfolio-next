import { useState, useMemo, useCallback, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Github, ExternalLink, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import ProjectModal from "./ProjectModal";
import type { Project } from "@/features/public/types";
import { getProjectCardMeta } from "@/features/public/lib/projectCardMeta";
import AnimatedSection from "./AnimatedSection";
import { useBreakpoint } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const categories = [
  "All",
  "AI/ML",
  "Software Engineering",
  "Web Dev",
  "System Engineering",
  "Quantitative Dev",
  "Research",
];

const statusRibbonToneClassNames = {
  danger: "bg-destructive/90 text-destructive-foreground",
  success: "bg-emerald-500/90 text-emerald-950",
  brand: "bg-primary/90 text-primary-foreground",
  neutral: "bg-muted/90 text-foreground",
} as const;

const actionToneClassNames = {
  github:
    "border-violet-500/40 bg-violet-500/10 text-violet-200 hover:border-violet-400/70 hover:bg-violet-500/20",
  live: "border-orange-500/40 bg-orange-500/10 text-orange-200 hover:border-orange-400/70 hover:bg-orange-500/20",
} as const;

function ProjectStatusRibbon({ project }: { project: Project }) {
  const { badges } = getProjectCardMeta(project);
  const statusBadge = badges.find((badge) => badge.key === "new" || badge.key === "deprecated");

  if (!statusBadge) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute right-0 top-0 z-20 h-24 w-24 overflow-hidden">
      <span
        className={cn(
          "absolute right-[-32px] top-[14px] w-[124px] rotate-45 py-1 text-center text-[10px] font-semibold uppercase tracking-[0.18em] shadow-lg backdrop-blur-sm",
          statusRibbonToneClassNames[statusBadge.tone],
        )}
      >
        {statusBadge.label}
      </span>
    </div>
  );
}

function ProjectCardActions({ project, compact = false }: { project: Project; compact?: boolean }) {
  const { links } = getProjectCardMeta(project);

  return (
    <div className={cn("mt-3 flex items-center justify-between gap-2 border-t border-border/50 pt-3", compact && "mt-2 pt-2")}>
      <div className="flex items-center gap-1.5">
        {links.map((link) => (
          <motion.a
            key={link.key}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border font-mono uppercase tracking-wide transition-all duration-300",
              compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-1 text-[10px]",
              actionToneClassNames[link.key],
            )}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            {link.key === "github" ? <Github className="h-3 w-3" /> : <ExternalLink className="h-3 w-3" />}
            {link.key === "github" ? "GitHub" : "Live"}
          </motion.a>
        ))}
      </div>
      <span
        className={cn(
          "font-mono text-muted-foreground transition-colors duration-300 group-hover:text-primary",
          compact ? "text-[10px]" : "text-[11px]",
        )}
      >
        Details
      </span>
    </div>
  );
}

const ProjectsSection = ({ projects }: { projects: Project[] }) => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Breakpoint detection for mobile carousel
  const { isSmall } = useBreakpoint();
  
  // Embla carousel for mobile
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    slidesToScroll: 1,
  });
  
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);
  
  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    return selectedCategory === "All"
      ? projects
      : projects.filter((project) =>
          project.categories.includes(selectedCategory)
        );
  }, [projects, selectedCategory]);

  const openProjectModal = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const closeProjectModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  return (
    <AnimatedSection id="projects" className="py-20 md:py-32 relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-primary/2 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          viewport={{ once: true }}
        >
          {/* Pre-title */}
          <motion.div
            className="flex items-center gap-4 mb-6"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <span className="w-12 h-px bg-primary/50" />
            <span className="text-sm font-mono text-primary uppercase tracking-widest">
              Portfolio
            </span>
          </motion.div>

          {/* Main Title */}
          <motion.h2
            className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-4 sm:mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <span className="text-foreground">Featured </span>
            <span className="text-primary italic">Work</span>
          </motion.h2>

          {/* Description */}
          <motion.p
            className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            A showcase of my work spanning software engineering, machine
            learning, and quantitative research.
          </motion.p>
        </motion.div>

        {/* Category Filter - horizontally scrollable on mobile */}
        <motion.div
          className="flex gap-2 sm:gap-3 mb-8 sm:mb-12 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap scrollbar-hide"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          {categories.map((category, index) => (
            <motion.button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                selectedCategory === category
                  ? "bg-primary text-primary-foreground"
                  : "border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
              }`}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 + index * 0.05 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {category}
            </motion.button>
          ))}
        </motion.div>

        {/* Projects - Mobile Carousel / Desktop Grid */}
        {projects.length > 0 ? (
          <>
            {/* Mobile Carousel */}
            {isSmall ? (
              <div className="relative">
                {/* Carousel Container */}
                <div className="overflow-hidden" ref={emblaRef}>
                  <div className="flex gap-3">
                    <AnimatePresence mode="popLayout">
                      {filteredProjects.map((project, index) => (
                        <motion.div
                          key={project._id}
                          className="flex-shrink-0 w-[calc(50%-6px)]"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <motion.div
                            className="card-luxe h-full cursor-pointer group overflow-hidden border border-border/60 shadow-[0_14px_36px_rgba(0,0,0,0.32)] transition-shadow duration-300 hover:shadow-[0_20px_44px_rgba(0,0,0,0.42)]"
                            onClick={() => openProjectModal(project)}
                            whileTap={{ scale: 0.98 }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.code === "Enter" || e.code === "Space") {
                                if (e.code === "Space") e.preventDefault();
                                openProjectModal(project);
                              }
                            }}
                          >
                            {/* Project Image */}
                            <div className="relative h-28 overflow-hidden">
                              {project.image ? (
                                <>
                                  <Image
                                    src={project.image}
                                    alt={project.title}
                                    fill
                                    sizes="(max-width: 768px) 50vw, 280px"
                                    className="object-cover"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                                </>
                              ) : (
                                <div className="h-full bg-gradient-to-br from-card-hover to-card flex items-center justify-center">
                                  <span className="text-3xl font-display text-primary/20">
                                    {project.title.charAt(0)}
                                  </span>
                                </div>
                              )}
                              {/* Category Badge */}
                              <div className="absolute top-2 left-2">
                                <span className="tag-luxe text-[10px] px-1.5 py-0.5">
                                  {project.categories[0]}
                                </span>
                              </div>

                              <ProjectStatusRibbon project={project} />
                            </div>

                            {/* Content */}
                            <div className="p-3">
                              <h3 className="font-display text-sm font-semibold mb-1 text-foreground line-clamp-1">
                                {project.title}
                              </h3>
                              <p className="text-[11px] text-muted-foreground leading-relaxed mb-2 line-clamp-2">
                                {project.description}
                              </p>
                              {/* Tech Stack - show only 2 on mobile */}
                              <div className="flex flex-wrap gap-1">
                                {project.techStack.slice(0, 2).map((tech) => (
                                  <span
                                    key={tech}
                                    className="px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground bg-background-subtle rounded border border-border/50"
                                  >
                                    {tech}
                                  </span>
                                ))}
                                {project.techStack.length > 2 && (
                                  <span className="px-1.5 py-0.5 text-[9px] font-mono text-primary bg-primary/10 rounded">
                                    +{project.techStack.length - 2}
                                  </span>
                                )}
                              </div>
                              <ProjectCardActions project={project} compact />
                            </div>
                          </motion.div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
                
                {/* Navigation Buttons */}
                <div className="flex justify-center gap-4 mt-4">
                  <motion.button
                    onClick={scrollPrev}
                    disabled={!canScrollPrev}
                    className={`p-2 rounded-full border transition-all duration-200 ${
                      canScrollPrev 
                        ? 'border-primary/50 text-primary hover:bg-primary/10' 
                        : 'border-border/30 text-muted-foreground/30'
                    }`}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Previous project"
                    aria-disabled={!canScrollPrev}
                  >
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  </motion.button>
                  <motion.button
                    onClick={scrollNext}
                    disabled={!canScrollNext}
                    className={`p-2 rounded-full border transition-all duration-200 ${
                      canScrollNext 
                        ? 'border-primary/50 text-primary hover:bg-primary/10' 
                        : 'border-border/30 text-muted-foreground/30'
                    }`}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Next project"
                    aria-disabled={!canScrollNext}
                  >
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </motion.button>
                </div>
              </div>
            ) : (
              /* Desktop Grid */
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true, amount: 0.1 }}
              >
                <AnimatePresence mode="popLayout">
                  {filteredProjects.map((project, index) => (
                    <motion.div
                      key={project._id}
                      layout
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{
                        opacity: 1,
                        y: 0,
                        transition: {
                          duration: 0.6,
                          delay: index * 0.1,
                          ease: [0.4, 0, 0.2, 1],
                        },
                      }}
                      exit={{
                        opacity: 0,
                        scale: 0.95,
                        transition: { duration: 0.3 },
                      }}
                      viewport={{ once: true, amount: 0.2 }}
                    >
                      <motion.div
                        className="card-luxe h-full cursor-pointer group overflow-hidden border border-border/60 shadow-[0_18px_40px_rgba(0,0,0,0.36)] transition-shadow duration-300 hover:shadow-[0_28px_56px_rgba(0,0,0,0.46)]"
                        onClick={() => openProjectModal(project)}
                        whileHover={{ y: -8 }}
                        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.code === "Enter" || e.code === "Space") {
                            if (e.code === "Space") e.preventDefault();
                            openProjectModal(project);
                          }
                        }}
                      >
                        {/* Project Image */}
                        <div className="relative h-36 overflow-hidden">
                          {project.image ? (
                            <>
                              <Image
                                src={project.image}
                                alt={project.title}
                                fill
                                sizes="(max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                              {/* Gradient overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                              {/* Gold shimmer on hover */}
                              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            </>
                          ) : (
                            <div className="h-full bg-gradient-to-br from-card-hover to-card flex items-center justify-center">
                              <span className="text-4xl font-display text-primary/20">
                                {project.title.charAt(0)}
                              </span>
                            </div>
                          )}

                          {/* Category Badge */}
                          <div className="absolute top-4 left-4">
                            <span className="tag-luxe text-xs">
                              {project.categories[0]}
                            </span>
                          </div>

                          <ProjectStatusRibbon project={project} />

                          {/* View indicator on hover */}
                          <motion.div
                            className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            initial={{ scale: 0.8 }}
                            whileHover={{ scale: 1 }}
                          >
                            <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center backdrop-blur-sm">
                              <ArrowUpRight className="w-5 h-5 text-primary-foreground" />
                            </div>
                          </motion.div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                          {/* Title */}
                          <h3 className="font-display text-base font-semibold mb-1.5 text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-1">
                            {project.title}
                          </h3>

                          {/* Description */}
                          <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                            {project.description}
                          </p>

                          {/* Tech Stack */}
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {project.techStack.slice(0, 3).map((tech) => (
                              <span
                                key={tech}
                                className="px-2 py-0.5 text-[10px] font-mono text-muted-foreground bg-background-subtle rounded border border-border/50"
                              >
                                {tech}
                              </span>
                            ))}
                            {project.techStack.length > 3 && (
                              <span className="px-2 py-0.5 text-[10px] font-mono text-primary bg-primary/10 rounded">
                                +{project.techStack.length - 3}
                              </span>
                            )}
                          </div>

                          <ProjectCardActions project={project} />
                        </div>
                      </motion.div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </>
        ) : (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">No projects available yet.</p>
          </div>
        )}

        {/* Results count */}
        {projects.length > 0 && (
          <motion.div
            className="mt-8 sm:mt-12 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
          >
            <p className="text-sm text-muted-foreground font-mono">
              Showing {filteredProjects.length} of {projects?.length || 0} projects
            </p>
          </motion.div>
        )}

        {/* Project Modal */}
        <ProjectModal
          project={selectedProject}
          isOpen={isModalOpen}
          onClose={closeProjectModal}
        />
      </div>
    </AnimatedSection>
  );
};

export default ProjectsSection;
