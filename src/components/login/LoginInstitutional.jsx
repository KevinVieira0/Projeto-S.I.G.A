import Image from "next/image";
import { GraduationCap, ChartNoAxesColumnIncreasing, UsersRound, Handshake, Settings } from "lucide-react";
import { THEME } from "@/constants/theme";
import styles from "./Login.module.css";

const PROFILES = ["admin", "empresa"];
const ITEM_ICONS = {
  admin: [GraduationCap, ChartNoAxesColumnIncreasing, UsersRound],
  empresa: [Handshake, UsersRound, Settings],
};

export default function LoginInstitutional({ activeTab }) {
  return (
    <aside className={styles.institutional} aria-label="SENAI – Gestão de Aprendizes">
      {/* As fotos permanecem montadas: a troca anima somente a opacidade. */}
      {PROFILES.map((profile) => {
        const theme = THEME[profile];
        const isActive = activeTab === profile;
        return (
          <div
            key={profile}
            className={`${styles.institutionalLayer} ${profile === "admin" ? styles.adminLayer : styles.empresaLayer}`}
            data-active={isActive}
            aria-hidden={!isActive}
          >
            <Image
              src={theme.image}
              alt=""
              fill
              unoptimized
              sizes="(max-width: 760px) 100vw, 620px"
              priority={profile === "admin"}
              loading={profile === "empresa" ? "eager" : undefined}
              className={styles.panelPhoto}
            />
            <div className={styles.photoTint} />
            <div className={styles.panelAccent} />
            <div className={styles.institutionalContent}>
              <div className={styles.whiteLogo} role="img" aria-label="SENAI" />
              <div className={styles.projectName}>
                <h2>S.I.G.A.</h2>
                <p>Gestão de Aprendizes</p>
              </div>
              <span className={styles.panelDivider} />
              <p className={styles.panelMessage}>{theme.title}</p>
              <ul className={styles.panelItems}>
                {theme.items.map((item, index) => {
                  const Icon = ITEM_ICONS[profile][index];
                  return <li key={item}><Icon aria-hidden="true" /><span>{item}</span></li>;
                })}
              </ul>
              <p className={styles.panelMotto}>Conhecimento<br />que transforma</p>
            </div>
          </div>
        );
      })}
    </aside>
  );
}
