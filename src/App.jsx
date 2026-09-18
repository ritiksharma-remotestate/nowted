import { useState, useEffect } from "react";
import "./App.css";

// Adjust this if your Swagger docs show a different base path
// (e.g. some APIs prefix every route with /api)
const API_BASE_URL = "https://nowted-server.remotestate.com";

function App() {
  const [showSearch, setShowSearch] = useState(false);
  // null = nothing selected yet, so the "select a note" empty state shows

  const [selectedNote, setSelectedNote] = useState(null);
  // starts empty — real data arrives from the API once the fetch below completes
  const [notesList, setNotesList] = useState([]);
  const [folders, setFolders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // runs once when App first mounts (the [] at the end is the
  // dependency list — empty means "only run on the very first render,
  // never again"). This is the standard shape for "fetch data on load."
  useEffect(() => {
    fetch(`${API_BASE_URL}/notes`)
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const notes = Array.isArray(data) ? data : data.notes ?? data.data ?? [];
        setNotesList(notes);
        setIsLoading(false);
      })
      .catch((err) => {
        setLoadError(err.message);
        setIsLoading(false);
      });
  }, []);

  
  const [showAddFolder, setShowAddFolder] = useState(false);
  // this holds whatever's currently typed in the new-folder input —
  // "controlled input" means React state is the source of truth for
  // the input's value, not the DOM itself
  const [newFolderName, setNewFolderName] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showRestore, setShowRestore] = useState(false);

  // switching notes should always reset menu/restore back to closed,
  // otherwise clicking a new note while the restore panel is open
  // would show the wrong note's restore message
  const handleSelectNote = async (note) => {
    // same note clicked again → close it (toggle)
    if (selectedNote?.id === note.id) {
      setSelectedNote(null);
      setShowMenu(false);
      setShowRestore(false);
      return;
    }

    setShowMenu(false);
    setShowRestore(false);

    // if we've already fetched this note's full content before, no
    // need to hit the network again — just show what we have
    if (note.content !== undefined) {
      setSelectedNote(note);
      return;
    }

    // the list endpoint only gave us a preview, not the full body —
    // fetch the real thing before showing the detail pane
    try {
      const res = await fetch(`${API_BASE_URL}/notes/${note.id}`);
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const fullNote = await res.json();

      // cache it into notesList too, so clicking this same note again
      // later won't need another network request
      setNotesList((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, ...fullNote } : n))
      );
      setSelectedNote(fullNote);
    } catch (err) {
      console.error("Failed to load note detail:", err);
    }
  };

  const handleAddFolder = () => {
    const trimmed = newFolderName.trim();
    if (trimmed === "") return; // ignore empty/blank submissions
    setFolders([...folders, trimmed]);
    setNewFolderName(""); // clear the input for next time
    setShowAddFolder(false); // close the input box after adding
  };

  const handleNewNote = () => {
    const newNote = {
      id: Date.now(), // simple way to get a unique id without a backend
      title: "Untitled Note",
      date: new Date().toLocaleDateString("en-GB"), // e.g. 17/09/2026
      folder: "Personal",
      description: "New note...",
      body: "Start writing here...",
    };
    // spread the old list into a new array with newNote first —
    // never mutate state directly (no notesList.push), always create
    // a new array/object so React knows something changed
    setNotesList([newNote, ...notesList]);
    handleSelectNote(newNote);
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
                className={`nav_content${selectedNote?.id === note.id ? ' selected' : ''}`}
                href="#"
                key={note.id}
                onClick={(e) => {
                  e.preventDefault(); // stop the # link from jumping the page
                  handleSelectNote(note);
                }}
              >
                <img src="/assets/document.svg" alt="" />
                {note.title}
              </a>
            ))}
          </section>

          <section className="nav_div">
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

            {folders.map((folder) => (
              <a className="nav_content" href="#" key={folder}>
                <img src="/assets/document.svg" alt="" />
                {folder}
              </a>
            ))}
          </section>

          <section className="nav_div">
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
          {notesList.map((note) => (
            <div
              className={`mid_div${selectedNote?.id === note.id ? " selected" : ""}`}
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
        </section>

        <section className="last">
          {!selectedNote ? (
            <div id="select-note">
              <img id="note-image" src="" alt="note" />
              <h2 id="heading_last">Select a note to view</h2>
              <h5 id="para">
                Choose a note form the list on the left to view its contents,or
                create a new note to add to your collection
              </h5>
            </div>
          ) : showRestore ? (
            <div id="restore">
              <img id="restore-icon" src="" alt="restore-image" />
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
                <h1 id="heading_last">{selectedNote.title}</h1>
                <button id="dots_btn" onClick={() => setShowMenu(!showMenu)}>
                  <img id="dots" src="" alt="dots" />
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
              <div id="para">
                {selectedNote.content.split("\n\n").map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

export default App;
