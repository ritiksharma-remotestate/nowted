import "./Sidebar.css";
import type { Note, Folder, SpecialView } from "../../types";
import type { Dispatch, SetStateAction } from "react";

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
  notesList: Note[];
  selectedNoteId: string | null;
  handleSelectNote: (note: Note) => Promise<void>;
  specialView: SpecialView;
};

function Sidebar({
  showSearch,
  setShowSearch,
  searchInput,
  setSearchInput,
  handleNewNote,
  folders,
  selectedFolderId,
  setSelectedFolderId,
  setSpecialView,
  showAddFolder,
  setShowAddFolder,
  newFolderName,
  setNewFolderName,
  handleAddFolder,
  handleOpenTrash,
  notesList,
  selectedNoteId,
  handleSelectNote,
  specialView,
}: SidebarProps) {
  return (
    <section className="first">
      <span id="logo-search">
        <img id="logo" src="/assets/logo.svg" alt="logo" />
        <button id="search_icon_btn" onClick={() => setShowSearch(!showSearch)}>
          {showSearch ? (
            <img
              id="search_icon"
              src="/assets/highlighted_search.svg"
              alt="Search"
            />
          ) : (
            <img
              id="search_icon"
              src="/assets/unhighlighted_search.svg"
              alt="Search"
            />
          )}
        </button>
      </span>
      {showSearch ? (
        <input
          className="new_note"
          type="text"
          placeholder="Search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          autoFocus
        />
      ) : (
        <button className="new_note" onClick={handleNewNote}>
          + New Note
        </button>
      )}

      <section className="nav_div">
        <h2 className="h1">Recents</h2>
        {notesList.slice(0, 3).map((note) => (
          <a
            className={`nav_content${selectedNoteId === note.id ? " selected" : ""}`}
            href="#"
            key={note.id}
            onClick={(e) => {
              e.preventDefault();
              handleSelectNote(note);
            }}
          >
            <img src="/assets/file_icon.svg" alt="" />
            {note.title}
          </a>
        ))}
      </section>

      <section className="nav_div" id="folderList">
        <span id="folder-addfile">
          <h2 className="h1">Folders</h2>
          <button
            id="add-files"
            onClick={() => setShowAddFolder(!showAddFolder)}
          >
            <img src="/assets/add_folder_icon.svg" alt="Add folder" />
          </button>
        </span>

        {showAddFolder && (
          <input
            id="new_folder_input"
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

        <div className="folder-items">
          {folders.map((folder) => (
            <a
              className={`nav_content${
                selectedFolderId === folder.id ? " selected" : ""
              }`}
              href="#"
              key={folder.id}
              onClick={(e) => {
                e.preventDefault();

                setSpecialView(null);

                setSelectedFolderId(
                  selectedFolderId === folder.id ? null : folder.id,
                );
              }}
            >
              <img
                src={
                  selectedFolderId === folder.id
                  ? "/assets/opened_folder.svg"
                    :"/assets/folder_icon.svg"
                }
                alt=""
              />

              {folder.name}
            </a>
          ))}
        </div>
      </section>

      <section className="nav_div" id="more-info">
        <h2 className="h1">More</h2>
        <a
          className={`nav_content${
            specialView === "favorites" ? " selected" : ""
          }`}
          href="#"
          onClick={(e) => {
            e.preventDefault();

            setSelectedFolderId(null);
            setSpecialView("favorites");
          }}
        >
          <img src="/assets/star.svg" alt="" />
          Favorites
        </a>
        <a
          className={`nav_content${specialView === "trash" ? " selected" : ""}`}
          href="#"
          onClick={handleOpenTrash}
        >
          <img src="/assets/trash.svg" alt="" />
          Trash
        </a>
        <a
          className={`nav_content${
            specialView === "archived" ? " selected" : ""
          }`}
          href="#"
          onClick={(e) => {
            e.preventDefault();

            setSelectedFolderId(null);
            setSpecialView("archived");
          }}
        >
          <img src="/assets/archived.svg" alt="" />
          Archived Notes
        </a>
      </section>
    </section>
  );
}

export default Sidebar;
