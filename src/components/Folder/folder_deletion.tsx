type FolderDeletionProps = {
  folderName: string;
  onDelete: () => Promise<void>;
};

function FolderDeletion({ folderName, onDelete }: FolderDeletionProps) {
  const handleClick = (): void => {
    if (window.confirm(`Delete folder "${folderName}"?`)) {
      onDelete();
    }
  };

  return (
    <button
      type="button"
      className="cursor-pointer border-none bg-transparent p-1"
      onClick={handleClick}
      aria-label={`Delete folder ${folderName}`}
    >
      <img className="size-4 invert dark:invert-0" src="/assets/trash.svg" alt="" />
    </button>
  );
}

export default FolderDeletion;