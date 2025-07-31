import c from "classnames";
import { useState, useEffect, useCallback, useMemo } from "react";
import spellsByClass from "src/data/spells-by-class.json";
import spells from "src/data/spells.json";
import { Spell } from "./spell";

import type { ClassId, SellsByClass } from "src/models/character-class";
import type { SpellId } from "src/models/spell";
import type { Spell as SpellType } from "src/models/spell";
import styles from "./spell-diagram.module.css";

/**
 * Propiedades del componente SpellDiagram
 */
type Props = {
  /** ID de la clase de personaje seleccionada actualmente */
  selectedClass: ClassId | undefined;
  /** ID de la clase de personaje que está siendo resaltada (hover) */
  highlightedClass: ClassId | undefined;
  /** Indica si el diagrama debe mostrar el fondo */
  background?: boolean;
  /** Función callback que se ejecuta cuando se selecciona un hechizo */
  onSpellSelect?: (spell: SpellType) => void;
  /** Función callback que se ejecuta cuando se presiona la tecla Escape */
  onEscape?: () => void;
};

/**
 * Componente principal que renderiza el diagrama de hechizos.
 * Muestra todos los hechizos organizados por niveles (0-6) en dos filas por nivel.
 * Permite navegación por teclado y selección de hechizos.
 * 
 * @param props - Las propiedades del componente
 * @returns JSX.Element - El diagrama de hechizos renderizado
 */
