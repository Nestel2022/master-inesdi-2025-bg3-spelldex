import type { Spell } from "src/models/spell";
import styles from "./spell-tooltip.module.css";

type SpellTooltipProps = {
  spell: Spell;
  visible: boolean;
  x: number;
  y: number;
};

export function SpellTooltip({ spell, visible, x, y }: SpellTooltipProps) {
  if (!visible || !spell) return null;

  // Validar coordenadas
  const safeX = typeof x === 'number' && !isNaN(x) ? x : 0;
  const safeY = typeof y === 'number' && !isNaN(y) ? y : 0;

  // Detectar si el tooltip se saldría por arriba o por los lados
  const tooltipHeight = 120; // Altura aproximada del tooltip
  const tooltipWidth = 200; // Ancho aproximado del tooltip
  const margin = 20; // Margen de seguridad
  
  const shouldPositionBelow = safeY < (tooltipHeight + margin);
  const shouldPositionRight = safeX < (tooltipWidth / 2 + margin);
  const shouldPositionLeft = safeX > (window.innerWidth - tooltipWidth / 2 - margin);

  // Calcular el transform apropiado
  let transformValue = "";
  
  if (shouldPositionBelow) {
    // Posicionar debajo
    if (shouldPositionRight) {
      transformValue = `translate(0, 10px)`; // Abajo y a la derecha
    } else if (shouldPositionLeft) {
      transformValue = `translate(-100%, 10px)`; // Abajo y a la izquierda
    } else {
      transformValue = `translate(-50%, 10px)`; // Abajo y centrado
    }
  } else {
    // Posicionar arriba (comportamiento normal)
    if (shouldPositionRight) {
      transformValue = `translate(0, -100%)`; // Arriba y a la derecha
    } else if (shouldPositionLeft) {
      transformValue = `translate(-100%, -100%)`; // Arriba y a la izquierda
    } else {
      transformValue = `translate(-50%, -100%)`; // Arriba y centrado
    }
  }

  // Determinar si requiere concentración basado en la duración
  const requiresConcentration = spell.duration && 
                               spell.duration.includes("turn") && 
                               !spell.duration.includes("-") && 
                               (() => {
                                 const parsed = parseInt(spell.duration);
                                 return !isNaN(parsed) && parsed > 1;
                               })();

  // Obtener tipos de daño únicos de forma segura
  const damageTypes = (spell.damage || [])
    .map(d => d?.damageType)
    .filter(Boolean);
  const uniqueDamageTypes = [...new Set(damageTypes)];

  // Iconos de tipos de daño más completos
  const damageTypeIcons: Record<string, string> = {
    "Fire": "🔥",
    "Ice": "❄️", 
    "Cold": "❄️",
    "Acid": "🧪",
    "Lightning": "⚡",
    "Thunder": "🌩️",
    "Necrotic": "💀",
    "Radiant": "☀️",
    "Psychic": "🧠",
    "Force": "🌀",
    "Poison": "☠️",
    "Piercing": "🗡️",
    "Slashing": "⚔️",
    "Bludgeoning": "🔨",
    "Magical": "✨",
    "Physical": "💪",
    "Healing": "💚"
  };

  return (
    <div 
      className={`${styles.tooltip} ${shouldPositionBelow ? styles.tooltipBelow : ''}`}
      style={{ 
        left: safeX, 
        top: safeY,
        transform: transformValue
      }}
    >
      <div className={styles.header}>
        <span className={styles.spellName}>{spell.name || "Unknown Spell"}</span>
      </div>
      
      <div className={styles.content}>
        <div className={styles.details}>
          <span className={styles.level}>Level {spell.level ?? 0}</span>
          {spell.action && <span className={styles.action}>{spell.action}</span>}
          {spell.range && <span className={styles.range}>{spell.range}</span>}
          {spell.damage && spell.damage.length > 0 && (
            <span className={styles.damage}>
              {spell.damage
                .filter(d => d && d.dice && d.damageType)
                .map(d => `${d.dice} ${d.damageType}`)
                .join(", ")}
            </span>
          )}
        </div>

        <div className={styles.icons}>
          {requiresConcentration && (
            <div className={styles.iconItem} title="Requires Concentration">
              <span className={styles.icon}>🧠</span>
              <span className={styles.iconLabel}>Concentration</span>
            </div>
          )}
          
          {spell.upcast && (
            <div className={styles.iconItem} title="Can be Upcast">
              <span className={styles.icon}>⬆️</span>
              <span className={styles.iconLabel}>Upcast</span>
            </div>
          )}
          
          {uniqueDamageTypes.length > 0 && (
            <div className={styles.damageTypes}>
              {uniqueDamageTypes.map((damageType, index) => {
                if (!damageType) return null;
                return (
                  <div key={index} className={styles.iconItem} title={`${damageType} damage`}>
                    <span className={styles.icon}>
                      {damageTypeIcons[damageType] || "💥"}
                    </span>
                    <span className={styles.iconLabel}>{damageType}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
