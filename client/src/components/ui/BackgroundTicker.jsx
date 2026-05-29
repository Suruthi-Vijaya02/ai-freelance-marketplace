import { motion } from 'framer-motion';

const WORDS = [
  "REVENUE", "GROWTH", "MILESTONE", "PROPOSAL",
  "ESCROW", "DEAL CLOSED", "INTERVIEW", "HIRED",
  "INVOICE", "$10K", "TALENT", "DEADLINE",
  "SPRINT", "LAUNCH", "CLIENT", "PITCH",
  "CONTRACT", "DELIVER", "FEEDBACK", "SCALE",
  "FREELANCE", "BUILD", "SHIP IT", "MVP",
  "NEGOTIATE", "ONBOARD", "REMOTE", "ASYNC",
];

export default function BackgroundTicker() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
      }}
    >
      {/* Column 1 */}
      <motion.div
        animate={{ y: ['0%', '-100%'] }}
        transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
        className="flex flex-col items-center"
      >
        {[...WORDS, ...WORDS, ...WORDS].map((word, i) => (
          <span
            key={i}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.15em',
              color: 'var(--color-black)',
              opacity: 0.045,
              marginBottom: '28px',
              display: 'block',
            }}
          >
            {word}
          </span>
        ))}
      </motion.div>

      {/* Column 2 */}
      <motion.div
        animate={{ y: ['-20%', '-120%'] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
        className="flex flex-col items-center"
      >
        {[...WORDS, ...WORDS, ...WORDS].sort(() => Math.random() - 0.5).map((word, i) => (
          <span
            key={i}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.15em',
              color: 'var(--color-black)',
              opacity: 0.045,
              marginBottom: '28px',
              display: 'block',
            }}
          >
            {word}
          </span>
        ))}
      </motion.div>

      {/* Column 3 */}
      <motion.div
        animate={{ y: ['-10%', '-110%'] }}
        transition={{ duration: 42, repeat: Infinity, ease: 'linear' }}
        className="flex flex-col items-center"
      >
        {[...WORDS, ...WORDS, ...WORDS].sort(() => Math.random() - 0.5).map((word, i) => (
          <span
            key={i}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.15em',
              color: 'var(--color-black)',
              opacity: 0.045,
              marginBottom: '28px',
              display: 'block',
            }}
          >
            {word}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
