import styles from "../../app/solicitacao/page.module.css";

export default function Inputsolicitacao({ label, name, value, onChange, placeholder, largo = false, tipo = "input" }) {
  return (
    <div className={`${styles.campo} ${largo ? styles.campoLargo : ""}`}>
      <p className={styles.titulodoInput}>{label}</p>
      {tipo === "textarea" ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={4}
        />
      ) : (
        <input
          type={tipo}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

