"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AnimatedSection from "./AnimatedSection";
import { getAboutIcon } from "@/features/public/lib/aboutIcons";
import type {
  AboutCategory,
  AboutItem as AboutItemType,
} from "@/features/public/types";

type AboutSectionProps = {
  categories: AboutCategory[];
  items: AboutItemType[];
};

const AboutSection = ({ categories, items }: AboutSectionProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredData = useMemo(() => {
    return selectedCategory === "all"
      ? items
      : items.filter((item) => item.category.name === selectedCategory);
  }, [selectedCategory, items]);

  const handleCategoryChange = useCallback((name: string) => {
    setSelectedCategory(name);
  }, []);

  const scroll = useCallback((direction: "prev" | "next") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction === "next" ? 580 : -580,
      behavior: "smooth",
    });
  }, []);

  return (
    <AnimatedSection
      id="about"
      className="py-20 md:py-32 relative overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-primary/2 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          viewport={{ once: true }}
        >
          <motion.div
            className="flex items-center gap-4 mb-6"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <span className="w-12 h-px bg-primary/50" />
            <span className="text-sm font-mono text-primary uppercase tracking-widest">
              Get to Know Me
            </span>
          </motion.div>
          <motion.h2
            className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-4 sm:mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <span className="text-foreground">About </span>
            <span className="text-primary italic">Me</span>
          </motion.h2>
          <motion.p
            className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            My journey through academics, achievements, and the passions that
            drive me forward.
          </motion.p>
        </motion.div>

        {/* Filter + Nav Row */}
        <motion.div
          className="flex items-center gap-3 mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="flex gap-2 sm:gap-2.5 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap scrollbar-hide flex-1">
            <motion.button
              onClick={() => handleCategoryChange("all")}
              className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                selectedCategory === "all"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              All
            </motion.button>
            {categories?.map((category, index) => {
              const CategoryIcon = getAboutIcon(category.icon);
              return (
                <motion.button
                  key={category._id}
                  onClick={() => handleCategoryChange(category.name)}
                  className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0 ${
                    selectedCategory === category.name
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
                  <CategoryIcon className="w-4 h-4" />
                  {category.label}
                </motion.button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <motion.button
              onClick={() => scroll("prev")}
              className="w-9 h-9 rounded-full border border-border hover:border-primary/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>
            <motion.button
              onClick={() => scroll("next")}
              className="w-9 h-9 rounded-full border border-border hover:border-primary/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>

        {/* Two-Row Scrolling Grid — landscape cards */}
        <motion.div
          className="relative"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div
            ref={scrollRef}
            className="grid grid-flow-col auto-cols-[280px] sm:auto-cols-[320px] md:auto-cols-[360px] grid-rows-2 gap-5 sm:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 hide-scrollbar"
          >
            {filteredData.map((item, index) => (
              <GridCard key={item._id} item={item} index={index} />
            ))}
          </div>

          {/* Edge fades */}
          <div className="absolute top-0 bottom-0 left-0 w-10 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
          <div className="absolute top-0 bottom-0 right-0 w-10 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
        </motion.div>
      </div>

      <style>{`
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </AnimatedSection>
  );
};

function GridCard({
  item,
  index,
}: {
  item: AboutItemType;
  index: number;
}) {
  const Icon = getAboutIcon(item.icon);
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      className="snap-start"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.5,
          delay: Math.min(index * 0.06, 0.4),
          ease: [0.4, 0, 0.2, 1],
        },
      }}
      viewport={{ once: true, amount: 0.2 }}
    >
      <motion.div
        className="h-[180px] sm:h-[195px] md:h-[210px] rounded-xl overflow-hidden relative group cursor-pointer"
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        onTap={() => setHovered(!hovered)}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Full image background — object-contain so images aren't cropped */}
        {item.image ? (
          <Image
            src={item.image}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 280px, (max-width: 768px) 320px, 360px"
            className="object-contain transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          /* Icon placeholder */
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0_0%_8%)] to-[hsl(0_0%_5%)]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="absolute w-28 h-28 rounded-full blur-3xl opacity-10"
                style={{ backgroundColor: item.category.color }}
              />
              <div
                className="relative p-5 rounded-2xl border"
                style={{
                  backgroundColor: `${item.category.color}06`,
                  borderColor: `${item.category.color}12`,
                }}
              >
                <Icon
                  className="w-10 h-10"
                  style={{ color: `${item.category.color}60` }}
                />
              </div>
              <div
                className="absolute w-24 h-24 rounded-full border"
                style={{ borderColor: `${item.category.color}06` }}
              />
              <div
                className="absolute w-40 h-40 rounded-full border"
                style={{ borderColor: `${item.category.color}03` }}
              />
            </div>
          </div>
        )}

        {/* Subtle gradient for bottom title legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Category badge — top left */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span
            className="text-[9px] font-mono px-2 py-0.5 rounded-full border backdrop-blur-sm"
            style={{
              color: item.category.color,
              backgroundColor: `${item.category.color}15`,
              borderColor: `${item.category.color}28`,
            }}
          >
            {item.category.label}
          </span>
        </div>

        {/* Slim title strip — bottom of card, fades out on hover */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 px-3.5 pb-2.5 pt-5 z-10"
          animate={{ opacity: hovered ? 0 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <h3 className="font-display text-sm font-semibold text-white leading-snug line-clamp-1">
            {item.title}
          </h3>
        </motion.div>

        {/* Hover reveal panel — slides in from the right, ~38% width */}
        <motion.div
          className="absolute top-0 bottom-0 right-0 z-20"
          style={{ width: "38%" }}
          initial={{ x: "100%" }}
          animate={{ x: hovered ? 0 : "100%" }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="h-full bg-black border-l border-white/[0.08] px-3.5 py-3.5 flex flex-col overflow-hidden">
            {/* Icon + Title */}
            <div className="flex items-center gap-2 mb-2">
              <div
                className="p-0.5 rounded flex-shrink-0"
                style={{ color: item.category.color }}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <h4 className="font-display text-xs font-semibold text-foreground leading-tight line-clamp-2 flex-1">
                {item.title}
              </h4>
            </div>

            {/* Subtitle */}
            {item.subtitle && (
              <p
                className="text-[9px] font-medium mb-2 line-clamp-1"
                style={{ color: item.category.color }}
              >
                {item.subtitle}
              </p>
            )}

            {/* Description */}
            {item.description && (
              <p className="text-[10px] text-muted-foreground leading-snug line-clamp-4 flex-1">
                {item.description}
              </p>
            )}

            {/* Date at bottom */}
            {item.date && (
              <p className="text-[8px] text-muted-foreground/40 font-mono mt-auto pt-2">
                {item.date}
              </p>
            )}
          </div>
        </motion.div>

        {/* Border on hover */}
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none z-30"
          animate={{
            boxShadow: hovered
              ? `inset 0 0 0 1px ${item.category.color}30, 0 6px 28px ${item.category.color}0d`
              : "inset 0 0 0 1px hsl(0 0% 16% / 0.4), 0 0 0px transparent",
          }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>
    </motion.div>
  );
}

export default AboutSection;
