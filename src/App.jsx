import { useState, useEffect } from "react";
import "./App.css";

// Adjust this if your Swagger docs show a different base path
// (e.g. some APIs prefix every route with /api)
const API_BASE_URL = "https://nowted-server.remotestate.com";

function App() {
  const [showSearch, setShowSearch] = useState(false);
  // storing only the id — the full note is always looked up fresh
  // from notesList below, so there's exactly one copy of its data
  // anywhere, and editing it can never go out of sync
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [notesList, setNotesList] = useState([]);
  const [folders, setFolders] = useState([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [foldersLoading, setFoldersLoading] = useState(true);
  const isLoading = notesLoading || foldersLoading;
  const [loadError, setLoadError] = useState(null);
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const [trashNotes, setTrashNotes] = useState([]);

  // derived, not stored — recalculated every render from whatever
  // notesList currently contains
  const selectedNote =
    notesList.find((n) => n.id === selectedNoteId) ??
    trashNotes.find((n) => n.id === selectedNoteId);

  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [specialView, setSpecialView] = useState(null);
  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  // searchInput updates on every keystroke (so the box feels responsive).
  // debouncedSearch only catches up 400ms after typing stops — that's
  // the value actually used to filter, so fast typing doesn't trigger
  // a re-filter on every single character
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 400);

    // cleanup runs before the NEXT effect call (i.e. on every new
    // keystroke) — it cancels the previous timer so only the most
    // recent one ever actually fires. This is the whole debounce trick.
    return () => clearTimeout(timer);
  }, [searchInput]);

  // combines both filters — folder selection AND search — in one pass
  const sourceNotes = specialView === "trash" ? trashNotes : notesList;

  const visibleNotes = sourceNotes.filter((n) => {
    const matchesFolder = !selectedFolderId || n.folderId === selectedFolderId;

    const matchesSpecialView =
      specialView === null ||
      (specialView === "favorites" && n.isFavorite === true) ||
      specialView === "trash" ||
      (specialView === "archived" && n.isArchived === true);

    const matchesSearch =
      debouncedSearch.trim() === "" ||
      n.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (n.preview ?? "").toLowerCase().includes(debouncedSearch.toLowerCase());

    return matchesFolder && matchesSpecialView && matchesSearch;
  });

  useEffect(() => {
    fetch(`${API_BASE_URL}/notes`)
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const notes = Array.isArray(data)
          ? data
          : (data.notes ?? data.data ?? []);
        setNotesList(notes);
        setNotesLoading(false);
      })
      .catch((err) => {
        setLoadError(err.message);
        setNotesLoading(false);
      });
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/folders`)
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const foldersList = Array.isArray(data)
          ? data
          : (data.folders ?? data.data ?? []);
        setFolders(foldersList);
        setFoldersLoading(false);
      })
      .catch((err) => {
        setLoadError(err.message);
        setFoldersLoading(false);
      });
  }, []);

  const handleSelectNote = async (note) => {
    // same note clicked again → close it (toggle)
    if (selectedNoteId === note.id) {
      setSelectedNoteId(null);
      setShowMenu(false);
      setShowRestore(false);
      return;
    }

    setShowMenu(false);
    if (specialView === "trash") {
      setSelectedNoteId(note.id);
      setShowRestore(true);
      return;
    }
    setShowRestore(false);

    // already have full content cached from a previous open? just select it
    if (note.content !== undefined) {
      setSelectedNoteId(note.id);
      return;
    }

    // list endpoint only gave a preview — fetch the real content
    try {
      const res = await fetch(`${API_BASE_URL}/notes/${note.id}`);
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const responseData = await res.json();
      const fullNote = responseData.note ?? responseData;

      setNotesList((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, ...fullNote } : n)),
      );
      setSelectedNoteId(note.id);
    } catch (err) {
      console.error("Failed to load note detail:", err);
    }
  };

  const handleAddFolder = async () => {
    const trimmed = newFolderName.trim();
    if (trimmed === "") return;

    try {
      const res = await fetch(`${API_BASE_URL}/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);

      // unlike /notes, this endpoint only returns plain text
      // ("Folder created successfully") — no folder object, no id.
      // Re-fetching is how we get the new folder's real id back.
      const refreshed = await fetch(`${API_BASE_URL}/folders`);
      const refreshedData = await refreshed.json();
      const foldersList = Array.isArray(refreshedData)
        ? refreshedData
        : (refreshedData.folders ?? refreshedData.data ?? []);
      setFolders(foldersList);

      setNewFolderName("");
      setShowAddFolder(false);
    } catch (err) {
      console.error("Failed to create folder:", err);
      alert("Couldn't create the folder — check the console for details.");
    }
  };

  const handleNewNote = async () => {
    // notes need a real folderId — use the first folder as a default
    // for now; a folder picker would be the natural next feature
    const defaultFolderId = folders[0]?.id;
    if (!defaultFolderId) {
      alert("Create a folder first — notes need to belong to one.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderId: defaultFolderId,
          title: "Untitled Note",
          content: "Start writing here...",
        }),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const responseData = await res.json();
      const createdNote = responseData.note ?? responseData;

      setNotesList([createdNote, ...notesList]);
      setSelectedNoteId(createdNote.id);
    } catch (err) {
      console.error("Failed to create note:", err);
      alert("Couldn't create the note — check the console for details.");
    }
  };

  const handleOpenTrash = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_BASE_URL}/notes?deleted=true`);

      if (!res.ok) {
        throw new Error("Failed to fetch trash");
      }

      const responseData = await res.json();

      setTrashNotes(responseData.notes ?? []);
      setSelectedFolderId(null);
      setSpecialView("trash");
      setSelectedNoteId(null);
    } catch (error) {
      console.error("Trash error:", error);
    }
  };

  // updates the field locally right away (so typing feels instant),
  // the actual save to the server happens separately, on blur
  const handleFieldChange = (field, value) => {
    setNotesList((prev) =>
      prev.map((n) => (n.id === selectedNoteId ? { ...n, [field]: value } : n)),
    );
  };
  const handleDeleteNote = async () => {
    if (!selectedNote) return;

    try {
      const res = await fetch(`${API_BASE_URL}/notes/${selectedNote.id}`, {
        method: "DELETE",
        headers: {
          Accept: "text/plain",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to delete note");
      }

      // Remove it from the current list
      setNotesList((prev) =>
        prev.filter((note) => note.id !== selectedNote.id),
      );

      // No note selected anymore
      setSelectedNoteId(null);

      // Close the menu
      setShowMenu(false);
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  // fires when you click/tab away from the title or content box —
  // this is when the edit actually gets sent to the server
  const handleSaveNote = async () => {
    if (!selectedNote) return;
    try {
      const res = await fetch(`${API_BASE_URL}/notes/${selectedNote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedNote.title,
          content: selectedNote.content,
        }),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    } catch (err) {
      console.error("Failed to save note:", err);
    }
  };

  const handleRestoreNote = async (noteId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/notes/${noteId}/restore`, {
        method: "POST",
        headers: {
          Accept: "text/plain",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to restore note");
      }

      // Remove it from Trash immediately
      setTrashNotes((prev) => prev.filter((note) => note.id !== noteId));

      // Optional: reload active notes
      // so the restored note appears in Personal
      setSelectedNoteId(null);
      setShowRestore(false);
    } catch (error) {
      console.error("Restore error:", error);
    }
  };

  if (isLoading) {
    return <p style={{ color: "white", padding: 20 }}>Loading notes...</p>;
  }

  if (loadError) {
    return (
      <p style={{ color: "white", padding: 20 }}>
        Couldn't load notes: {loadError}
      </p>
    );
  }

  const handleToggleFavorite = async () => {
    if (!selectedNote) return;

    const newFavoriteStatus = !selectedNote.isFavorite;

    setNotesList((prev) =>
      prev.map((n) =>
        n.id === selectedNote.id ? { ...n, isFavorite: newFavoriteStatus } : n,
      ),
    );

    setShowMenu(false);
  };
  // changes which folder a note belongs to — updates the UI right
  // away, then persists it with the same PATCH pattern as title/content
  const handleChangeFolder = async (newFolderId) => {
    if (!selectedNote) return;
    const newFolder = folders.find((f) => f.id === newFolderId);

    setNotesList((prev) =>
      prev.map((n) =>
        n.id === selectedNote.id
          ? { ...n, folderId: newFolderId, folder: newFolder }
          : n,
      ),
    );

    try {
      const res = await fetch(`${API_BASE_URL}/notes/${selectedNote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: newFolderId }),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    } catch (err) {
      console.error("Failed to change folder:", err);
    }
  };

  const handleToggleArchive = async () => {
    if (!selectedNote) return;

    const newArchiveStatus = !selectedNote.isArchived;

    setNotesList((prev) =>
      prev.map((n) =>
        n.id === selectedNote.id ? { ...n, isArchived: newArchiveStatus } : n,
      ),
    );

    setShowMenu(false);
  };

  return (
    <>
      <main className="main">
        <section className="first">
          <span id="logo-search">
            <img id="logo" src="/assets/logo.svg" alt="logo" />
            <button
              id="search_icon_btn"
              onClick={() => setShowSearch(!showSearch)}
            >
              <img
                id="search_icon"
                src="assets/unhighlighted_search.svg"
                alt="Search"
              />
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
            <h2 id="h1">Recents</h2>
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
              <h2 id="h1">Folders</h2>
              <button
                // id="add-files"

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
                  // here==================================
                  className={`nav_content${selectedFolderId === folder.id ? " selected" : ""}`}
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
                  <img src="assets/folder_icon.svg" alt="" />
                  {folder.name}
                </a>
              ))}
            </div>
          </section>

          <section className="nav_div" id="more-info">
            <h2 id="h1">More</h2>
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
              <img src="assets/star.svg" alt="" />
              Favorites
            </a>
            <a
              className={`nav_content${
                specialView === "trash" ? " selected" : ""
              }`}
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

        <section className="mid">
          <h1 id="personal">
            {selectedFolder ? selectedFolder.name : "All notes"}
          </h1>
          <div id="docList">
            {visibleNotes.map((note) => (
              <div
                className={`mid_div${selectedNoteId === note.id ? " selected" : ""}`}
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

        <section className="last">
          {!selectedNote ? (
            <div id="select-note">
              <img id="note-image" alt="note" />
              <h2 id="heading_last">Select a note to view</h2>
              <h5 id="para">
                Choose a note form the list on the left to view its contents,or
                create a new note to add to your collection
              </h5>
            </div>
          ) : showRestore ? (
            <div id="restore">
              <img id="restore-icon" alt="restore-image" />
              <h2 id="heading_last">Restore "{selectedNote.title}"</h2>
              <h5>
                Don't want to lose this note? it's not too late! Just click the
                'Restore' button and it will be added back to your list. It's
                that simple.
              </h5>
              <button
                id="restore-btn"
                onClick={() => handleRestoreNote(selectedNote.id)}
              >
                Restore
              </button>
            </div>
          ) : (
            <div>
              <span id="heading-dots">
                <input
                  id="heading_last"
                  value={selectedNote.title}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  onBlur={handleSaveNote}
                />
                <button id="dots_btn" onClick={() => setShowMenu(!showMenu)}>
                  <img id="dots" src="assets/dots.svg" alt="dots" />
                </button>
              </span>
              <section id="dots-menu">
                {showMenu && (
                  <div className="menu">
                    <button onClick={handleToggleFavorite}>
                      <img src="assets/star.svg" alt="fvt logo"/>
                      {selectedNote.isFavorite
                        ? "Remove from favourites"
                        : "Add to favourites"}
                    </button>
                    <button onClick={handleToggleArchive}>
                                            <img src="assets/archived.svg" alt="archived logo"/>

                      {selectedNote.isArchived
                        ? "Remove from archive "
                        : "Add to archive"}
                    </button>
                    <hr id="id2"/>

                    <button onClick={handleDeleteNote}>
                                            <img src="assets/trash.svg" alt="fvt logo"/>
Delete</button>
                  </div>
                )}
              </section>
              <section className="table">
                <div className="table-row">
                  <span className="col">Date</span>
                  <span className="row">
                    {selectedNote.createdAt
                      ? new Date(selectedNote.createdAt).toLocaleDateString(
                          "en-GB",
                        )
                      : ""}
                  </span>
                </div>

                <hr id="id" />
                <div className="table-row">
                  <span className="col">Folder</span>

                  <select
                    className="row folder-list"
                    value={selectedNote.folderId ?? ""}
                    onChange={(e) => handleChangeFolder(e.target.value)}
                  >
                    {folders.map((folder) => (
                      <option
                        className="options"
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
                id="para"
                value={selectedNote.content ?? ""}
                onChange={(e) => handleFieldChange("content", e.target.value)}
                onBlur={handleSaveNote}
              />
            </div>
          )}
        </section>
      </main>
    </>
  );
}

export default App;
