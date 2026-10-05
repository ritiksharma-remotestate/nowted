import { useState } from "react";

type FolderUpdationProps = {
  initialName: string;
  onSave: (name: string) => Promise<void>;
  onCancel: () => void;
};

function FolderUpdation({ initialName, onSave, onCancel }: FolderUpdationProps) {
  const [value, setValue] = useState<string>(initialName);

  const submit = async (): Promise<void> => {
    const trimmed = value.trim();

    if (trimmed !== "" && trimmed !== initialName) {
      await onSave(trimmed);
    }

    onCancel();
  };

  return (
    <input
      className="box-border w-full rounded-md border border-[#d0d0d0] bg-white px-2.5 py-1.5 text-base text-[#181818] outline-none dark:border-[#3a3a3a] dark:bg-[#242424] dark:text-white"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") submit();
        if (e.key === "Escape") onCancel();
      }}
      onBlur={onCancel}
      autoFocus
    />
  );
}

export default FolderUpdation;