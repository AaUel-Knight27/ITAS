"use client";

import { useEffect, useState } from "react";

import { api } from "@/lib/api";

interface Category {
  id: number;
  name: string;
}

interface Props {
  category: string;
  difficulty: string;
  onChange: (filters: { category: string; difficulty: string }) => void;
}

const DIFFICULTIES = [
  { value: "", label: "All Levels" },
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

export default function SearchFilters({ category, difficulty, onChange }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    void api
      .get<Category[]>("/courses/categories")
      .then((res) => setCategories(res.data))
      .catch(() => setCategories([]));
  }, []);

  const handleCategory = (value: string) => {
    onChange({ category: value, difficulty });
  };

  const handleDifficulty = (value: string) => {
    onChange({ category, difficulty: value });
  };

  const hasFilters = Boolean(category || difficulty);

  return (
    <div className="space-y-5">
      {hasFilters ? (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-700">Active Filters</p>
            <button
              type="button"
              onClick={() => onChange({ category: "", difficulty: "" })}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {category ? (
              <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
                {category}
                <button type="button" onClick={() => handleCategory("")} className="hover:text-blue-900">
                  ×
                </button>
              </span>
            ) : null}
            {difficulty ? (
              <span className="flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-700">
                {difficulty}
                <button type="button" onClick={() => handleDifficulty("")} className="hover:text-purple-900">
                  ×
                </button>
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-700">Category</p>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => handleCategory("")}
            className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              !category ? "bg-blue-50 font-medium text-blue-700" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            All Categories
          </button>
          {categories.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleCategory(item.name)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                category === item.name ? "bg-blue-50 font-medium text-blue-700" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-700">Difficulty</p>
        <div className="space-y-1">
          {DIFFICULTIES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => handleDifficulty(item.value)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                difficulty === item.value ? "bg-blue-50 font-medium text-blue-700" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
