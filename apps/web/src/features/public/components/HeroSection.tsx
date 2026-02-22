import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, Github, Linkedin, Mail } from "lucide-react";
import type { SiteSettings } from "@/features/public/types";

const HeroSection = ({ siteSettings }: { siteSettings: SiteSettings }) => {
  const [displayedText, setDisplayedText] = useState("");
  const { scrollY } = useScroll();

  // Parallax effects
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  // Use Convex-backed site settings data
  const fullText = siteSettings?.tagline || "Software Engineer & Data Scientist";
  const name = siteSettings?.siteName || "Kurtik Appadoo";
  const firstName = name.split(' ')[0];
  const lastName = name.split(' ').slice(1).join(' ');
  const profileImageUrl = siteSettings?.profileImage?.asset?.url;

  useEffect(() => {
    let currentIndex = 0;
    setDisplayedText("");
    const interval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 80);

    return () => clearInterval(interval);
  }, [fullText]);

  const scrollToProjects = () => {
    document.querySelector("#projects")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToContact = () => {
    document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" });
  };

  const socialLinks = [
    { href: "https://github.com/appadook", icon: Github, label: "GitHub" },
    { href: "https://www.linkedin.com/in/kurtik-appadoo-863019244/", icon: Linkedin, label: "LinkedIn" },
    { href: "mailto:kurtik.appadoo.2002@outlook.com", icon: Mail, label: "Email" }
  ];

  return (
    <motion.section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 sm:px-0"
      style={{ opacity }}
    >
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <motion.div
          className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-primary/3 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
                              linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />

        {/* Noise texture */}
        <div className="absolute inset-0 noise-overlay opacity-50" />
      </div>

      {/* Main Content */}
      <motion.div
        className="container mx-auto px-6 lg:px-8 relative z-10"
        style={{ y }}
      >
        <div className="max-w-5xl mx-auto">
          {/* Profile Picture */}
          <motion.div
            className="mb-8"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.8,
              delay: 0.2,
              type: "spring",
              stiffness: 200,
              damping: 20
            }}
          >
            <div className="relative inline-block">
              <motion.div
                className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-full p-[2px] bg-gradient-to-br from-primary to-primary-light"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-full h-full rounded-full bg-background p-1">
                  {profileImageUrl ? (
                    <div className="relative h-full w-full overflow-hidden rounded-full">
                      <Image
                        src={profileImageUrl}
                        alt={name}
                        fill
                        sizes="(max-width: 640px) 80px, (max-width: 768px) 112px, 144px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full rounded-full bg-background-subtle flex items-center justify-center">
                      <span className="font-display text-xl text-primary/70">
                        {firstName.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
              {/* Status indicator */}
              <motion.div
                className="absolute bottom-1 right-1 w-5 h-5 bg-success rounded-full border-4 border-background"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </motion.div>

          {/* Pre-title */}
          <motion.div
            className="mb-4 sm:mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <span className="inline-flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-mono text-muted-foreground">
              <span className="w-8 sm:w-12 h-px bg-primary/50" />
              Available for opportunities
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
            </span>
          </motion.div>

          {/* Main Heading - Large Serif Typography */}
          <div className="mb-6 sm:mb-8">
            <motion.h1
              className="font-display text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold tracking-tighter leading-[0.9] sm:leading-[0.85]"
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              <span className="block text-foreground">{firstName}</span>
              <span className="block">
                <span className="text-foreground">{lastName.split(' ')[0]}</span>
                {lastName.split(' ').length > 1 && (
                  <span className="text-primary italic"> {lastName.split(' ').slice(1).join(' ')}</span>
                )}
              </span>
            </motion.h1>
          </div>

          {/* Typing Subtitle */}
          <motion.div
            className="mb-8 sm:mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="w-4 sm:w-8 h-px bg-primary" />
              <span className="font-mono text-base sm:text-lg md:text-xl text-primary">
                {displayedText}
                <motion.span
                  className="inline-block w-0.5 h-5 bg-primary ml-1"
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              </span>
            </div>
          </motion.div>

          {/* Description */}
          <motion.p
            className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed mb-8 sm:mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            Crafting elegant solutions at the intersection of technology and innovation.
            Specializing in scalable systems, data-driven insights, and exceptional user experiences.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <motion.button
              onClick={scrollToProjects}
              className="group relative px-6 sm:px-8 py-3 sm:py-4 bg-primary text-primary-foreground font-medium rounded-full overflow-hidden text-sm sm:text-base"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Shimmer effect */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative flex items-center gap-2">
                View My Work
                <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              </span>
            </motion.button>

            <motion.button
              onClick={scrollToContact}
              className="px-6 sm:px-8 py-3 sm:py-4 font-medium rounded-full border border-border hover:border-primary/50 text-foreground hover:text-primary transition-all duration-300 text-sm sm:text-base"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Get in Touch
            </motion.button>
          </motion.div>

          {/* Social Links */}
          <motion.div
            className="flex items-center gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.4 }}
          >
            {socialLinks.map((social, index) => (
              <motion.a
                key={social.label}
                href={social.href}
                target={social.href.startsWith('mailto') ? undefined : "_blank"}
                rel={social.href.startsWith('mailto') ? undefined : "noopener noreferrer"}
                className="group p-3 rounded-full border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.5 + (index * 0.1) }}
                whileHover={{ y: -3 }}
              >
                <social.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </motion.a>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll Indicator - hide on very small screens */}
      <motion.div
        className="absolute bottom-8 sm:bottom-12 left-1/2 -translate-x-1/2 hidden sm:block"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 2 }}
      >
        <motion.button
          onClick={scrollToProjects}
          className="flex flex-col items-center gap-3 text-muted-foreground hover:text-primary transition-colors group"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-xs font-mono uppercase tracking-widest">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-primary/50 to-transparent" />
        </motion.button>
      </motion.div>

      {/* Decorative corner elements */}
      <div className="absolute top-32 right-12 hidden lg:block">
        <motion.div
          className="w-24 h-24 border border-primary/20 rounded-full"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 1.8 }}
        />
      </div>
      <div className="absolute bottom-32 left-12 hidden lg:block">
        <motion.div
          className="w-16 h-16 border border-primary/10"
          initial={{ scale: 0, opacity: 0, rotate: 0 }}
          animate={{ scale: 1, opacity: 1, rotate: 45 }}
          transition={{ duration: 1, delay: 2 }}
        />
      </div>
    </motion.section>
  );
};

export default HeroSection;
