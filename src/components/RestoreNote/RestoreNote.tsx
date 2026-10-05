import type { Note } from "../../types";

type RestoreNoteProps = {
  selectedNote: Note;
  handleRestoreNote: (noteId: string) => Promise<void>;
};

function RestoreNote({ selectedNote, handleRestoreNote }: RestoreNoteProps) {
  return (
    <div className="absolute top-1/2 left-1/2 flex w-4/5 max-w-[600px] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center">
      <img
        className="mb-[15px] h-auto w-[60px] invert"
        src="/assets/restore.svg"
        alt="Restore note"
      />

      <h2 className="mb-[15px] text-[32px] text-inherit">
        Restore "{selectedNote.title}"
      </h2>

      <p className="mb-[25px] w-full max-w-[500px] leading-normal text-black/60 dark:text-white/60" >
        Don't want to lose this note? It's not too late! Just click the
        'Restore' button and it will be added back to your list. It's that
        simple.
      </p>

      <button
        className="flex h-[42px] w-[111px] cursor-pointer items-center justify-center rounded-md border-none bg-[#312eb5] px-[30px] py-2 text-sm font-medium text-white hover:bg-white/85 active:scale-[0.98]"
        onClick={() => handleRestoreNote(selectedNote.id)}
      >
        Restore
      </button>
    </div>
  );
}

export default RestoreNote;
