function EmptyState() {
  return (
    <div className="absolute top-1/2 left-1/2 flex w-4/5 max-w-[600px] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center">
      <img
        className="mb-[15px] h-auto w-[60px] invert dark:invert-0"
        src="/assets/select_note_icon.svg"
        alt=""
      />

      <h2 className="mb-[15px] text-[32px] font-bold text-inherit">
        Select a note to view
      </h2>

      <p className="w-full max-w-[500px] leading-normal text-black/60 dark:text-white/60">
        Choose a note from the list on the left to view its contents, or create
        a new note to add to your collection
      </p>
    </div>
  );
}

export default EmptyState;