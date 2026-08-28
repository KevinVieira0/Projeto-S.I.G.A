import styles from "../../app/solicitacao/page.module.css";

export default function Selectsolicitacao({ label, name, value, onChange, options, largo = false }) {
  return (
    <div className={`${styles.campo} ${largo ? styles.campoLargo : ""}`}>
      <p className={styles.titulodoInput}>{label}</p>
      <select name={name} value={value} onChange={onChange}>
        <option value="">Selecione</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}