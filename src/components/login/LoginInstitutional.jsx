import Image from "next/image";
import {
  GraduationCap,
  ChartNoAxesColumnIncreasing,
  UsersRound,
  Handshake,
  Settings,
} from "lucide-react";
import { THEME } from "@/constants/theme";
import styles from "./Login.module.css";

const PERFIS = ["admin", "empresa"];
const ICONES_ITENS = {
  admin: [GraduationCap, ChartNoAxesColumnIncreasing, UsersRound],
  empresa: [Handshake, UsersRound, Settings],
};

export default function LoginInstitutional({ activeTab: abaAtiva }) {
  return (
    <aside className={styles.institutional} aria-label="SENAI – Gestão de Aprendizes">
      {/* As fotos permanecem montadas: a troca anima somente a opacidade. */}
      {PERFIS.map((perfil) => {
        const tema = THEME[perfil];
        const isActive = abaAtiva === perfil;
        return (
          <div
            key={perfil}
            className={`${styles.institutionalLayer} ${perfil === "admin" ? styles.adminLayer : styles.empresaLayer}`}
            data-active={isActive}
            aria-hidden={!isActive}
          >
            <Image
              src={tema.image}
              alt=""
              fill
              unoptimized
              sizes="(max-width: 760px) 100vw, 620px"
              priority={perfil === "admin"}
              loading={perfil === "empresa" ? "eager" : undefined}
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
              <p className={styles.panelMessage}>{tema.title}</p>
              <ul className={styles.panelItems}>
                {tema.items.map((item, indice) => {
                  const Icon = ICONES_ITENS[perfil][indice];
                  return (
                    <li key={item}>
                      <Icon aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  );
                })}
              </ul>
              <p className={styles.panelMotto}>
                Conhecimento
                <br />
                que transforma
              </p>
            </div>
          </div>
        );
      })}
    </aside>
  );
}
