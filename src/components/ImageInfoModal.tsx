import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { ImageInfo } from "../types";
import { useSettingsContext } from "../context/SettingsContext";
import "./ImageInfoModal.css";

interface ImageInfoModalProps {
  path: string;
  onClose: () => void;
}

// Sub-component for rendering each info row
const InfoRow = ({ label, value, children }: { label: string, value?: string, children?: React.ReactNode }) => (
  <div className="info-row">
    <label>{label}</label>
    {children || <input readOnly value={value || ""} />}
  </div>
);

export function ImageInfoModal({ path, onClose }: ImageInfoModalProps) {
  const { t } = useTranslation();
  const { autoCalculateColors, updateAutoCalculateColors } = useSettingsContext();
  const [info, setInfo] = useState<ImageInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Position State for dragging
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const fetchInfo = useCallback(async () => {
    try {
      setLoading(true);
      const data = await invoke<ImageInfo>("get_image_info", { 
        path, 
        calculateColors: autoCalculateColors 
      });
      setInfo(data);
    } catch (err) {
      console.error("Failed to get image info:", err);
    } finally {
      setLoading(false);
    }
  }, [path, autoCalculateColors]);

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  // Initial centering
  useEffect(() => {
    if (!loading && info && !isInitialized) {
      const x = (window.innerWidth - 550) / 2;
      const y = (window.innerHeight - 500) / 2;
      setPos({ x, y: Math.max(20, y) });
      setIsInitialized(true);
    }
  }, [loading, info, isInitialized]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging.current) {
      setPos({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  if (loading && !info) return null;
  if (!info) return null;

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB (${bytes.toLocaleString()} ${t('image_info.unit_bytes')})`;
  };

  const memSize = info.width * info.height * (info.bpp / 8);

  // Derived formatting
  const resolutionText = t('image_info.resolution_default');
  const printSizeText = t('image_info.print_size_format', {
    cmW: (info.width / 72 * 2.54).toFixed(2),
    cmH: (info.height / 72 * 2.54).toFixed(2),
    inW: (info.width / 72).toFixed(2),
    inH: (info.height / 72).toFixed(2)
  });

  return (
    <div className="settings-window-overlay image-info-overlay">
      <div 
        className="settings-modal draggable-window image-info-modal" 
        style={{ 
          left: `${pos.x}px`, 
          top: `${pos.y}px`, 
          position: 'fixed',
          margin: 0
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="settings-header window-title-bar" onMouseDown={handleMouseDown}>
          <h2>{t('image_info.title')}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="image-info-body">
          <InfoRow label={t('image_info.file_name')} value={info.name} />
          <InfoRow label={t('image_info.location')} value={info.location} />
          <InfoRow label={t('image_info.full_path')} value={info.full_path} />
          <InfoRow label={t('image_info.format')} value={info.format} />
          
          <InfoRow 
            label={t('image_info.size_orig')} 
            value={`${info.width} x ${info.height} x ${info.bpp} ${t('image_info.unit_bpp')} ( RGB )`} 
          />
          <InfoRow 
            label={t('image_info.size_curr')} 
            value={`${info.width} x ${info.height} x ${info.bpp} ${t('image_info.unit_bpp')} ( RGB )`} 
          />
          
          <InfoRow label={t('image_info.resolution')} value={resolutionText} />
          <InfoRow label={t('image_info.print_size')} value={printSizeText} />

          <InfoRow label={t('image_info.colors')}>
            <div className="color-input-group">
                <input readOnly value={info.colors !== null ? `${info.colors.toLocaleString()} ${t('image_info.unit_colors')}` : "-"} />
                <label className="checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={autoCalculateColors} 
                      onChange={(e) => updateAutoCalculateColors(e.target.checked)} 
                    /> {t('common.auto_calc', { defaultValue: '自動的に計算(A)' })}
                </label>
            </div>
          </InfoRow>

          <InfoRow label={t('image_info.size_on_disk')} value={formatSize(info.size_bytes)} />
          <InfoRow label={t('image_info.size_in_mem')} value={formatSize(memSize)} />
          <InfoRow label={t('image_info.order')} value={info.order} />
          <InfoRow label={t('image_info.modified')} value={info.modified} />
          <InfoRow label={t('image_info.load_time')} value={`${info.load_time_ms} ${t('image_info.unit_ms')}`} />
        </div>

        <div className="settings-footer">
          <button className="settings-button primary" onClick={onClose}>{t('common.ok')}</button>
        </div>
      </div>
    </div>
  );
}