export function SpellDiagram({
  highlightedClass,
  selectedClass,
  background,
  onSpellSelect,
  onEscape,
}: Props) {
  // Agrupa todos los hechizos por nivel (0-9) para organizar la visualización
  const spellsByLevel = groupSpellsByLevel(spells as SpellType[]);
  
  /** Índice del hechizo que tiene el foco del teclado (-1 significa ninguno) */
  const [focusedSpellIndex, setFocusedSpellIndex] = useState<number>(-1);
  
  /** Hechizo actualmente seleccionado (puede ser null si no hay ninguno seleccionado) */
  const [selectedSpell, setSelectedSpell] = useState<SpellType | null>(null);
  
  // Determina el estado visual del diagrama basado en las clases seleccionadas/resaltadas
  const status = selectedClass
    ? "selected"    // Una clase está seleccionada
    : highlightedClass
    ? "highlighted" // Una clase está siendo resaltada (hover)
    : "none";       // Ninguna clase está activa

  // La clase actualmente activa (seleccionada tiene prioridad sobre resaltada)
  const currentClass = selectedClass || highlightedClass;
  
  /**
   * Conjunto de IDs de hechizos que pertenecen a la clase actualmente activa.
   * Se recalcula cuando cambia la clase actual para optimizar el rendimiento.
   */
  const highlightedSpells = useMemo(() => {
    return currentClass
      ? new Set((spellsByClass as SellsByClass)[currentClass])
      : new Set<SpellId>();
  }, [currentClass]);

  /**
   * Lista de hechizos visibles y navegables cuando hay una clase seleccionada.
   * Solo incluye hechizos que pertenecen a la clase seleccionada.
   * Se usa para la navegación por teclado secuencial.
   */
  const visibleSpells = useMemo(() => {
    return selectedClass 
      ? (spells as SpellType[]).filter(spell => highlightedSpells.has(spell.id as SpellId))
      : [];
  }, [selectedClass, highlightedSpells]);

  /**
   * Maneja la selección y deselección de hechizos.
   * Si el hechizo ya está seleccionado, lo deselecciona.
   * Si es un hechizo diferente, lo selecciona y deselecciona el anterior.
   * 
   * @param spell - El hechizo que se quiere seleccionar/deseleccionar
   */
  const handleSpellSelection = useCallback((spell: SpellType) => {
    // Si es el mismo hechizo, lo deseleccionamos
    if (selectedSpell?.id === spell.id) {
      setSelectedSpell(null);
    } else {
      setSelectedSpell(spell);
    }
    // Notifica al componente padre sobre la selección
    onSpellSelect?.(spell);
  }, [selectedSpell, onSpellSelect]);

  /**
   * Maneja la navegación por teclado dentro del diagrama de hechizos.
   * Permite navegar con Tab, flechas direccionales, Enter para seleccionar y Escape para salir.
   * Solo funciona cuando hay una clase seleccionada y hechizos visibles.
   * 
   * @param event - El evento de teclado capturado
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Solo permitir navegación de hechizos cuando hay una clase seleccionada
    if (!selectedClass || visibleSpells.length === 0) return;

    switch (event.key) {
      case "Tab":
        event.preventDefault();
        setFocusedSpellIndex(prev => {
          // Si no hay foco previo, empezar desde el primer elemento (o último si Shift+Tab)
          if (prev === -1) {
            return event.shiftKey ? visibleSpells.length - 1 : 0;
          }
          // Navegación circular: Tab avanza, Shift+Tab retrocede
          const next = event.shiftKey 
            ? (prev <= 0 ? visibleSpells.length - 1 : prev - 1)
            : (prev >= visibleSpells.length - 1 ? 0 : prev + 1);
          return next;
        });
        break;
        
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        setFocusedSpellIndex(prev => {
          // Si no hay foco previo, empezar desde el primer elemento
          if (prev === -1) {
            return 0;
          }
          // Avanzar al siguiente hechizo (circular)
          const next = prev >= visibleSpells.length - 1 ? 0 : prev + 1;
          return next;
        });
        break;
        
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        setFocusedSpellIndex(prev => {
          // Si no hay foco previo, empezar desde el último elemento
          if (prev === -1) {
            return visibleSpells.length - 1;
          }
          // Retroceder al hechizo anterior (circular)
          const next = prev <= 0 ? visibleSpells.length - 1 : prev - 1;
          return next;
        });
        break;
        
      case "Enter":
        event.preventDefault();
        // Seleccionar el hechizo que tiene el foco actual
        if (focusedSpellIndex >= 0 && focusedSpellIndex < visibleSpells.length) {
          const spell = visibleSpells[focusedSpellIndex];
          handleSpellSelection(spell);
        }
        break;
        
      case "Escape":
        event.preventDefault();
        // Limpiar el foco y la selección, y notificar al componente padre
        setFocusedSpellIndex(-1);
        setSelectedSpell(null);
        onEscape?.();
        break;
    }
  }, [selectedClass, visibleSpells, focusedSpellIndex, handleSpellSelection, onEscape]);

  // Registra el listener de eventos de teclado a nivel de documento
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Reinicia el foco y la selección cuando cambia la clase seleccionada
  useEffect(() => {
    setFocusedSpellIndex(-1);
    setSelectedSpell(null);
  }, [selectedClass]);

  /**
   * Determina si un hechizo debe estar resaltado (visible con borde dorado).
   * Esto ocurre cuando hay una clase resaltada y el hechizo pertenece a esa clase.
   * 
   * @param spell - El hechizo a evaluar
   * @returns true si el hechizo debe estar resaltado
   */
  const isSpellHighlighted = (spell: SpellType) =>
    highlightedClass && highlightedSpells.has(spell.id as SpellId);

  /**
   * Determina si un hechizo debe mostrar detalles (imagen e interacciones).
   * Esto ocurre cuando hay una clase seleccionada y el hechizo pertenece a esa clase.
   * 
   * @param spell - El hechizo a evaluar
   * @returns true si el hechizo debe mostrar detalles
   */
  const isSpellDetailed = (spell: SpellType) =>
    selectedClass && highlightedSpells.has(spell.id as SpellId);

  /**
   * Determina si un hechizo tiene el foco del teclado (borde azul de navegación).
   * 
   * @param spell - El hechizo a evaluar
   * @returns true si el hechizo tiene el foco del teclado
   */
  const isSpellFocused = (spell: SpellType) => {
    if (!selectedClass || focusedSpellIndex < 0) return false;
    return visibleSpells[focusedSpellIndex]?.id === spell.id;
  };

  /**
   * Determina si un hechizo está seleccionado (muestra tooltip y animación de selección).
   * 
   * @param spell - El hechizo a evaluar
   * @returns true si el hechizo está seleccionado
   */
  const isSpellSelected = (spell: SpellType) => {
    return selectedSpell?.id === spell.id;
  };

  // Renderiza el diagrama completo con 7 niveles de hechizos (0-6)
  return (
    <div
      className={c(
        styles.spellDiagram,
        background && styles.background,
        status === "selected" && styles.selected,
        status === "highlighted" && styles.highlighted
      )}
    >
      {/* Genera 7 grupos de niveles (0-6) */}
      {Array.from({ length: 7 }, (_, level) => {
        const { firstHalf, secondHalf } = twoRows(spellsByLevel[level]);

        return (
          <div key={level} className={styles.levelGroup} data-level={level}>
            {/* Primera fila del nivel */}
            <div className={styles.row}>
              {firstHalf.map((spell, idx) => (
                <Spell
                  key={`${level}-1-${idx}`}
                  spell={spell}
                  highlighted={isSpellHighlighted(spell)}
                  detailed={isSpellDetailed(spell)}
                  focused={isSpellFocused(spell)}
                  selected={isSpellSelected(spell)}
                  onSelect={handleSpellSelection}
                />
              ))}
            </div>
            {/* Segunda fila del nivel */}
            <div className={styles.row}>
              {secondHalf.map((spell, idx) => (
                <Spell
                  key={`${level}-2-${idx}`}
                  spell={spell}
                  highlighted={isSpellHighlighted(spell)}
                  detailed={isSpellDetailed(spell)}
                  focused={isSpellFocused(spell)}
                  selected={isSpellSelected(spell)}
                  onSelect={handleSpellSelection}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Divide una lista de hechizos en dos mitades para crear dos filas.
 * La primera mitad va en la fila superior y la segunda en la inferior.
 * Si hay un número impar de hechizos, la primera fila tendrá un hechizo más.
 * 
 * @param spells - Array de hechizos a dividir (por defecto array vacío)
 * @returns Objeto con firstHalf y secondHalf conteniendo los hechizos divididos
 */
function twoRows(spells: SpellType[] = []) {
  const half = Math.ceil(spells.length / 2);
  return {
    firstHalf: spells.slice(0, half),
    secondHalf: spells.slice(half),
  };
}

/**
 * Agrupa una lista de hechizos por su nivel (0-9).
 * Crea un objeto donde cada clave es un nivel y el valor es un array de hechizos de ese nivel.
 * 
 * @param spells - Array de hechizos a agrupar
 * @returns Objeto con niveles como claves y arrays de hechizos como valores
 */
function groupSpellsByLevel(spells: SpellType[]) {
  return spells.reduce<Record<number, SpellType[]>>((acc, spell) => {
    if (!acc[spell.level]) {
      acc[spell.level] = [];
    }
    acc[spell.level].push(spell);
    return acc;
  }, {});
}
