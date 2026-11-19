"use client";

import { THEME } from "@/constants/theme";
import styles from "./Login.module.css";

const IDS_ABAS = ["admin", "empresa"];

export default function LoginTabs({ activeTab: abaAtiva, onChange }) {
  return (
    <div role="group" aria-label="Selecione o tipo de acesso" className={styles.tabs}>
      <span className={styles.tabIndicator} aria-hidden="true" />
      {IDS_ABAS.map((id) => {
        const tema = THEME[id];
        const Icon = tema.icon;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={abaAtiva === id}
          >
            <Icon aria-hidden="true" />
            {tema.label}
          </button>
        );
      })}
    </div>
  );
}
