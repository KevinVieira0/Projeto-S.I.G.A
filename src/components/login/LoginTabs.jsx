"use client";

import { THEME } from "@/constants/theme";
import styles from "./Login.module.css";

const TAB_IDS = ["admin", "empresa"];

export default function LoginTabs({ activeTab, onChange }) {
  return (
    <div role="group" aria-label="Selecione o tipo de acesso" className={styles.tabs}>
      <span className={styles.tabIndicator} aria-hidden="true" />
      {TAB_IDS.map((id) => {
        const theme = THEME[id];
        const Icon = theme.icon;
        return (
          <button key={id} type="button" onClick={() => onChange(id)} aria-pressed={activeTab === id}>
            <Icon aria-hidden="true" />
            {theme.label}
          </button>
        );
      })}
    </div>
  );
}
