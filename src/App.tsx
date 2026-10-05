import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./App.css";
import Sidebar from "./components/Sidebar/Sidebar";
import NotesList from "./components/NotesList/NotesList";
import NoteEditor from "./components/NoteEditor/NoteEditor";
import RestoreNote from "./components/RestoreNote/RestoreNote";
import EmptyState from "./components/EmptyState/EmptyState";
import type { Folder, Note, SpecialView, NotesResponse } from "./types";
import { useTheme } from "./context/themeContext";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const PAGE_SIZE = 10;

type FoldersResponse = {
  folders?: Folder[];
  data?: Folder[];
};

type RouteState = {
  folderId: string | null;
  view: SpecialView;
  noteId: string | null;
};

// URL shapes:
//   /                               /notes/:noteId
//   /folders/:folderId              /folders/:folderId/notes/:noteId
//   /favorites | /archived | /trash (each also with /notes/:noteId)
function parseRoute(pathname: string): RouteState {
  const [a, b, c, d] = pathname.split("/").filter(Boolean);

  if (a === "folders" && b) {
    return {
      folderId: b,
      view: null,
      noteId: c === "notes" ? (d ?? null) : null,
    };
  }

  if (a === "favorites" || a === "archived" || a === "trash") {
    return {
      folderId: null,
      view: a,
      noteId: b === "notes" ? (c ?? null) : null,
    };
  }

  if (a === "notes" && b) {
    return { folderId: null, view: null, noteId: b };
  }

  return { folderId: null, view: null, noteId: null };
}

function NotesPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { theme } = useTheme();

  const {
    folderId: selectedFolderId,
    view: specialView,
    noteId: selectedNoteId,
  } = parseRoute(pathname);

  // where the current list lives, without the note part
  const basePath = selectedFolderId
    ? `/folders/${selectedFolderId}`
    : specialView
      ? `/${specialView}`
      : "";

  const showRestore = specialView === "trash" && selectedNoteId !== null;

  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [notesList, setNotesList] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [trashNotes, setTrashNotes] = useState<Note[]>([]);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);

  const [notesLoading, setNotesLoading] = useState<boolean>(true);
  const [foldersLoading, setFoldersLoading] = useState<boolean>(true);
  const isLoading = notesLoading || foldersLoading;
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showAddFolder, setShowAddFolder] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [showMenu, setShowMenu] = useState<boolean>(false);

  const [searchInput, setSearchInput] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  const selectedFolder = folders.find((f) => f.id === selectedFolderId) ?? null;

  const selectedNote =
    specialView === "trash"
      ? trashNotes.find((n) => n.id === selectedNoteId)
      : notesList.find((n) => n.id === selectedNoteId);

  const sourceNotes = specialView === "trash" ? trashNotes : notesList;

  const visibleNotes = sourceNotes.filter((n) => {
    const matchesFolder = !selectedFolderId || n.folderId === selectedFolderId;

    const matchesSpecialView =
      (specialView === null && !n.isArchived) ||
      (specialView === "favorites" && n.isFavorite === true && !n.isArchived) ||
      specialView === "trash" ||
      (specialView === "archived" && n.isArchived === true);

    const matchesSearch =
      debouncedSearch.trim() === "" ||
      n.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (n.preview ?? "").toLowerCase().includes(debouncedSearch.toLowerCase());

    return matchesFolder && matchesSpecialView && matchesSearch;
  });

  /* ------------------------------ data loading ------------------------------ */

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
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

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
        setLoadError(
          err instanceof Error ? err.message : "Something went wrong",
        );
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
        setLoadError(
          err instanceof Error ? err.message : "Something went wrong",
        );
        setFoldersLoading(false);
      });
  }, []);

  // Trash: load whenever the URL is /trash...
  useEffect(() => {
    if (specialView !== "trash") return;

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/notes?deleted=true`);
        if (!res.ok) throw new Error("Failed to fetch trash");

        const data: NotesResponse | Note[] = await res.json();
        setTrashNotes(
          Array.isArray(data) ? data : (data.notes ?? data.data ?? []),
        );
      } catch (err: unknown) {
        console.error("Trash error:", err);
      }
    })();
  }, [specialView]);

  // Archived: load whenever the URL is /archived..., merged into notesList
  useEffect(() => {
    if (specialView !== "archived") return;

    (async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/notes?archived=true&limit=100`,
        );
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);

        const data: NotesResponse | Note[] = await res.json();
        const archived = Array.isArray(data)
          ? data
          : (data.notes ?? data.data ?? []);

        setNotesList((prev) => {
          const ids = new Set(prev.map((n) => n.id));
          return [...prev, ...archived.filter((n) => !ids.has(n.id))];
        });
      } catch (err: unknown) {
        console.error("Archived error:", err);
      }
    })();
  }, [specialView]);

  // Note detail: opened from a link, a refresh, or Recents
  useEffect(() => {
    if (isLoading || !selectedNoteId || specialView === "trash") return;

    const existing = notesList.find((n) => n.id === selectedNoteId);
    if (existing?.content !== undefined) return;

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/notes/${selectedNoteId}`);
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);

        const data: Note | { note: Note } = await res.json();
        const fullNote = "note" in data ? data.note : data;

        setNotesList((prev) =>
          prev.some((n) => n.id === fullNote.id)
            ? prev.map((n) =>
                n.id === fullNote.id ? { ...n, ...fullNote } : n,
              )
            : [fullNote, ...prev],
        );
      } catch (err: unknown) {
        console.error("Failed to load note detail:", err);
        navigate(basePath || "/", { replace: true }); // bad id in the URL
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNoteId, specialView, isLoading]);

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
        const ids = new Set(prev.map((n) => n.id));
        return [...prev, ...notes.filter((n) => !ids.has(n.id))];
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

  /* -------------------------------- handlers -------------------------------- */

  const handleSelectNote = (note: Note): void => {
    setShowMenu(false);

    if (selectedNoteId === note.id) {
      navigate(basePath || "/");
      return;
    }

    navigate(`${basePath}/notes/${note.id}`);
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

      if (
        selectedFolderId === folderId ||
        selectedNote?.folderId === folderId
      ) {
        navigate("/");
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
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
        headers: { "Content-Type": "application/json" },
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
      navigate(`/notes/${createdNote.id}`);
    } catch (err: unknown) {
      console.error("Failed to create note:", err);
      alert("Couldn't create the note — check the console for details.");
    }
  };

  const handleFieldChange = (
    field: "title" | "content",
    value: string,
  ): void => {
    setNotesList((prev) =>
      prev.map((n) =>
        n.id === selectedNoteId
          ? {
              ...n,
              [field]: value,
              ...(field === "content" ? { preview: value.slice(0, 50) } : {}),
            }
          : n,
      ),
    );
  };

  const handleDeleteNote = async (): Promise<void> => {
    if (!selectedNote) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/notes/${selectedNote.id}`, {
        method: "DELETE",
        headers: { Accept: "text/plain" },
      });

      if (!res.ok) {
        throw new Error("Failed to delete note");
      }

      fetchRecentNotes();
      setNotesList((prev) => prev.filter((n) => n.id !== selectedNote.id));

      setShowMenu(false);
      navigate(basePath || "/");
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
        headers: { "Content-Type": "application/json" },
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
        headers: { Accept: "text/plain" },
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

      setNotesList((prev) =>
        prev.some((n) => n.id === restoredNote.id)
          ? prev
          : [restoredNote, ...prev],
      );
      setTrashNotes((prev) => prev.filter((n) => n.id !== noteId));

      navigate("/trash");
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: newFavoriteStatus }),
      });

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      fetchRecentNotes();

      setNotesList((prev) =>
        prev.map((n) =>
          n.id === selectedNote.id
            ? { ...n, isFavorite: newFavoriteStatus }
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

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      fetchRecentNotes();
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: newArchiveStatus }),
      });

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      fetchRecentNotes();

      setNotesList((prev) =>
        prev.map((n) =>
          n.id === selectedNote.id ? { ...n, isArchived: newArchiveStatus } : n,
        ),
      );

      setShowMenu(false);
      // the note just left this list, so close it
      navigate(basePath || "/");
    } catch (err: unknown) {
      console.error("Failed to update archive:", err);
    }
  };

  /* ---------------------------------- render --------------------------------- */
  // every hook is above this point, so the early returns are safe

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
        showAddFolder={showAddFolder}
        setShowAddFolder={setShowAddFolder}
        newFolderName={newFolderName}
        setNewFolderName={setNewFolderName}
        handleAddFolder={handleAddFolder}
        handleRenameFolder={handleRenameFolder}
        handleDeleteFolder={handleDeleteFolder}
        selectedNoteId={selectedNoteId}
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
        ) : selectedNote.content === undefined ? null : (
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
  );
}

function App() {
  return <NotesPage />;
}

export default App;
