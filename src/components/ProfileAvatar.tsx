"use client";
import { useState } from "react";
export function ProfileAvatar({ name, src }: { name: string; src: string | null }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const initials = name.trim().split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase();
  return <div className="member-avatar">{src && failedSource !== src ? <img src={src} alt={`Foto de ${name}`} onError={() => setFailedSource(src)} /> : <span aria-label={name}>{initials}</span>}</div>;
}
