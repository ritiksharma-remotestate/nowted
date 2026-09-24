import "./NotesList.css";
import type { Note, Folder } from "../../types";

type NotesListProps = {
  selectedFolder: Folder | null;
  visibleNotes: Note[];
  selectedNoteId: string | null;
  handleSelectNote: (note: Note) => Promise<void>;
  specialView: string | null;
};

function NotesList({
  selectedFolder,
  visibleNotes,
  selectedNoteId,
  handleSelectNote,
  specialView,
}: NotesListProps) {
  return (
    <section className="mid">
      <h1 id="personal">
        <h1 id="personal">
          {specialView === "favorites"
            ? "Favorites"
            : specialView === "trash"
              ? "Trash"
              : specialView === "archived"
                ? "Archived Notes"
                : selectedFolder
                  ? selectedFolder.name
                  : "All notes"}
        </h1>{" "}
      </h1>

      <div id="docList">
        {visibleNotes.map((note) => (
          <div
            className={`mid_div${
              selectedNoteId === note.id ? " selected" : ""
            }`}
            key={note.id}
            onClick={() => handleSelectNote(note)}
          >
            <h3>{note.title}</h3>

            <span className="date">
              {new Date(note.createdAt).toLocaleDateString("en-GB")}
            </span>

            <span className="description">{note.preview}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default NotesList;
