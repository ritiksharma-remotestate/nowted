import "./NoteEditor.css";
import type { Dispatch, SetStateAction } from "react";

import NoteMenu from "../NoteMenu/NoteMenu";
import type { Note, Folder } from "../../types";

type NoteEditorProps = {
  selectedNote: Note;
  folders: Folder[];

  handleFieldChange: (field: "title" | "content", value: string) => void;

  handleSaveNote: () => Promise<void>;

  showMenu: boolean;
  setShowMenu: Dispatch<SetStateAction<boolean>>;

  handleToggleFavorite: () => Promise<void>;
  handleToggleArchive: () => Promise<void>;
  handleDeleteNote: () => Promise<void>;

  handleChangeFolder: (newFolderId: string) => Promise<void>;
};

function NoteEditor({
  selectedNote,
  folders,
  handleFieldChange,
  handleSaveNote,
  showMenu,
  setShowMenu,
  handleToggleFavorite,
  handleToggleArchive,
  handleDeleteNote,
  handleChangeFolder,
}: NoteEditorProps) {
  return (
    <div>
      <span id="heading-dots">
        <input
          id="heading_last"
          value={selectedNote.title}
          onChange={(e) => handleFieldChange("title", e.target.value)}
          onBlur={handleSaveNote}
        />

        <button id="dots_btn" onClick={() => setShowMenu(!showMenu)}>
          <img id="dots" src="/assets/dots.svg" alt="dots" />
        </button>
      </span>

      <NoteMenu
        showMenu={showMenu}
        selectedNote={selectedNote}
        handleToggleFavorite={handleToggleFavorite}
        handleToggleArchive={handleToggleArchive}
        handleDeleteNote={handleDeleteNote}
      />
      <section className="table">
        <div className="table-row">
          <span className="col">
          <img src="/assets/date_icon.svg" alt="date"/>
          Date</span>

          <span className="row">
            {selectedNote.createdAt
              ? new Date(selectedNote.createdAt).toLocaleDateString("en-GB")
              : ""}
          </span>
        </div>

        <hr id="id" />

        <div className="table-row">
          <span className="col">
            <img src="/assets/folder_icon.svg" alt="folder"/>Folder</span>

          <select
            className="row folder-list"
            value={selectedNote.folderId ?? ""}
            onChange={(e) => handleChangeFolder(e.target.value)}
          >
            {folders.map((folder) => (
              <option className="options" key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <textarea
        id="para"
        value={selectedNote.content ?? ""}
        onChange={(e) => handleFieldChange("content", e.target.value)}
        onBlur={handleSaveNote}
      />
    </div>
  );
}

export default NoteEditor;
