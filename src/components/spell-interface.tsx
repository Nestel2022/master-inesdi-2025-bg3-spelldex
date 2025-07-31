import { useState } from "react";
import { ClassGrid } from "src/components/class-grid";
import { SpellDiagram } from "src/components/spell-diagram";
import { useNavigate } from "react-router-dom";

import type { ClassId } from "src/models/character-class";
import type { Spell } from "src/models/spell";

import styles from "../app.module.css";

interface SpellInterfaceProps {
  initialSelectedClass?: ClassId;
}

export function SpellInterface({ initialSelectedClass }: SpellInterfaceProps) {
  const [selectedClass, setSelectedClass] = useState<ClassId | undefined>(initialSelectedClass);
  const [highlightedClass, setHighlightedClass] = useState<ClassId>();
  const background = selectedClass ? "classGrid" : "spellDiagram";
  const navigate = useNavigate();

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (
      (event.key === "Escape" || event.key === "Backspace") &&
      selectedClass
    ) {
      event.preventDefault();
      setSelectedClass(undefined);
      setHighlightedClass(undefined);
      return;
    }
  };

  const handleClassClick = () => {
    setSelectedClass(highlightedClass);
    if (highlightedClass) {
      navigate(`/${highlightedClass}`);
    }
  };

  const handleSpellSelect = (spell: Spell) => {    
    console.log("Spell selected:", spell.name);    
  };  

  const handleEscape = () => {
    setSelectedClass(undefined);
    setHighlightedClass(undefined);
  };

  return (
    <main className={styles.main} onKeyDown={onKeyDown}>
      <SpellDiagram
        highlightedClass={highlightedClass}
        selectedClass={selectedClass}
        background={background === "spellDiagram"}
        onSpellSelect={handleSpellSelect}
        onEscape={handleEscape}
      />

      <ClassGrid
        selectedClass={selectedClass}
        background={background === "classGrid"}
        highlight={setHighlightedClass}
        onClick={handleClassClick}
      />
    </main>
  );
}
