import { motion } from "framer-motion";

const starAssets = [
  "/loading-star-1.png",
  "/loading-star-2.png",
  "/loading-star-3.png",
];

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-2.5 py-1 h-8">
      {starAssets.map((src, index) => (
        <motion.img
          key={index}
          src={src}
          alt="Thinking Star"
          initial={{ opacity: 0.35, scale: 0.85, rotate: 0 }}
          animate={{
            opacity: [0.35, 1, 0.35],
            scale: [0.85, 1.2, 0.85],
            rotate: [0, 12, -12, 0],
          }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            delay: index * 0.22,
            ease: "easeInOut",
          }}
          className="w-5 h-5 md:w-6 md:h-6 object-contain filter drop-shadow-[0_0_10px_rgba(168,85,247,0.7)]"
        />
      ))}
    </div>
  );
}