import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  id?: string;
}

const AnimatedSection = ({
  children,
  className = "",
  delay = 0,
  direction = "up",
  id,
}: AnimatedSectionProps) => {
  const directionVariants = {
    up: { y: 60, opacity: 0 },
    down: { y: -60, opacity: 0 },
    left: { x: -60, opacity: 0 },
    right: { x: 60, opacity: 0 },
  };

  return (
    <motion.div
      id={id}
      className={className}
      initial={directionVariants[direction]}
      whileInView={{
        y: 0,
        x: 0,
        opacity: 1,
        transition: {
          duration: 0.8,
          delay,
          ease: [0.25, 0.25, 0.25, 0.75],
        },
      }}
      viewport={{
        once: true,
        amount: 0.1,
        margin: "-100px",
      }}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedSection;
