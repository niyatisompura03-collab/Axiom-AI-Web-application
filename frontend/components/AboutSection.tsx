import React from 'react';
import styles from './AboutSection.module.css';

const AboutSection: React.FC = () => (
  <div className={styles.container}>
    <div className={styles.field}>
      <span className={styles.label}>Version</span>
      <span className={styles.value}>1.0</span>
    </div>
    <div className={styles.field}>
      <span className={styles.label}>Built by</span>
      <span className={styles.value}>Niyati Sompura</span>
    </div>
    <div className={styles.field}>
      <span className={styles.label}>Technology Stack</span>
      <div className={styles.techStack}>
        <span>FastAPI</span>
        <span>GPT</span>
        <span>MongoDB</span>
        <span>Next.js</span>
      </div>
    </div>
  </div>
);

export default AboutSection;
