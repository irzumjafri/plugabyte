'use client';

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import styles from './Hero.module.css';

// Load ThreeCanvas dynamically with no SSR
const ThreeCanvas = dynamic(() => import('./ThreeCanvas'), { ssr: false });

export default function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  } as const;

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
  } as const;

  return (
    <section className={styles.hero}>
      {/* 3D background */}
      <ThreeCanvas />

      {/* Main text content */}
      <motion.div 
        className={styles.content}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className={styles.tagline} variants={itemVariants}>
          <span className={styles.pulse}></span>
          Next-Gen AI Agency
        </motion.div>
        
        <motion.h1 className={styles.title} variants={itemVariants}>
          Architecting the Future <br />
          of <span className={styles.gradient}>Autonomous Intelligence</span>
        </motion.h1>
        
        <motion.p className={styles.description} variants={itemVariants}>
          We deploy bespoke agentic systems, generative workflows, and custom cognitive models 
          that scale operations and multiply productivity.
        </motion.p>
        
        <motion.div className={styles.actions} variants={itemVariants}>
          <motion.a 
            href="#contact" 
            className={styles.primary}
            whileHover={{ y: -3, boxShadow: '0 8px 30px rgba(0, 242, 254, 0.4)' }}
            whileTap={{ scale: 0.98 }}
          >
            Schedule Consultation
          </motion.a>
          <motion.a 
            href="#services" 
            className={styles.secondary}
            whileHover={{ y: -3, background: 'rgba(255, 255, 255, 0.08)' }}
            whileTap={{ scale: 0.98 }}
          >
            Explore Services
          </motion.a>
        </motion.div>
      </motion.div>

      {/* Glowing details */}
      <div className={styles.glow1}></div>
      <div className={styles.glow2}></div>
    </section>
  );
}
