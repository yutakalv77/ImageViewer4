import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EntryCard } from "../components/EntryCard";
import { EntryItem } from "../types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("EntryCard component", () => {
  const dummyEntry: EntryItem = {
    name: "image1.jpg",
    path: "/photos/image1.jpg",
    is_dir: false,
    thumbnail_path: "/cache/image1_thumb.jpg",
  };

  const defaultProps = {
    entry: dummyEntry,
    isSelected: false,
    isEditing: false,
    isFavorite: false,
    onClick: vi.fn(),
    onContextMenu: vi.fn(),
    onRenameComplete: vi.fn(),
    onRenameCancel: vi.fn(),
  };

  it("renders entry name and image thumbnail", () => {
    render(<EntryCard {...defaultProps} />);

    expect(screen.getByText("image1.jpg")).toBeInTheDocument();
    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "asset:///cache/image1_thumb.jpg");
    expect(img).toHaveAttribute("decoding", "async");
  });

  it("renders folder icon for directories", async () => {
    const dirEntry: EntryItem = {
      name: "Vacation",
      path: "/photos/Vacation",
      is_dir: true,
      thumbnail_path: null,
    };

    render(<EntryCard {...defaultProps} entry={dirEntry} />);
    await waitFor(() => {
      expect(screen.getByText("Vacation")).toBeInTheDocument();
      expect(screen.getByText("📁")).toBeInTheDocument();
    });
  });

  it("renders folder icon and common.folder fallback when directory has no thumbnail", async () => {
    const emptyDirEntry: EntryItem = {
      name: "EmptyAlbum",
      path: "/photos/EmptyAlbum",
      is_dir: true,
      thumbnail_path: null,
    };

    render(<EntryCard {...defaultProps} entry={emptyDirEntry} />);
    await waitFor(() => {
      expect(screen.getByText("EmptyAlbum")).toBeInTheDocument();
      expect(screen.getByText("📁")).toBeInTheDocument();
    });
  });

  it("renders image for directory when thumbnail is available", () => {
    const dirWithThumb: EntryItem = {
      name: "AlbumWithCover",
      path: "/photos/AlbumWithCover",
      is_dir: true,
      thumbnail_path: "/cache/thumbnails/album_thumb.jpg",
    };

    render(<EntryCard {...defaultProps} entry={dirWithThumb} />);
    expect(screen.getByText("AlbumWithCover")).toBeInTheDocument();
    expect(screen.getByText("📁")).toBeInTheDocument();
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "asset:///cache/thumbnails/album_thumb.jpg");
  });

  it("renders favorite star when isFavorite is true", () => {
    render(<EntryCard {...defaultProps} isFavorite={true} />);
    expect(screen.getByText("⭐")).toBeInTheDocument();
  });

  it("triggers onClick when clicked", () => {
    const onClick = vi.fn();
    render(<EntryCard {...defaultProps} onClick={onClick} />);

    fireEvent.click(screen.getByText("image1.jpg"));
    expect(onClick).toHaveBeenCalled();
  });
});
