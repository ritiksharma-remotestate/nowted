import { useState, useEffect } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar/Sidebar";
import NotesList from "./components/NotesList/NotesList";
import NoteEditor from "./components/NoteEditor/NoteEditor";
import RestoreNote from "./components/RestoreNote/RestoreNote";
import EmptyState from "./components/EmptyState/EmptyState";
import type { Folder, Note, SpecialView } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_URL;
type NotesResponse = {
  notes?: Note[];
  data?: Note[];
};

type FoldersResponse = {
  folders?: Folder[];
  data?: Folder[];
};

function App() {
  const [showSearch, setShowSearch] = useState<boolean>(false);

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const [notesList, setNotesList] = useState<Note[]>([]);

  const [folders, setFolders] = useState<Folder[]>([]);

  const [notesLoading, setNotesLoading] = useState<boolean>(true);

  const [foldersLoading, setFoldersLoading] = useState<boolean>(true);

  const isLoading = notesLoading || foldersLoading;

  const [loadError, setLoadError] = useState<string | null>(null);

  const [showAddFolder, setShowAddFolder] = useState<boolean>(false);

  const [newFolderName, setNewFolderName] = useState<string>("");

  const [showMenu, setShowMenu] = useState<boolean>(false);

  const [showRestore, setShowRestore] = useState<boolean>(false);

  const [trashNotes, setTrashNotes] = useState<Note[]>([]);

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const [specialView, setSpecialView] = useState<SpecialView>(null);

  const [searchInput, setSearchInput] = useState<string>("");

  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const selectedFolder = folders.find((f) => f.id === selectedFolderId) ?? null;

  const selectedNote =
    notesList.find((n) => n.id === selectedNoteId) ??
    trashNotes.find((n) => n.id === selectedNoteId);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

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
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }

        return res.json();
      })
      .then((data: Note[] | NotesResponse) => {
        const notes = Array.isArray(data)
          ? data
          : (data.notes ?? data.data ?? []);

        setNotesList(notes);
        setNotesLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof Error) {
          setLoadError(err.message);
        } else {
          setLoadError("Something went wrong");
        }

        setNotesLoading(false);
      });
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/folders`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }

        return res.json();
      })
      .then((data: Folder[] | FoldersResponse) => {
        const foldersList = Array.isArray(data)
          ? data
          : (data.folders ?? data.data ?? []);

        setFolders(foldersList);
        setFoldersLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof Error) {
          setLoadError(err.message);
        } else {
          setLoadError("Something went wrong");
        }

        setFoldersLoading(false);
      });
  }, []);

  const handleSelectNote = async (note: Note): Promise<void> => {
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

    if (note.content !== undefined) {
      setSelectedNoteId(note.id);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/notes/${note.id}`);

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      const responseData: Note | { note: Note } = await res.json();

      const fullNote =
        "note" in responseData ? responseData.note : responseData;

      setNotesList((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, ...fullNote } : n)),
      );

      setSelectedNoteId(note.id);
    } catch (err: unknown) {
      console.error("Failed to load note detail:", err);
    }
  };

  const handleAddFolder = async (): Promise<void> => {
    const trimmed = newFolderName.trim();

    if (trimmed === "") {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/folders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmed,
        }),
      });

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      const refreshed = await fetch(`${API_BASE_URL}/folders`);

      if (!refreshed.ok) {
        throw new Error(`Request failed: ${refreshed.status}`);
      }

      const refreshedData: Folder[] | FoldersResponse = await refreshed.json();

      const foldersList = Array.isArray(refreshedData)
        ? refreshedData
        : (refreshedData.folders ?? refreshedData.data ?? []);

      setFolders(foldersList);
      setNewFolderName("");
      setShowAddFolder(false);
    } catch (err: unknown) {
      console.error("Failed to create folder:", err);

      alert("Couldn't create the folder — check the console for details.");
    }
  };

  const handleNewNote = async (): Promise<void> => {
    const defaultFolderId = folders[0]?.id;

    if (!defaultFolderId) {
      alert("Create a folder first — notes need to belong to one.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          folderId: defaultFolderId,
          title: "Untitled Note",
          content: "Start writing here...",
        }),
      });

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      const responseData: Note | { note: Note } = await res.json();

      const createdNote =
        "note" in responseData ? responseData.note : responseData;

      setNotesList((prev) => [createdNote, ...prev]);

      setSelectedNoteId(createdNote.id);
    } catch (err: unknown) {
      console.error("Failed to create note:", err);

      alert("Couldn't create the note — check the console for details.");
    }
  };

  const handleOpenTrash = async (
    e: React.MouseEvent<HTMLAnchorElement>,
  ): Promise<void> => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_BASE_URL}/notes?deleted=true`);

      if (!res.ok) {
        throw new Error("Failed to fetch trash");
      }

      const responseData: NotesResponse | Note[] = await res.json();

      const deletedNotes = Array.isArray(responseData)
        ? responseData
        : (responseData.notes ?? responseData.data ?? []);

      setTrashNotes(deletedNotes);

      setSelectedFolderId(null);
      setSpecialView("trash");
      setSelectedNoteId(null);
    } catch (error: unknown) {
      console.error("Trash error:", error);
    }
  };

  const handleFieldChange = (
    field: "title" | "content",
    value: string,
  ): void => {
    setNotesList((prev) =>
      prev.map((n) => (n.id === selectedNoteId ? { ...n, [field]: value } : n)),
    );
  };

  const handleDeleteNote = async (): Promise<void> => {
    if (!selectedNote) {
      return;
    }

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

      setNotesList((prev) =>
        prev.filter((note) => note.id !== selectedNote.id),
      );

      setSelectedNoteId(null);
      setShowMenu(false);
    } catch (error: unknown) {
      console.error("Delete error:", error);
    }
  };

  const handleSaveNote = async (): Promise<void> => {
    if (!selectedNote) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/notes/${selectedNote.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: selectedNote.title,
          content: selectedNote.content,
        }),
      });

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }
    } catch (err: unknown) {
      console.error("Failed to save note:", err);
    }
  };

  const handleRestoreNote = async (noteId: string): Promise<void> => {
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

      const noteRes = await fetch(`${API_BASE_URL}/notes/${noteId}`);

      if (!noteRes.ok) {
        throw new Error("Failed to fetch restored note");
      }

      const responseData: Note | { note: Note } = await noteRes.json();

      const restoredNote =
        "note" in responseData ? responseData.note : responseData;

      setNotesList((prev) => [restoredNote, ...prev]);

      setTrashNotes((prev) => prev.filter((note) => note.id !== noteId));

      setSelectedNoteId(null);
      setShowRestore(false);
    } catch (error: unknown) {
      console.error("Restore error:", error);
    }
  };

  const handleToggleFavorite = async (): Promise<void> => {
    if (!selectedNote) {
      return;
    }

    const newFavoriteStatus = !selectedNote.isFavorite;

    try {
      const res = await fetch(`${API_BASE_URL}/notes/${selectedNote.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isFavorite: newFavoriteStatus,
        }),
      });

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      setNotesList((prev) =>
        prev.map((n) =>
          n.id === selectedNote.id
            ? {
                ...n,
                isFavorite: newFavoriteStatus,
              }
            : n,
        ),
      );

      setShowMenu(false);
    } catch (err: unknown) {
      console.error("Failed to update favorite:", err);
    }
  };

  const handleChangeFolder = async (newFolderId: string): Promise<void> => {
    if (!selectedNote) {
      return;
    }

    const newFolder = folders.find((f) => f.id === newFolderId);

    setNotesList((prev) =>
      prev.map((n) =>
        n.id === selectedNote.id
          ? {
              ...n,
              folderId: newFolderId,
              folder: newFolder,
            }
          : n,
      ),
    );

    try {
      const res = await fetch(`${API_BASE_URL}/notes/${selectedNote.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          folderId: newFolderId,
        }),
      });

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }
    } catch (err: unknown) {
      console.error("Failed to change folder:", err);
    }
  };

  const handleToggleArchive = async (): Promise<void> => {
    if (!selectedNote) {
      return;
    }

    const newArchiveStatus = !selectedNote.isArchived;

    try {
      const res = await fetch(`${API_BASE_URL}/notes/${selectedNote.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isArchived: newArchiveStatus,
        }),
      });

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      setNotesList((prev) =>
        prev.map((n) =>
          n.id === selectedNote.id
            ? {
                ...n,
                isArchived: newArchiveStatus,
              }
            : n,
        ),
      );

      setShowMenu(false);
    } catch (err: unknown) {
      console.error("Failed to update archive:", err);
    }
  };

  if (isLoading) {
    return (
      <p
        style={{
          color: "white",
          padding: 20,
        }}
      >
        Loading notes...
      </p>
    );
  }

  if (loadError) {
    return (
      <p
        style={{
          color: "white",
          padding: 20,
        }}
      >
        Couldn't load notes: {loadError}
      </p>
    );
  }

  return (
    <>
      <main className="main">
        <Sidebar
          showSearch={showSearch}
          setShowSearch={setShowSearch}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          handleNewNote={handleNewNote}
          folders={folders}
          selectedFolderId={selectedFolderId}
          setSelectedFolderId={setSelectedFolderId}
          setSpecialView={setSpecialView}
          showAddFolder={showAddFolder}
          setShowAddFolder={setShowAddFolder}
          newFolderName={newFolderName}
          setNewFolderName={setNewFolderName}
          handleAddFolder={handleAddFolder}
          handleOpenTrash={handleOpenTrash}
          notesList={notesList}
          selectedNoteId={selectedNoteId}
          handleSelectNote={handleSelectNote}
          specialView={specialView}
        />

        <NotesList
          selectedFolder={selectedFolder}
          visibleNotes={visibleNotes}
          selectedNoteId={selectedNoteId}
          handleSelectNote={handleSelectNote}
          specialView={specialView}
        />

        <section className="last">
          {!selectedNote ? (
            <EmptyState />
          ) : showRestore ? (
            <RestoreNote
              selectedNote={selectedNote}
              handleRestoreNote={handleRestoreNote}
            />
          ) : (
            <NoteEditor
              selectedNote={selectedNote}
              folders={folders}
              handleFieldChange={handleFieldChange}
              handleSaveNote={handleSaveNote}
              showMenu={showMenu}
              setShowMenu={setShowMenu}
              handleToggleFavorite={handleToggleFavorite}
              handleToggleArchive={handleToggleArchive}
              handleDeleteNote={handleDeleteNote}
              handleChangeFolder={handleChangeFolder}
            />
          )}
        </section>
      </main>
    </>
  );
}

export default App;
