import { useState, useEffect } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar/Sidebar";
import NotesList from "./components/NotesList/NotesList";
import NoteEditor from "./components/NoteEditor/NoteEditor";
import RestoreNote from "./components/RestoreNote/RestoreNote";
import EmptyState from "./components/EmptyState/EmptyState";
import type { Folder, Note, SpecialView, NotesResponse } from "./types";
import { useTheme } from "./context/themeContext";
const API_BASE_URL = import.meta.env.VITE_API_URL;

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
  const { theme, toggleTheme } = useTheme();

  const PAGE_SIZE = 10;

  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

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

  const [recentNotes, setRecentNotes] = useState<Note[]>([]);

  const fetchRecentNotes = async (): Promise<void> => {
    try {
      const res = await fetch(`${API_BASE_URL}/notes/recent`);

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      const data: Note[] | NotesResponse = await res.json();
      const notes = Array.isArray(data)
        ? data
        : (data.recentNotes ?? data.data ?? []);

      setRecentNotes(notes.slice(0, 3));
    } catch (err: unknown) {
      console.error("Failed to load recent notes:", err);
    }
  };

  useEffect(() => {
    fetchRecentNotes();
  }, []);

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
        const total = Array.isArray(data) ? undefined : data.total;
        setHasMore(
          total !== undefined
            ? notes.length < total
            : notes.length === PAGE_SIZE,
        );
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
  const loadMoreNotes = async (): Promise<void> => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);

    try {
      const nextPage = page + 1;
      const res = await fetch(
        `${API_BASE_URL}/notes?page=${nextPage}&limit=${PAGE_SIZE}`,
      );

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      const data: Note[] | NotesResponse = await res.json();
      const notes = Array.isArray(data)
        ? data
        : (data.notes ?? data.data ?? []);
      const total = Array.isArray(data) ? undefined : data.total;

      // dedupe: new/archived/restored notes can shift pages and repeat items
      setNotesList((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        return [...prev, ...notes.filter((n) => !existingIds.has(n.id))];
      });

      setPage(nextPage);
      setHasMore(
        total !== undefined
          ? nextPage * PAGE_SIZE < total
          : notes.length === PAGE_SIZE,
      );
    } catch (err: unknown) {
      console.error("Failed to load more notes:", err);
    } finally {
      setLoadingMore(false);
    }
  };
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
  const handleRenameFolder = async (
    folderId: string,
    name: string,
  ): Promise<void> => {
    try {
      const res = await fetch(`${API_BASE_URL}/folders/${folderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      setFolders((prev) =>
        prev.map((f) => (f.id === folderId ? { ...f, name } : f)),
      );

      // notes carry a copy of their folder, keep it in sync
      setNotesList((prev) =>
        prev.map((n) =>
          n.folderId === folderId && n.folder
            ? { ...n, folder: { ...n.folder, name } }
            : n,
        ),
      );
    } catch (err: unknown) {
      console.error("Failed to rename folder:", err);
      alert("Couldn't rename the folder — check the console for details.");
    }
  };

  const handleDeleteFolder = async (folderId: string): Promise<void> => {
    try {
      const res = await fetch(`${API_BASE_URL}/folders/${folderId}`, {
        method: "DELETE",
        headers: { Accept: "text/plain" },
      });

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      setFolders((prev) => prev.filter((f) => f.id !== folderId));

      // adjust this line to match what your backend does with the notes
      setNotesList((prev) => prev.filter((n) => n.folderId !== folderId));

      if (selectedFolderId === folderId) {
        setSelectedFolderId(null);
      }
      if (selectedNote?.folderId === folderId) {
        setSelectedNoteId(null);
      }

      fetchRecentNotes();
    } catch (err: unknown) {
      console.error("Failed to delete folder:", err);
      alert("Couldn't delete the folder — check the console for details.");
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
      fetchRecentNotes();

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
      fetchRecentNotes();
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
      fetchRecentNotes();
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
      fetchRecentNotes();

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
      fetchRecentNotes();

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
      fetchRecentNotes();
    } catch (err: unknown) {
      console.error("Failed to change folder:", err);
    }
  };
  const handleOpenArchived = async (
    e: React.MouseEvent<HTMLAnchorElement>,
  ): Promise<void> => {
    e.preventDefault();

    if (specialView === "archived") {
      setSpecialView(null);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/notes?archived=true&limit=100`);

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      const responseData: NotesResponse | Note[] = await res.json();

      const archivedNotes = Array.isArray(responseData)
        ? responseData
        : (responseData.notes ?? responseData.data ?? []);

      setNotesList((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        return [
          ...prev,
          ...archivedNotes.filter((n) => !existingIds.has(n.id)),
        ];
      });

      setSelectedFolderId(null);
      setSpecialView("archived");
      setSelectedNoteId(null);
    } catch (err: unknown) {
      console.error("Archived error:", err);
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
      fetchRecentNotes();

      console.log(selectedNote.id);

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
      <main
        className={`grid h-screen grid-cols-[300px_350px_1fr] overflow-hidden max-[1200px]:grid-cols-[220px_280px_1fr] max-[900px]:grid-cols-[180px_240px_1fr] max-[730px]:flex max-[730px]:h-auto max-[730px]:min-h-screen max-[730px]:w-full max-[730px]:flex-col max-[730px]:overflow-x-hidden max-[730px]:overflow-y-auto ${
          theme === "dark" ? "dark" : ""
        }`}
      >
        <Sidebar
          showSearch={showSearch}
          setShowSearch={setShowSearch}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          handleNewNote={handleNewNote}
          folders={folders}
          recentNotes={recentNotes}
          selectedFolderId={selectedFolderId}
          setSelectedFolderId={setSelectedFolderId}
          setSpecialView={setSpecialView}
          showAddFolder={showAddFolder}
          setShowAddFolder={setShowAddFolder}
          newFolderName={newFolderName}
          setNewFolderName={setNewFolderName}
          handleAddFolder={handleAddFolder}
          handleOpenTrash={handleOpenTrash}
          handleOpenArchived={handleOpenArchived}
          selectedNoteId={selectedNoteId}
          handleSelectNote={handleSelectNote}
          handleRenameFolder={handleRenameFolder}
          handleDeleteFolder={handleDeleteFolder}
          specialView={specialView}
        />

        <NotesList
          selectedFolder={selectedFolder}
          visibleNotes={visibleNotes}
          selectedNoteId={selectedNoteId}
          handleSelectNote={handleSelectNote}
          specialView={specialView}
          onLoadMore={loadMoreNotes}
          hasMore={
            hasMore && (specialView === null || specialView === "favorites")
          }
          loadingMore={loadingMore}
        />

        <section className="relative h-screen bg-[whitesmoke] p-[30px] text-[#181818] dark:bg-[#181818] dark:text-white max-[900px]:p-5 max-[730px]:h-auto max-[730px]:w-full max-[730px]:p-4">
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
