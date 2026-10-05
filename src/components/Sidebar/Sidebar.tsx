import "./Sidebar.css";
import type { Note, Folder, SpecialView } from "../../types";
import { useState, type Dispatch, type SetStateAction } from "react";
import { useTheme } from "../../context/themeContext";

import FolderUpdation from "../Folder/folder_updation";
import FolderDeletion from "../Folder/folder_deletion";

type SidebarProps = {
  showSearch: boolean;
  setShowSearch: Dispatch<SetStateAction<boolean>>;
  searchInput: string;
  setSearchInput: Dispatch<SetStateAction<string>>;
  handleNewNote: () => Promise<void>;
  folders: Folder[];
  selectedFolderId: string | null;
  setSelectedFolderId: Dispatch<SetStateAction<string | null>>;
  setSpecialView: Dispatch<SetStateAction<SpecialView>>;
  showAddFolder: boolean;
  setShowAddFolder: Dispatch<SetStateAction<boolean>>;
  newFolderName: string;
  setNewFolderName: Dispatch<SetStateAction<string>>;
  handleAddFolder: () => Promise<void>;
  handleOpenTrash: (e: React.MouseEvent<HTMLAnchorElement>) => Promise<void>;
  handleOpenArchived: (e: React.MouseEvent<HTMLAnchorElement>) => Promise<void>;
  selectedNoteId: string | null;
  handleSelectNote: (note: Note) => Promise<void>;
  specialView: SpecialView;
  recentNotes: Note[];
  handleRenameFolder: (folderId: string, name: string) => Promise<void>;
  handleDeleteFolder: (folderId: string) => Promise<void>;
};

// Light theme icons are white SVGs, so invert them; dark theme uses them as-is.
const icon = "invert dark:invert-0";

const navItem =
  "flex w-full items-center gap-2 truncate rounded px-2.5 py-1.5 text-base leading-[25px] no-underline transition-colors";

const navIdleBlue =
  "text-black/65 hover:bg-[#312eb5] hover:text-white dark:text-white/60";

const navIdleGrey =
  "text-black/65 hover:bg-black/[0.08] hover:text-[#181818] dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white";

const navSelectedBlue = "bg-[#312eb5] font-bold text-white";

const navSelectedGrey =
  "bg-black/10 font-bold text-[#181818] dark:bg-white/10 dark:text-white";
const heading =
  "my-3 flex pl-2.5 text-sm font-bold text-black/60 dark:text-white/60";

const newNoteBox =
  "mx-auto my-[30px] flex h-10 w-[90%] items-center justify-center gap-2 rounded-[3px] border-none bg-black/5 px-5 text-inherit dark:bg-white/5";

