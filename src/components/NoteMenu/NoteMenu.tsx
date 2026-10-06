import type { Note } from "../../types";

type NoteMenuProps = {
  showMenu: boolean;
  selectedNote: Note;
  handleToggleFavorite: () => Promise<void>;
  handleDeleteNote: () => Promise<void>;
  handleToggleArchive: () => Promise<void>;
};

// Icons are white SVGs: invert them in light mode, keep as-is in dark mode.
const icon = "invert dark:invert-0";

const menuItem =
  "flex cursor-pointer items-center gap-2 whitespace-nowrap border-none bg-transparent p-0 text-left text-base text-[#181818] dark:text-white";

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
      <div className="absolute top-[calc(100%+5px)] right-0 z-[1000] flex w-max min-w-[202px] flex-col gap-5 rounded-md border border-black/10 bg-white p-[15px] shadow-lg dark:border-transparent dark:bg-[#333] dark:shadow-none">
        <button className={menuItem} onClick={handleToggleFavorite}>
          <img className={icon} src="/assets/star.svg" alt="" />
          {selectedNote.isFavorite
            ? "Remove from favourites"
            : "Add to favourites"}
        </button>

        <button className={menuItem} onClick={handleToggleArchive}>
          <img className={icon} src="/assets/archived.svg" alt="" />
          {selectedNote.isArchived ? "Unarchive" : "Archive"}
        </button>

        <hr className="m-0 h-px w-full shrink-0 border-0 bg-black/20 dark:bg-white/50" />

        <button className={menuItem} onClick={handleDeleteNote}>
          <img className={icon} src="/assets/trash.svg" alt="" />
          Delete
        </button>
      </div>
    </section>
  );
}

export default NoteMenu;