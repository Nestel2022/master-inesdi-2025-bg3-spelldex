import { Link, useParams, useNavigate } from "react-router-dom";
import { SpellInterface } from "src/components/spell-interface";
import type { ClassId } from "src/models/character-class";
import styles from "./spell-class.module.css";
import { useEffect } from "react";

export function SpellClass() {
  const { className } = useParams<{ className: ClassId }>();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        navigate("/");
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [navigate]);

  return (
    <div>
      {/* Navigation bar */}
      <nav className={styles.navigation}>
        <Link to="/" className={styles.navigationLink}>
          ← Back to Home
        </Link>
      </nav>

      <SpellInterface initialSelectedClass={className} />
    </div>
  );
}