function Sidebar({
  showSearch,
  setShowSearch,
  searchInput,
  setSearchInput,
  handleNewNote,
  folders,
  recentNotes,
  selectedFolderId,
  setSelectedFolderId,
  setSpecialView,
  handleRenameFolder,
  handleDeleteFolder,
  showAddFolder,
  setShowAddFolder,
  newFolderName,
  setNewFolderName,
  handleAddFolder,
  handleOpenTrash,
  handleOpenArchived,
  selectedNoteId,
  handleSelectNote,
  specialView,
}: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);

  const item = (selected: boolean, hover: "blue" | "grey" = "grey") => {
    if (selected) {
      return `${navItem} ${hover === "blue" ? navSelectedBlue : navSelectedGrey}`;
    }
    return `${navItem} ${hover === "blue" ? navIdleBlue : navIdleGrey}`;
  };

  return (
    <section className="h-screen bg-[whitesmoke] text-[#181818] dark:bg-[#1c1c1c] dark:text-white max-[730px]:h-auto max-[730px]:w-full">
      <span className="flex items-center justify-between px-2.5">
        <img
          className={`pt-5 pl-2.5 ${icon}`}
          src="/assets/logo.svg"
          alt="logo"
        />

        <label className="relative inline-block h-[34px] w-[60px] shrink-0">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={theme === "dark"}
            onChange={toggleTheme}
          />
          <span className="absolute inset-0 cursor-pointer rounded-full bg-[#bdbdbd] transition-colors duration-300 before:absolute before:bottom-1 before:left-1 before:size-[26px] before:rounded-full before:bg-white before:transition-transform before:duration-300 peer-checked:before:translate-x-[26px] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#312eb5]" />
        </label>

        <button
          className={`transition ${icon}`}
          onClick={() => setShowSearch(!showSearch)}
        >
          <img
            src={
              showSearch
                ? "/assets/highlighted_search.svg"
                : "/assets/unhighlighted_search.svg"
            }
            alt="Search"
          />
        </button>
      </span>

      {showSearch ? (
        <input
          className={newNoteBox}
          type="text"
          placeholder="Search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          autoFocus
        />
      ) : (
        <button className={newNoteBox} onClick={handleNewNote}>
          + New Note
        </button>
      )}

      <section className="p-5">
        <h2 className={heading}>Recents</h2>
        {recentNotes.map((note) => (
          <a
            className={item(selectedNoteId === note.id, "blue")}
            href="#"
            key={note.id}
            onClick={(e) => {
              e.preventDefault();
              handleSelectNote(note);
            }}
          >
            <img
              className={icon}
              src={
                selectedNoteId === note.id
                  ? "/assets/highlighted_file.svg"
                  : "/assets/file_icon.svg"
              }
              alt=""
            />
            {note.title}
          </a>
        ))}
      </section>

      <section className="p-5">
        <span className="flex items-center justify-between">
          <h2 className={heading}>Folders</h2>
          <button
            className="cursor-pointer border-none bg-transparent p-0 text-inherit"
            onClick={() => setShowAddFolder(!showAddFolder)}
          >
            <img
              className={icon}
              src="/assets/add_folder_icon.svg"
              alt="Add folder"
            />
          </button>
        </span>

        {showAddFolder && (
          <input
            className="box-border w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2.5 text-[15px] text-[#181818] outline-none placeholder:text-[#777] dark:border-[#3a3a3a] dark:bg-[#242424] dark:text-white dark:placeholder:text-[#888] dark:focus:border-[#666] dark:focus:bg-[#292929]"
            type="text"
            placeholder="Folder name, then press Enter"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddFolder();
            }}
            autoFocus
          />
        )}

        <div className="folder-items max-h-[30vh] overflow-y-auto">
          {folders.map((folder) =>
            editingFolderId === folder.id ? (
              <FolderUpdation
                key={folder.id}
                initialName={folder.name}
                onSave={(name) => handleRenameFolder(folder.id, name)}
                onCancel={() => setEditingFolderId(null)}
              />
            ) : (
              <div key={folder.id} className="group flex items-center">
                <div className="min-w-0 flex-1">
                  <a
                    className={item(selectedFolderId === folder.id)}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setSpecialView(null);
                      setSelectedFolderId(
                        selectedFolderId === folder.id ? null : folder.id,
                      );
                    }}
                  >
                    <img
                      className={icon}
                      src={
                        selectedFolderId === folder.id
                          ? "/assets/opened_folder.svg"
                          : "/assets/folder_icon.svg"
                      }
                      alt=""
                    />
                    {folder.name}
                  </a>
                </div>

                <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <button
                    type="button"
                    className="cursor-pointer border-none bg-transparent p-1"
                    onClick={() => setEditingFolderId(folder.id)}
                    aria-label={`Rename folder ${folder.name}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#ffffff"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                  </button>

                  <FolderDeletion
                    folderName={folder.name}
                    onDelete={() => handleDeleteFolder(folder.id)}
                  />
                </div>
              </div>
            ),
          )}
        </div>
      </section>

      <section className="p-5">
        <h2 className={heading}>More</h2>

        <a
          className={item(specialView === "favorites")}
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setSelectedFolderId(null);
            setSpecialView(specialView === "favorites" ? null : "favorites");
          }}
        >
          <img
            className={icon}
            src={
              specialView === "favorites"
                ? "/assets/highlighted_star.svg"
                : "/assets/star.svg"
            }
            alt=""
          />
          Favorites
        </a>

        <a
          className={item(specialView === "trash")}
          href="#"
          onClick={handleOpenTrash}
        >
          <img
            className={icon}
            src={
              specialView === "trash"
                ? "/assets/highlighted_trash.svg"
                : "/assets/trash.svg"
            }
            alt=""
          />
          Trash
        </a>

        <a
          className={item(specialView === "archived")}
          href="#"
          onClick={handleOpenArchived}
        >
          <img
            className={icon}
            src={
              specialView === "archived"
                ? "/assets/highlighted_archive.svg"
                : "/assets/archived.svg"
            }
            alt=""
          />
          Archived
        </a>
      </section>
    </section>
  );
}

export default Sidebar;
