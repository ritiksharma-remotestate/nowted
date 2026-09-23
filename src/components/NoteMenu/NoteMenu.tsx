import "./NoteMenu.css";
import type { Note } from "../../types";

type NoteMenuProps = {
  showMenu: boolean;
  selectedNote:Note;
  handleToggleFavorite: () => Promise<void>;
  handleDeleteNote: () => Promise<void>;
  handleToggleArchive: () => Promise<void>;
}

function NoteMenu({
  showMenu,
  selectedNote,
  handleToggleFavorite,
  handleToggleArchive,
  handleDeleteNote,
}:NoteMenuProps) {
  if (!showMenu) {
    return null;
  }

  return (
    <section id="dots-menu">
      <div className="menu">
        <button onClick={handleToggleFavorite}>
          <img
            src="/assets/star.svg"
            alt="fvt logo"
          />

          {selectedNote.isFavorite
            ? "Remove from favourites"
            : "Add to favourites"}
        </button>

        <button onClick={handleToggleArchive}>
          <img
            src="/assets/archived.svg"
            alt="archived logo"
          />

          {selectedNote.isArchived
            ? "Remove from archive"
            : "Add to archive"}
        </button>

        <hr id="id2" />

        <button onClick={handleDeleteNote}>
          <img
            src="/assets/trash.svg"
            alt="trash logo"
          />

          Delete
        </button>
      </div>
    </section>
  );
}

export default NoteMenu;