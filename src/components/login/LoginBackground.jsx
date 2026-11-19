import styles from "./Login.module.css";

export default function LoginBackground() {
  return (
    <div className={styles.background} aria-hidden="true">
      <div className={styles.gridTop} />
      <div className={styles.gridBottom} />
      <svg className={styles.traceTop} viewBox="0 0 440 240" fill="none">
        <path d="M-10 160H80Q95 160 108 147L265-10M-10 205H180Q196 205 209 192L410-10" />
      </svg>
      <svg className={styles.traceBottom} viewBox="0 0 440 240" fill="none">
        <path d="M-10 160H80Q95 160 108 147L265-10M-10 205H180Q196 205 209 192L410-10" />
      </svg>
      <div className={styles.backgroundDiamond} />
    </div>
  );
}
