import Image from 'next/image';
import { X, Github, ExternalLink, Calendar, User, Code, Sparkles, Target } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { Project } from '@/features/public/types';

interface ProjectModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProjectModal = ({ project, isOpen, onClose }: ProjectModalProps) => {
  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border border-border/50 p-0">
        {/* Hero Image */}
        <div className="relative h-56 md:h-72 overflow-hidden">
          {project.image ? (
            <Image
              src={project.image}
              alt={project.title}
              fill
              sizes="(max-width: 768px) 100vw, 896px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-card-hover to-card flex items-center justify-center">
              <span className="text-6xl font-display text-primary/20">
                {project.title.charAt(0)}
              </span>
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all duration-300"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex flex-wrap gap-2 mb-3">
              {project.categories.map((category) => (
                <span key={category} className="tag-luxe text-xs">
                  {category}
                </span>
              ))}
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-semibold text-foreground">
              {project.title}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-primary" />
              <h3 className="font-display text-lg font-semibold text-foreground">Overview</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {project.longDescription || project.description}
            </p>
          </div>

          {/* Project Meta */}
          {(project.timeline || project.teamSize) && (
            <div className="flex flex-wrap gap-6 py-4 border-y border-border/50">
              {project.timeline && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary/70" />
                  <div>
                    <p className="text-xs text-muted-foreground font-mono uppercase">Timeline</p>
                    <p className="text-sm font-medium text-foreground">{project.timeline}</p>
                  </div>
                </div>
              )}
              {project.teamSize && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary/70" />
                  <div>
                    <p className="text-xs text-muted-foreground font-mono uppercase">Team Size</p>
                    <p className="text-sm font-medium text-foreground">{project.teamSize}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tech Stack */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Code className="w-4 h-4 text-primary" />
              <h3 className="font-display text-lg font-semibold text-foreground">Technologies</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {project.techStack.map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1.5 text-xs font-mono text-muted-foreground bg-background-subtle rounded-lg border border-border/50 hover:border-primary/30 hover:text-primary transition-colors duration-300"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Features */}
          {project.features && project.features.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="font-display text-lg font-semibold text-foreground">Key Features</h3>
              </div>
              <ul className="space-y-2">
                {project.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Challenges & Outcomes */}
          {(project.challenges || project.outcomes) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {project.challenges && project.challenges.length > 0 && (
                <div className="p-5 bg-background-subtle/50 rounded-xl border border-border/30">
                  <h4 className="font-display text-base font-semibold text-foreground mb-3">Challenges</h4>
                  <ul className="space-y-2">
                    {project.challenges.map((challenge, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 bg-primary/50 rounded-full mt-1.5 flex-shrink-0" />
                        <span className="text-xs text-muted-foreground">{challenge}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {project.outcomes && project.outcomes.length > 0 && (
                <div className="p-5 bg-background-subtle/50 rounded-xl border border-border/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-success" />
                    <h4 className="font-display text-base font-semibold text-foreground">Outcomes</h4>
                  </div>
                  <ul className="space-y-2">
                    {project.outcomes.map((outcome, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 bg-success rounded-full mt-1.5 flex-shrink-0" />
                        <span className="text-xs text-muted-foreground">{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-border/50">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition-all duration-300"
              >
                <Github className="w-4 h-4" />
                <span className="text-sm font-medium">View Code</span>
              </a>
            )}
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition-all duration-300"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-sm font-medium">Live Demo</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="ml-auto inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              Close
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectModal;
