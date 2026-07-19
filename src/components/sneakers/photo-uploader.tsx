"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Star, Trash2, Upload, GripVertical, ImageOff } from "lucide-react";
import { PHOTO_CATEGORIES, type PhotoCategory } from "@/lib/constants";
import { ALLOWED_PHOTO_MIME_TYPES, MAX_UPLOAD_BYTES, MAX_PHOTOS_PER_ITEM } from "@/lib/photo-constants";
import { cn } from "@/lib/utils";

export type ExistingPhoto = {
  id: string;
  fileUrl: string;
  thumbnailUrl: string | null;
  category: string;
  displayOrder: number;
  isCover: boolean;
};

type Entry = {
  key: string;
  kind: "existing" | "new";
  id?: string; // present for existing
  previewUrl: string;
  category: PhotoCategory;
  isCover: boolean;
};

let keyCounter = 0;
const nextKey = () => `p${Date.now()}_${keyCounter++}`;

export function PhotoUploader({ existingPhotos = [] }: { existingPhotos?: ExistingPhoto[] }) {
  const [entries, setEntries] = useState<Entry[]>(() =>
    [...existingPhotos]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((p) => ({
        key: p.id,
        kind: "existing" as const,
        id: p.id,
        previewUrl: p.thumbnailUrl || p.fileUrl,
        category: (p.category as PhotoCategory) ?? "OTHER",
        isCover: p.isCover,
      }))
  );
  const [removedExistingIds, setRemovedExistingIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragOverZone, setDragOverZone] = useState(false);

  const filesRef = useRef<Map<string, File>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragKeyRef = useRef<string | null>(null);

  const existingMetaJson = useMemo(
    () =>
      JSON.stringify([
        ...entries
          .filter((e) => e.kind === "existing")
          .map((e, i) => ({ id: e.id, category: e.category, order: i, isCover: e.isCover, remove: false })),
        ...removedExistingIds.map((id) => ({ id, category: "OTHER", order: 0, isCover: false, remove: true })),
      ]),
    [entries, removedExistingIds]
  );

  const newMetaJson = useMemo(
    () =>
      JSON.stringify(
        entries
          .filter((e) => e.kind === "new")
          .map((e, i) => ({ category: e.category, order: i, isCover: e.isCover }))
      ),
    [entries]
  );

  useEffect(() => {
    const dt = new DataTransfer();
    for (const e of entries) {
      if (e.kind === "new") {
        const file = filesRef.current.get(e.key);
        if (file) dt.items.add(file);
      }
    }
    if (fileInputRef.current) fileInputRef.current.files = dt.files;
  }, [entries]);

  function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    const newErrors: string[] = [];
    const accepted: Entry[] = [];

    for (const file of files) {
      if (entries.length + accepted.length >= MAX_PHOTOS_PER_ITEM) {
        newErrors.push(`Only up to ${MAX_PHOTOS_PER_ITEM} photos are supported per sneaker.`);
        break;
      }
      if (!ALLOWED_PHOTO_MIME_TYPES.includes(file.type)) {
        newErrors.push(`"${file.name}" isn't a supported format. Use JPG, PNG, or WebP.`);
        continue;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        newErrors.push(`"${file.name}" is larger than 20MB.`);
        continue;
      }
      const key = nextKey();
      filesRef.current.set(key, file);
      accepted.push({
        key,
        kind: "new",
        previewUrl: URL.createObjectURL(file),
        category: "OTHER",
        isCover: false,
      });
    }

    setErrors(newErrors);
    if (accepted.length > 0) {
      setEntries((prev) => {
        const combined = [...prev, ...accepted];
        if (!combined.some((e) => e.isCover) && combined.length > 0) {
          combined[0] = { ...combined[0], isCover: true };
        }
        return combined;
      });
    }
  }

  function removeEntry(key: string) {
    setEntries((prev) => {
      const entry = prev.find((e) => e.key === key);
      if (entry?.kind === "existing" && entry.id) {
        setRemovedExistingIds((ids) => [...ids, entry.id!]);
      }
      if (entry?.kind === "new") {
        filesRef.current.delete(key);
        URL.revokeObjectURL(entry.previewUrl);
      }
      const next = prev.filter((e) => e.key !== key);
      if (next.length > 0 && !next.some((e) => e.isCover)) {
        next[0] = { ...next[0], isCover: true };
      }
      return next;
    });
  }

  function setCover(key: string) {
    setEntries((prev) => prev.map((e) => ({ ...e, isCover: e.key === key })));
  }

  function setCategory(key: string, category: PhotoCategory) {
    setEntries((prev) => prev.map((e) => (e.key === key ? { ...e, category } : e)));
  }

  function moveEntry(fromKey: string, toKey: string) {
    if (fromKey === toKey) return;
    setEntries((prev) => {
      const fromIdx = prev.findIndex((e) => e.key === fromKey);
      const toIdx = prev.findIndex((e) => e.key === toKey);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        name="photos"
        multiple
        accept={ALLOWED_PHOTO_MIME_TYPES.join(",")}
        className="hidden"
        readOnly
      />
      <input type="hidden" name="existingPhotoMeta" value={existingMetaJson} readOnly />
      <input type="hidden" name="newPhotoMeta" value={newMetaJson} readOnly />

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragOverZone(true);
        }}
        onDragLeave={() => setDragOverZone(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOverZone(false);
          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors",
          dragOverZone
            ? "border-stone-500 bg-stone-100 dark:bg-stone-800"
            : "border-stone-300 hover:bg-stone-50 dark:border-stone-700 dark:hover:bg-stone-900"
        )}
      >
        <Upload className="h-6 w-6 text-stone-400" />
        <p className="text-sm text-stone-600 dark:text-stone-300">
          <span className="font-medium">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-stone-400">JPG, PNG, or WebP — up to 20MB each</p>
        <input
          type="file"
          multiple
          accept={ALLOWED_PHOTO_MIME_TYPES.join(",")}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {errors.length > 0 && (
        <ul className="space-y-1 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-stone-200 py-8 text-stone-400 dark:border-stone-800">
          <ImageOff className="h-6 w-6" />
          <p className="text-xs">No photos yet — a placeholder image will be shown.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {entries.map((entry) => (
            <div
              key={entry.key}
              draggable
              onDragStart={() => {
                dragKeyRef.current = entry.key;
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragKeyRef.current) moveEntry(dragKeyRef.current, entry.key);
              }}
              className="group relative overflow-hidden rounded-xl border border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-900"
            >
              <div className="relative aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={entry.previewUrl} alt="Sneaker photo" className="h-full w-full object-cover" />
                <div className="absolute right-1 top-1 flex gap-1">
                  <button
                    type="button"
                    onClick={() => setCover(entry.key)}
                    title="Set as cover photo"
                    className={cn(
                      "rounded-full p-1.5 shadow",
                      entry.isCover ? "bg-amber-500 text-white" : "bg-white/90 text-stone-500 hover:bg-white"
                    )}
                  >
                    <Star className="h-3.5 w-3.5" fill={entry.isCover ? "currentColor" : "none"} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeEntry(entry.key)}
                    title="Remove photo"
                    className="rounded-full bg-white/90 p-1.5 text-red-500 shadow hover:bg-white"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="absolute left-1 top-1 cursor-grab rounded-full bg-white/80 p-1 text-stone-500 opacity-0 shadow transition-opacity group-hover:opacity-100">
                  <GripVertical className="h-3.5 w-3.5" />
                </div>
                {entry.isCover && (
                  <span className="absolute bottom-1 left-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-medium text-white">
                    Cover
                  </span>
                )}
              </div>
              <select
                value={entry.category}
                onChange={(e) => setCategory(entry.key, e.target.value as PhotoCategory)}
                className="w-full border-t border-stone-200 bg-transparent px-2 py-1.5 text-xs dark:border-stone-800"
              >
                {PHOTO_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
