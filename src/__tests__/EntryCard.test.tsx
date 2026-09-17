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

  it("renders archive badge when is_archive is true", async () => {
    const archiveEntry: EntryItem = {
      name: "manga.zip",
      path: "/comics/manga.zip",
      is_dir: false,
      is_archive: true,
      thumbnail_path: null,
    };

    render(<EntryCard {...defaultProps} entry={archiveEntry} />);
    await waitFor(() => {
      expect(screen.getByText("manga.zip")).toBeInTheDocument();
      expect(screen.getByText("📦 ZIP")).toBeInTheDocument();
    });
  });

  it("renders CBZ label on archive badge for .cbz files", async () => {
    const cbzEntry: EntryItem = {
      name: "comic.cbz",
      path: "/comics/comic.cbz",
      is_dir: false,
      is_archive: true,
      thumbnail_path: null,
    };

    render(<EntryCard {...defaultProps} entry={cbzEntry} />);
    await waitFor(() => {
      expect(screen.getByText("comic.cbz")).toBeInTheDocument();
      expect(screen.getByText("📦 CBZ")).toBeInTheDocument();
    });
  });

  it("isEditing が true の時、入力フィールドが表示され Enter でリネーム完了すること", () => {
    const onRenameComplete = vi.fn();
    render(
      <EntryCard
        {...defaultProps}
        isEditing={true}
        onRenameComplete={onRenameComplete}
      />
    );

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe("image1.jpg");

    fireEvent.change(input, { target: { value: "renamed_image.jpg" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onRenameComplete).toHaveBeenCalledWith("renamed_image.jpg");
  });

  it("isEditing の時、Escapeキーでリネームがキャンセルされること", () => {
    const onRenameCancel = vi.fn();
    render(
      <EntryCard
        {...defaultProps}
        isEditing={true}
        onRenameCancel={onRenameCancel}
      />
    );

    const input = screen.getByRole("textbox");
    fireEvent.keyDown(input, { key: "Escape" });

    expect(onRenameCancel).toHaveBeenCalled();
  });
});


