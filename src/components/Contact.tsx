'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import styles from './Contact.module.css';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name && form.email && form.message) {
      setSubmitted(true);
    }
  };

  return (
    <section id="contact" className={styles.contact}>
      <div className={styles.container}>
        <div className={styles.info}>
          <motion.h2 
            className={styles.title}
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Ready to Build <br />
            the Autonomous Future?
          </motion.h2>
          <motion.p 
            className={styles.desc}
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Drop us a line to discuss integration, bespoke models, or automation audits. 
            We respond within 24 hours.
          </motion.p>
          <motion.div 
            className={styles.details}
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className={styles.detailItem}>
              <span className={styles.detailIcon}>✉️</span>
              <a href="mailto:hello@plugabyte.com">hello@plugabyte.com</a>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailIcon}>📍</span>
              <span>San Francisco, CA & Remote</span>
            </div>
          </motion.div>
        </div>

        <motion.div 
          className={styles.formContainer}
          initial={{ scale: 0.95, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {submitted ? (
            <motion.div 
              className={styles.success}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <h3>✓ Message Received</h3>
              <p>One of our cognitive architects will reach out shortly.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="name">Name</label>
                <input 
                  type="text" 
                  id="name" 
                  required 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                  placeholder="John Doe"
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="email">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  required 
                  value={form.email} 
                  onChange={(e) => setForm({ ...form, email: e.target.value })} 
                  placeholder="john@company.com"
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="message">Project Scope</label>
                <textarea 
                  id="message" 
                  required 
                  rows={4}
                  value={form.message} 
                  onChange={(e) => setForm({ ...form, message: e.target.value })} 
                  placeholder="Tell us about the workflows you want to automate..."
                />
              </div>
              <motion.button 
                type="submit" 
                className={styles.submit}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Send Message
              </motion.button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
