'use client';

import { motion } from 'framer-motion';
import styles from './Services.module.css';

const SERVICES = [
  {
    icon: '🧠',
    title: 'Cognitive Architecture',
    description: 'Design and implementation of multi-agent orchestration frameworks and Custom GPTs tailored to automate decision-making pipelines.'
  },
  {
    icon: '⚡',
    title: 'Generative AI Workflows',
    description: 'Integrate LLMs, vector search, and RAG architectures directly into your existing enterprise software stack.'
  },
  {
    icon: '📊',
    title: 'Predictive Modeling & RAG',
    description: 'Structure custom knowledge graphs, optimize prompt routing engines, and implement semantic enterprise search engines.'
  },
  {
    icon: '🤖',
    title: 'Bespoke AI Agents',
    description: 'Develop specialized AI workers capable of using external browser environments, tools, APIs, and executing complex, multi-step actions.'
  },
  {
    icon: '🛡️',
    title: 'Security & Alignment Audits',
    description: 'Establish guardrails, verify data privacy protocols, audit prompt injection risks, and evaluate latency/cost metrics.'
  },
  {
    icon: '🚀',
    title: 'Scale & Fine-Tuning',
    description: 'Fine-tune open-source models (Llama, Mistral, Qwen) for domain-specific contexts to achieve superior performance at lower costs.'
  }
];

export default function Services() {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  } as const;

  const cardVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  } as const;

  return (
    <section id="services" className={styles.services}>
      <div className={styles.header}>
        <motion.span 
          className={styles.pretitle}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Capabilities
        </motion.span>
        <motion.h2 
          className={styles.title}
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          AI Infrastructure for Tomorrow
        </motion.h2>
      </div>

      <motion.div 
        className={styles.grid}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
      >
        {SERVICES.map((service, index) => (
          <motion.div 
            key={index} 
            className={styles.card}
            variants={cardVariants}
            whileHover={{ 
              y: -8, 
              borderColor: 'rgba(0, 242, 254, 0.4)',
              boxShadow: '0 10px 30px rgba(0, 242, 254, 0.1)'
            }}
          >
            <div className={styles.icon}>{service.icon}</div>
            <h3 className={styles.cardTitle}>{service.title}</h3>
            <p className={styles.cardDesc}>{service.description}</p>
            <div className={styles.cardGlow}></div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
