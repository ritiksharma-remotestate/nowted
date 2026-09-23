export type Folder = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type Note = {
  id: string;
  folderId: string;
  title: string;
  content?: string;
  preview?: string;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  folder?: Folder;
};

export type SpecialView =
  | "favorites"
  | "trash"
  | "archived"
  | null;