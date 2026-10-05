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

// Light theme icons are white SVGs, so invert them; dark theme uses them as-is.
const icon = "invert dark:invert-0";

const label = "flex items-center gap-2 py-2.5";

const value =
  "font-['Source_Sans_Pro',sans-serif] text-sm leading-none font-semibold underline";

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
      <span className="relative flex items-center justify-between px-2.5">
        <input
          className="w-full border-none bg-transparent text-[32px] text-inherit outline-none"
          value={selectedNote.title}
          onChange={(e) => handleFieldChange("title", e.target.value)}
          onBlur={handleSaveNote}
        />

        <button
          className={`cursor-pointer border-none bg-transparent p-0 transition ${icon}`}
          onClick={() => setShowMenu(!showMenu)}
        >
          <img src="/assets/dots.svg" alt="Note menu" />
        </button>
      </span>

      <NoteMenu
        showMenu={showMenu}
        selectedNote={selectedNote}
        handleToggleFavorite={handleToggleFavorite}
        handleToggleArchive={handleToggleArchive}
        handleDeleteNote={handleDeleteNote}
      />

      <section className="text-left text-inherit">
        <div className="grid grid-cols-[100px_20%] items-center">
          <span className={label}>
            <img className={icon} src="/assets/date_icon.svg" alt="" />
            Date
          </span>

          <span className={value}>
            {selectedNote.createdAt
              ? new Date(selectedNote.createdAt).toLocaleDateString("en-GB")
              : ""}
          </span>
        </div>

        <hr className="my-2 h-px border-none bg-black/10 dark:bg-white/10" />

        <div className="grid grid-cols-[100px_20%] items-center">
          <span className={label}>
            <img className={icon} src="/assets/folder_icon.svg" alt="" />
            Folder
          </span>

          <select
            className={`${value} appearance-none rounded-sm border-none bg-[#f5f5f5] py-2.5 pr-2.5 pl-0 text-[#181818] scheme-light hover:bg-black/5 dark:bg-[#181818] dark:text-white dark:scheme-dark dark:hover:bg-white/10`}
            value={selectedNote.folderId ?? ""}
            onChange={(e) => handleChangeFolder(e.target.value)}
          >
            {folders.map((folder) => (
              <option
                className="bg-white text-[#181818] dark:bg-[#303030] dark:text-white"
                key={folder.id}
                value={folder.id}
              >
                {folder.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <textarea
        className="para min-h-[80vh] w-full resize-y overflow-y-auto border-none bg-transparent text-inherit outline-none"
        value={selectedNote.content ?? ""}
        onChange={(e) => handleFieldChange("content", e.target.value)}
        onBlur={handleSaveNote}
      />
    </div>
  );
}

export default NoteEditor;