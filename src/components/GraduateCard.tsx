"use client";

import Link from "next/link";
import { memberTypeLabel } from "@/lib/site";
import { ConnectionAction } from "./ConnectionAction";

interface GraduateCardProps {
  isOwn?: boolean;
  id: number;
  name: string;
  country: string;
  university: string;
  career: string;
  graduationYear: number | null;
  memberType?: string;
  currentProfession: string;
  currentCompany?: string | null;
  photoUrl?: string | null;
}

export function GraduateCard({
  isOwn = false,
  id,
  name,
  country,
  university,
  career,
  graduationYear,
  memberType,
  currentProfession,
  currentCompany,
  photoUrl,
}: GraduateCardProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="ui-person-card bg-white border border-gray-200 rounded-xl p-4 transition-colors group">
      <div className="flex items-start gap-3">
        <Link href={`/miembros/${id}`}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0 overflow-hidden">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/miembros/${id}`}>
            <h3 className="text-gray-900 font-semibold text-base group-hover:text-blue-600 transition-colors truncate">
              {name}
            </h3>
          </Link>
          <p className="text-gray-500 text-sm truncate">
            {currentProfession}
            {currentCompany && ` en ${currentCompany}`}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {country}
            </span>
            <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-md">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 14l9-5-9-5-9 5 9 5z"
                />
              </svg>
              {university}
            </span>
          </div>

          <p className="mt-2 text-xs font-medium text-blue-700">{memberTypeLabel(memberType)}</p>
          <div className="mt-2"><ConnectionAction graduateId={id} isOwn={isOwn} compact /></div>
        </div>
      </div>
    </div>
  );
}
