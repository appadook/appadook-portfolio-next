"use client";

import { motion, useInView, useScroll } from "framer-motion";
import Image from "next/image";
import { Briefcase, Calendar, MapPin, ArrowUpRight, ChevronDown } from "lucide-react";
import { useRef, useMemo, useState } from "react";
import type { Experience, SiteSettings } from "@/features/public/types";

interface ExperienceGroup {
  id: string;
  company: string;
  logo?: string;
  location: string;
  experiences: Experience[];
}

function groupExperiences(experiences: Experience[]): ExperienceGroup[] {
  if (!experiences?.length) return [];
  const groups: ExperienceGroup[] = [];
  let current: Experience[] = [];
  let currentCompany = "";
  experiences.forEach((exp, i) => {
    const normalized = exp.company.trim().toLowerCase();
    if (i === 0 || normalized === currentCompany) {
      if (i === 0) currentCompany = normalized;
      current.push(exp);
    } else {
      groups.push({ id: current[0]._id, company: current[0].company, logo: current[0].logo, location: current[0].location, experiences: current });
      currentCompany = normalized;
      current = [exp];
    }
  });
  if (current.length) groups.push({ id: current[0]._id, company: current[0].company, logo: current[0].logo, location: current[0].location, experiences: current });
  return groups;
}

export default function ExperienceSection({ experiences, siteSettings }: { experiences: Experience[]; siteSettings: SiteSettings }) {
  const groups = useMemo(() => groupExperiences(experiences), [experiences]);
  const resumeUrl = siteSettings?.resume?.asset?.url;
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start 70%", "end 30%"] });

  return (
    <section id="experience" className="py-24 sm:py-32 md:py-44">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Editorial header */}
        <motion.div
          className="mb-20 md:mb-28 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
        >
          <motion.div
            className="flex items-center justify-center gap-6 mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-primary/50 to-primary" />
            <span className="text-[11px] font-mono text-primary uppercase tracking-[0.4em]">
              Experience
            </span>
            <div className="w-16 h-px bg-gradient-to-l from-transparent via-primary/50 to-primary" />
          </motion.div>
          <h2 className="font-display text-4xl sm:text-5xl md:text-7xl font-semibold tracking-tight text-foreground leading-[0.95]">
            Professional
            <br />
            <span className="text-primary italic">Journey</span>
          </h2>
        </motion.div>

        <div ref={sectionRef} className="relative">
          {/* Timeline thread */}
          <div className="absolute left-[35px] sm:left-[39px] top-0 bottom-0 w-px z-0">
            <div className="absolute inset-0 bg-primary/[0.08]" />
            <motion.div
              className="absolute top-0 left-0 right-0 origin-top"
              style={{ scaleY: scrollYProgress, height: "100%", background: "linear-gradient(to bottom, hsl(var(--primary) / 0.5), hsl(var(--primary) / 0.15))" }}
            />
          </div>

          {groups.map((group, i) => (
            <EditorialCard key={group.id} group={group} index={i} isLast={i === groups.length - 1} />
          ))}
        </div>

        {resumeUrl && (
          <motion.div className="mt-24 text-center" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }} viewport={{ once: true }}>
            <a href={resumeUrl} download className="group inline-flex items-center gap-3 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              <Briefcase className="w-4 h-4" />
              Download Resume
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </motion.div>
        )}
      </div>
    </section>
  );
}

function EditorialCard({ group, index, isLast }: { group: ExperienceGroup; index: number; isLast: boolean }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <div className={`flex gap-6 sm:gap-8 ${isLast ? "" : "pb-16"}`}>
        {/* Timeline node with logo */}
        <motion.div
          className="flex-shrink-0 relative z-10"
          initial={{ scale: 0, rotate: 45 }}
          animate={isInView ? { scale: 1, rotate: 0 } : {}}
          transition={{ duration: 0.5, delay: index * 0.1 + 0.2, type: "spring", stiffness: 250, damping: 18 }}
        >
          <div className="w-[72px] h-[72px] rounded-2xl bg-card border border-border/30 flex items-center justify-center overflow-hidden shadow-2xl shadow-black/20 hover:shadow-primary/[0.08] transition-shadow duration-500">
            {group.logo ? (
              <Image src={group.logo} alt={group.company} width={72} height={72} className="w-full h-full object-contain p-3" />
            ) : (
              <Briefcase className="w-7 h-7 text-primary/40" />
            )}
          </div>
        </motion.div>

        <div className="flex-1 min-w-0 pt-2">
          {/* Company */}
          <div className="mb-5">
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight">
              {group.company}
            </h3>
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground mt-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary/30" />
              <span>{group.location}</span>
              {group.experiences.length > 1 && (
                <span className="ml-1 text-[10px] font-mono text-primary/50 border border-primary/15 px-2 py-0.5 rounded-full">
                  {group.experiences.length} roles
                </span>
              )}
            </div>
          </div>

          {/* Roles */}
          <div className="space-y-3">
            {group.experiences.map((exp) => {
              const isOpen = openId === exp._id;
              return (
                <div key={exp._id} className="group/role">
                  <button
                    onClick={() => setOpenId(isOpen ? null : exp._id)}
                    className={`w-full text-left rounded-xl px-5 py-4 sm:px-6 sm:py-5 border transition-all duration-400 ${
                      isOpen
                        ? "bg-card/80 border-primary/20 shadow-xl shadow-primary/[0.04]"
                        : "bg-transparent border-border/20 hover:bg-card/40 hover:border-border/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                          <h4 className={`text-base sm:text-lg font-semibold leading-tight transition-colors duration-300 ${
                            isOpen ? "text-primary" : "text-foreground group-hover/role:text-primary/80"
                          }`}>
                            {exp.role}
                          </h4>
                          {Boolean(exp.isCurrent) && (
                            <span className="text-[10px] font-mono text-primary/70 bg-primary/[0.08] px-2 py-0.5 rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono text-muted-foreground/60 flex items-center gap-1.5 mt-1.5">
                          <Calendar className="w-3 h-3" />
                          {exp.duration}
                        </span>
                        {!isOpen && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {exp.technologies.slice(0, 4).map(t => (
                              <span key={t} className="text-[10px] font-mono text-muted-foreground/40 bg-background/40 px-2 py-0.5 rounded">{t}</span>
                            ))}
                            {exp.technologies.length > 4 && <span className="text-[10px] font-mono text-primary/30">+{exp.technologies.length - 4}</span>}
                          </div>
                        )}
                      </div>
                      <ChevronDown className={`w-4 h-4 mt-1 text-muted-foreground/30 transition-all duration-300 ${isOpen ? "rotate-180 text-primary/60" : ""}`} />
                    </div>
                  </button>

                  <div className={`grid transition-all duration-400 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">
                      <div className="px-5 sm:px-6 pb-5 pt-1">
                        <div className="w-12 h-px bg-gradient-to-r from-primary/40 to-transparent mb-4" />
                        <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed mb-5">{exp.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {exp.technologies.map(t => (
                            <span key={t} className="text-[11px] font-mono text-muted-foreground/60 bg-background border border-border/30 px-2.5 py-1 rounded-lg hover:border-primary/25 hover:text-primary/60 transition-colors cursor-default">{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
