import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { FavoriteSortKey, SortOrder } from "../types";
import { SettingButton } from "./settings/primitives";
import { ModalWindow } from "./ModalWindow";
import { useFavoritesModal } from "../hooks/useFavoritesModal";
import { formatDate } from "../utils/formatUtils";
import "./FavoritesModal.css";

const MODAL_INITIAL_SIZE = { w: 800, h: 600 };
const MODAL_MIN_SIZE = { w: 400, h: 300 };

interface SortableHeaderProps {
  label: string;
  columnKey: FavoriteSortKey;
  currentSortKey: FavoriteSortKey | null;
  sortOrder: SortOrder;
  onSort: (key: FavoriteSortKey) => void;
}

function SortableHeader({
  label,
  columnKey,
  currentSortKey,
  sortOrder,
  onSort,
}: SortableHeaderProps) {
  const isSorted = currentSortKey === columnKey;
  const ariaSort = isSorted
    ? sortOrder === "asc"
      ? "ascending"
      : "descending"
    : "none";

  const handleKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSort(columnKey);
    }
  };

  return (
    <th
      className="sortable-th"
      onClick={() => onSort(columnKey)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="columnheader"
      aria-sort={ariaSort}
    >
      <div className="th-content">
        <span>{label}</span>
        {isSorted && (
          <span className="sort-indicator" aria-hidden="true">
            {sortOrder === "asc" ? " ▲" : " ▼"}
          </span>
        )}
      </div>
    </th>
  );
}

export function FavoritesModal() {
  const { t } = useTranslation();
  const {
    isOpen,
    favorites,
    sortKey,
    sortOrder,
    onSort,
    onClose,
    onRemove,
    onNavigate,
    onOk,
  } = useFavoritesModal();

  if (!isOpen) return null;

  return (
    <ModalWindow
      isOpen={isOpen}
      onClose={onClose}
      title={t("favorites.title")}
      initialSize={MODAL_INITIAL_SIZE}
      minSize={MODAL_MIN_SIZE}
      className="favorites-modal"
      footer={
        <>
          <SettingButton onClick={onClose}>{t("common.cancel")}</SettingButton>
          <SettingButton variant="primary" onClick={onOk}>
            {t("common.ok")}
          </SettingButton>
        </>
      }
    >
      <div className="settings-body">
        <div className="favorites-list-container">
          {favorites.length > 0 ? (
            <table className="favorites-table">
              <thead>
                <tr>
                  <SortableHeader
                    label={t("common.path")}
                    columnKey="path"
                    currentSortKey={sortKey}
                    sortOrder={sortOrder}
                    onSort={onSort}
                  />
                  <SortableHeader
                    label={t("common.date")}
                    columnKey="addedAt"
                    currentSortKey={sortKey}
                    sortOrder={sortOrder}
                    onSort={onSort}
                  />
                  <th>{t("common.operation")}</th>
                </tr>
              </thead>
              <tbody>
                {favorites.map((fav) => (
                  <tr key={fav.path}>
                    <td className="fav-path" title={fav.path}>
                      {fav.path}
                    </td>
                    <td className="fav-date">{formatDate(fav.addedAt)}</td>
                    <td className="fav-actions">
                      <button
                        className="fav-show-btn"
                        onClick={() => onNavigate(fav.path)}
                      >
                        {t("common.show")}
                      </button>
                      <button
                        className="fav-remove-btn"
                        onClick={() => onRemove(fav.path)}
                      >
                        {t("common.delete")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-msg">{t("favorites.empty")}</div>
          )}
        </div>
      </div>
    </ModalWindow>
  );
}
