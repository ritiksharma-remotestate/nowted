import "./RestoreNote.css";
import type { Note } from "../../types";

type RestoreNoteProps = {
  selectedNote: Note;
  handleRestoreNote: (noteId: string) => Promise<void>
}
function RestoreNote({ selectedNote, handleRestoreNote }:RestoreNoteProps) {
  return (
    <div className="restore">
      <img
        className="restore-image"
        src="/assets/restore.svg"
        alt="Restore note"
      />

      <h2 className="restore-heading">
        Restore "{selectedNote.title}"
      </h2>

      <p className="restore-para">
        Don't want to lose this note? It's not too late! Just click the
        'Restore' button and it will be added back to your list. It's
        that simple.
      </p>

      <button
        className="restore-btn"
        onClick={() => handleRestoreNote(selectedNote.id)}
      >
        Restore
      </button>
    </div>
  );
}

export default RestoreNote;