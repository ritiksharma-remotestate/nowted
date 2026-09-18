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

  // derived, not stored — recalculated every render from whatever
  // notesList currently contains
  const selectedNote = notesList.find((n) => n.id === selectedNoteId);

  useEffect(() => {
    fetch(`${API_BASE_URL}/notes`)
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const notes = Array.isArray(data) ? data : data.notes ?? data.data ?? [];
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
        const foldersList = Array.isArray(data) ? data : data.folders ?? data.data ?? [];
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
        prev.map((n) => (n.id === note.id ? { ...n, ...fullNote } : n))
      );
      setSelectedNoteId(note.id);
    } catch (err) {
      console.error("Failed to load note detail:", err);
    }
  };

  const handleAddFolder = () => {
    const trimmed = newFolderName.trim();
    if (trimmed === "") return;
    // TODO: this only updates local state — becomes a real POST /folders next
    setFolders([...folders, { id: Date.now(), name: trimmed }]);
    setNewFolderName("");
    setShowAddFolder(false);
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

  // updates the field locally right away (so typing feels instant),
  // the actual save to the server happens separately, on blur
  const handleFieldChange = (field, value) => {
    setNotesList((prev) =>
      prev.map((n) => (n.id === selectedNoteId ? { ...n, [field]: value } : n))
    );
  };

  // fires when you click/tab away from the title or content box —
  // this is when the edit actually gets sent to the server. Saving on
  // every keystroke would fire a network request per character, and
  // requests can arrive out of order and overwrite a later edit
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
                src="/assets/search-icon.png"
                alt="Search"
              />
            </button>
          </span>
          {showSearch ? (
            <input className="new_note" type="text" placeholder="Search" />
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
                <img src="/assets/document.svg" alt="" />
                {note.title}
              </a>
            ))}
          </section>

          <section className="nav_div" id="folderList">
            <span id="folder-addfile">
              <h2 id="h1">Folders</h2>
              <button
                id="add-files"
                onClick={() => setShowAddFolder(!showAddFolder)}
              >
                +
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
                <a className="nav_content" href="#" key={folder.id}>
                  <img src="/assets/document.svg" alt="" />
                  {folder.name}
                </a>
              ))}
            </div>
          </section>

          <section className="nav_div" id="more-info">
            <h2 id="h1">More</h2>
            <a className="nav_content" href="#">
              <img src="assets/document.svg" alt="" />
              Favorites
            </a>
            <a className="nav_content" href="#">
              <img src="assets/document.svg" alt="" />
              Trash
            </a>
            <a className="nav_content" href="#">
              <img src="assets/document.svg" alt="" />
              Archived Notes
            </a>
          </section>
        </section>

        <section className="mid">
          <h1 id="personal">Personal</h1>
          <div id="docList">
            {notesList.map((note) => (
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
              <button id="restore-btn" onClick={() => setShowRestore(false)}>
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
                  <img id="dots" alt="dots" />
                </button>
              </span>
              {showMenu && (
                <div className="menu">
                  <button>Archive</button>
                  <button
                    onClick={() => {
                      setShowRestore(true);
                      setShowMenu(false);
                    }}
                  >
                    Delete
                  </button>
                  <button>Add to favourites</button>
                </div>
              )}
              <section className="table">
                <span className="col">Date</span>
                <span className="row">
                  {selectedNote.createdAt
                    ? new Date(selectedNote.createdAt).toLocaleDateString("en-GB")
                    : ""}
                </span>

                <hr id="id" />

                <span className="col">Folder</span>
                <span className="row">{selectedNote.folder?.name}</span>
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
