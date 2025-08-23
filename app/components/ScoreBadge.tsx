import React from "react";

interface ScoreBadgeProps {
  score: number;
}

const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score }) => {
  let badgeClass = "";
  let textClass = "";
  let label = "";

  if (score > 70) {
    badgeClass = "bg-badge-green";
    textClass = "text-green-600";
    label = "Strong";
  } else if (score > 49) {
    badgeClass = "bg-badge-yellow";
    textClass = "text-yellow-600";
    label = "Good Start";
  } else {
    badgeClass = "bg-badge-red";
    textClass = "text-red-600";
    label = "Needs Work";
  }

  return (
    <div className={`px-4 py-2 rounded-full inline-block ${badgeClass}`}>
      <p className={`font-medium text-sm ${textClass}`}>{label}</p>
    </div>
  );
};

export default ScoreBadge;