import type { Note } from "../../types";

type NoteMenuProps = {
  showMenu: boolean;
  selectedNote: Note;
  handleToggleFavorite: () => Promise<void>;
  handleDeleteNote: () => Promise<void>;
  handleToggleArchive: () => Promise<void>;
};

const menuItem =
  "flex cursor-pointer items-center gap-2 border-none bg-transparent text-left text-base text-white";

function NoteMenu({
  showMenu,
  selectedNote,
  handleToggleFavorite,
  handleToggleArchive,
  handleDeleteNote,
}: NoteMenuProps) {
  if (!showMenu) {
    return null;
  }

  return (
    <section className="relative">
      <div className="absolute top-[calc(100%+5px)] right-0 z-[1000] flex h-[150px] w-[18%] flex-col gap-[15px] rounded-md bg-[#333] p-[15px]">
        <button className={menuItem} onClick={handleToggleFavorite}>
          <img src="/assets/star.svg" alt="" />
          {selectedNote.isFavorite
            ? "Remove from favourites"
            : "Add to favourites"}
        </button>

        <button className={menuItem} onClick={handleToggleArchive}>
          <img src="/assets/archived.svg" alt="" />
          {selectedNote.isArchived ? "Remove from archive" : "Add to archive"}
        </button>

        <hr className="m-0 h-px w-full shrink-0 border-0 bg-white/50" />

        <button className={menuItem} onClick={handleDeleteNote}>
          <img src="/assets/trash.svg" alt="" />
          Delete
        </button>
      </div>
    </section>
  );
}

export default NoteMenu;