"use client";

type ProgressBarProps = {
  percent: number;
  showLabel?: boolean;
  size?: "sm" | "md";
};

export default function ProgressBar({ percent, showLabel = true, size = "md" }: ProgressBarProps) {
  const safePercent = Math.max(0, Math.min(100, Math.round(percent)));
  const isComplete = safePercent === 100;
  
  const barHeight = size === "sm" ? "h-1.5" : "h-2";
  const barColor = isComplete 
    ? "bg-success" 
    : "bg-primary";
  
  return (
    <div className="w-full">
      {showLabel && (
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-medium text-muted-foreground">Progress</span>
          <span className={`font-semibold ${isComplete ? "text-success" : "text-foreground"}`}>
            {safePercent}%
          </span>
        </div>
      )}
      <div className={`${barHeight} w-full overflow-hidden rounded-full bg-muted`}>
        <div 
          className={`${barHeight} ${barColor} rounded-full transition-all duration-500 ease-out`} 
          style={{ width: `${safePercent}%` }} 
        />
      </div>
    </div>
  );
}
