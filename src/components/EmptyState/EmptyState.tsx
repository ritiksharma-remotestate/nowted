import "./EmptyState.css";

function EmptyState() {
  return (
    <div className="select-note">
      <img
        className="select-note-image"
        src="/assets/select_note_icon.svg"
        alt="note"
      />

      <h2 className="select-note-heading">Select a note to view</h2>

      <p className="select-note-para">
        Choose a note from the list on the left to view its contents, or create
        a new note to add to your collection
      </p>
    </div>
  );
}

export default EmptyState;
