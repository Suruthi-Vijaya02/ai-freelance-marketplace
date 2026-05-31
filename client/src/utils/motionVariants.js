export const defaultMotion = {
  duration: 0.7,
  ease: [0.22, 1, 0.36, 1],
};

export const pageFade = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...defaultMotion },
  },
};

export const heroReveal = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...defaultMotion, delay: 0.1 },
  },
};

export const floatHero = {
  hidden: { opacity: 0, y: 16, scale: 0.98, rotate: 0.5 },
  visible: {
    opacity: 1,
    y: [0, -10, 0],
    rotate: [0.5, -0.5, 0.5],
    scale: [1, 1.03, 1],
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const fadeInUp = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...defaultMotion },
  },
};

export const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.11,
      delayChildren: 0.08,
    },
  },
};

export const hoverLift = {
  whileHover: { y: -3, scale: 1.008 },
  whileTap: { scale: 0.98 },
};
