"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { uploadPhoto, deletePhoto, setPrimaryPhoto, reorderPhotos, updatePhotoAlt } from "./actions";
import { photoUrl } from "@/lib/photo-url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, Trash2, Upload } from "lucide-react";

interface Photo {
  id: string;
  url: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
}

export function PhotoManager({
  menuItemId,
  photos,
  defaultAlt,
}: {
  menuItemId: string;
  photos: Photo[];
  defaultAlt: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sorted = [...photos].sort((a, b) => a.sortOrder - b.sortOrder);

  function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    startTransition(async () => {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.set("file", file);
        fd.set("altText", defaultAlt);
        try {
          await uploadPhoto(menuItemId, fd);
        } catch {
          toast.error(`Failed to upload ${file.name}`);
        }
      }
    });
  }

  function onDropReorder(targetId: string) {
    if (!draggedId || draggedId === targetId) return;
    const ids = sorted.map((p) => p.id);
    const from = ids.indexOf(draggedId);
    const to = ids.indexOf(targetId);
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    startTransition(() => reorderPhotos(menuItemId, ids));
    setDraggedId(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-sm text-muted-foreground transition-colors ${
          isDragOver ? "border-primary bg-primary/5" : "border-border"
        }`}
      >
        <Upload className="size-6" />
        <p>Drag photos here, or click to browse</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {sorted.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {sorted.map((photo) => (
            <div
              key={photo.id}
              draggable
              onDragStart={() => setDraggedId(photo.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDropReorder(photo.id)}
              className="flex flex-col gap-2 rounded-lg border p-2"
            >
              <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoUrl(photo.url, "medium")}
                  alt={photo.altText}
                  className="h-full w-full object-cover"
                />
                {photo.isPrimary && (
                  <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                    Primary
                  </span>
                )}
              </div>
              <Input
                defaultValue={photo.altText}
                onBlur={(e) => {
                  if (e.target.value !== photo.altText) {
                    startTransition(() => updatePhotoAlt(photo.id, menuItemId, e.target.value));
                  }
                }}
                className="h-7 text-xs"
              />
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="icon-sm"
                  variant={photo.isPrimary ? "secondary" : "outline"}
                  disabled={photo.isPrimary}
                  onClick={() => startTransition(() => setPrimaryPhoto(photo.id, menuItemId))}
                  title="Set as primary"
                >
                  <Star className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  onClick={() => startTransition(() => deletePhoto(photo.id, menuItemId))}
                  title="Delete"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      {isPending && <p className="text-xs text-muted-foreground">Working…</p>}
    </div>
  );
}
