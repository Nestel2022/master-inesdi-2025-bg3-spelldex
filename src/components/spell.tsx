import c from "classnames";
import { useEffect, useMemo, useState, useRef } from "react";
import upcastIcon from "src/assets/icons/other/upcast.png";
import { SpellTooltip } from "./spell-tooltip";

import type { Spell } from "src/models/spell";

import styles from "./spell.module.css";

export function Spell({
  spell,
  highlighted,
  detailed,
  focused,
  selected: externalSelected,
  onSelect,
}: {
  spell: Spell;
  highlighted: boolean | undefined;
  detailed: boolean | undefined;
  focused?: boolean;
  selected?: boolean;
  onSelect?: (spell: Spell) => void;
}) {
  const [internalSelected, setInternalSelected] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const elementRef = useRef<HTMLElement>(null);
  
  // Usar selección externa si está disponible, sino usar la interna
  const isSelected = externalSelected !== undefined ? externalSelected : internalSelected;

  const [showImage, setShowImage] = useState(false);
  const randomDuration = useMemo(() => (Math.random() + 0.5).toFixed(2), []);
  const randomDelay = useMemo(() => (Math.random() * 2 + 1).toFixed(2), []);

  const animatedSpellStyles = {
    "--randomDelay": randomDelay + "s",
    "--randomDuration": randomDuration + "s",
  } as React.CSSProperties;

  useEffect(
    function setShowImageWhenTransitionEnds() {
      if (detailed) {
        const transitionTime =
          (parseFloat(randomDuration) + parseFloat(randomDelay)) * 1000;

        const timer = setTimeout(() => {
          setShowImage(true);
        }, transitionTime);

        return () => {
          clearTimeout(timer);
          setShowImage(false);
        };
      } else {
        setShowImage(false);
      }
    },
    [detailed, randomDuration, randomDelay]
  );

  const onClick = () => {
    if (!detailed) {
      return;
    }
    
    if (onSelect) {
      onSelect(spell);
    } else {
      setInternalSelected(!isSelected);
    }
  };

  const onMouseEnter = (event: React.MouseEvent) => {
    setIsHovered(true);
    const x = event.clientX || 0;
    const y = event.clientY || 0;
    setMousePosition({ x, y });
  };

  const onMouseMove = (event: React.MouseEvent) => {
    if (isHovered) {
      const x = event.clientX || 0;
      const y = event.clientY || 0;
      setMousePosition({ x, y });
    }
  };

  const onMouseLeave = () => {
    setIsHovered(false);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && focused && detailed) {
      event.preventDefault();
      event.stopPropagation();
      onClick();
    }
  };

  // Efecto para calcular posición del tooltip cuando se selecciona con teclado
  useEffect(() => {
    if (isSelected && !isHovered && elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect();
      setMousePosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      });
    }
  }, [isSelected, isHovered]);

  // Función para extraer tipos de daño del hechizo
  const getDamageTypes = () => {
    const damage = spell.damage;
    if (!damage || !Array.isArray(damage)) return "";
    
    return damage
      .filter(d => d && typeof d === "object" && d.damageType)
      .map(d => d.damageType)
      .join(",");
  };

  // Función para determinar si requiere concentración
  const requiresConcentration = () => {
    // Basándonos en el tipo de duración y patrones conocidos para determinar concentración
    const duration = spell.duration.toLowerCase();
    const name = spell.name.toLowerCase();
    
    // Heurística: si la duración es más de 1 turno y no es instantánea, probablemente requiere concentración
    const hasLongDuration = duration.includes("minute") || duration.includes("hour") || 
                           (duration.includes("turn") && !duration.includes("1 turn"));
    
    // Algunos hechizos específicos que sabemos que requieren concentración
    const concentrationSpells = [
      "bless", "bane", "charm person", "hunter's mark", "shield of faith",
      "spiritual weapon", "detect magic", "guidance", "resistance"
    ];
    
    const isKnownConcentration = concentrationSpells.some(spellName => 
      name.includes(spellName.replace(/['"]/g, ""))
    );
    
    return (hasLongDuration || isKnownConcentration) ? "true" : "false";
  };

  return (
    <>
      <article
        ref={elementRef}
        className={c(
          styles.spell,
          highlighted && !detailed && styles.highlighted,
          detailed && styles.detailed,
          detailed && isSelected && styles.selected,
          focused && styles.focused,
          isHovered && styles.hovered,
        )}
        data-spell-id={spell.id}
        data-damage-type={getDamageTypes()}
        data-level={spell.level?.toString() || "0"}
        data-concentration={requiresConcentration()}
        style={animatedSpellStyles}
        aria-label={spell.name}
        aria-detailed={detailed ? "true" : "false"}
        tabIndex={focused ? 0 : -1}
        onMouseEnter={onMouseEnter}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onKeyDown={onKeyDown}
        {...(detailed ? { onClick } : {})}
      >
        {detailed && showImage && (
          <div className={styles.image}>
            <img src={spell.icon} alt={spell.name} className={styles.icon} />
            {spell.upcast && (
              <img src={upcastIcon} alt="upcast" className={styles.upcast} />
            )}
          </div>
        )}
      </article>
      
      {/* Tooltip con error boundary */}
      {(() => {
        try {
          // Mostrar tooltip si está en hover O si está seleccionado
          const shouldShowTooltip = (isHovered || isSelected) && Boolean(highlighted || detailed);
          
          return (
            <SpellTooltip 
              spell={spell}
              visible={shouldShowTooltip}
              x={mousePosition.x}
              y={mousePosition.y}
            />
          );
        } catch (error) {
          console.warn("Error rendering tooltip for spell:", spell.name, error);
          return null;
        }
      })()}
    </>
  );
}
