"use client";

interface Props {
  size?: "sm" | "md" | "lg";
  color?: "blue" | "green" | "red" | "yellow" | "gray" | "white";
}

const SIZE_CLASSES: Record<NonNullable<Props["size"]>, string> = {
  sm: "h-4 w-4 border",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-2",
};

const COLOR_CLASSES: Record<NonNullable<Props["color"]>, string> = {
  blue: "border-blue-500",
  green: "border-green-500",
  red: "border-red-500",
  yellow: "border-yellow-500",
  gray: "border-gray-400",
  white: "border-white",
};

export default function LoadingSpinner({ size = "md", color = "blue" }: Props) {
  return (
    <div
      className={`${SIZE_CLASSES[size]} ${COLOR_CLASSES[color]} animate-spin rounded-full border-t-transparent`}
    />
  );
}
