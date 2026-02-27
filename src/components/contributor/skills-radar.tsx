import type { ContributorSkills } from "@/lib/data-loader";

interface SkillsRadarProps {
  skills: ContributorSkills;
  tierColor: string;
}

const SKILL_LABELS: { key: keyof ContributorSkills; label: string; description: string }[] = [
  { key: "codeQuality", label: "Code Quality", description: "Approval rate and clean submissions" },
  { key: "consistency", label: "Consistency", description: "Regular activity and approval streaks" },
  { key: "complexity", label: "Complexity", description: "Average PR size and large PR ratio" },
  { key: "security", label: "Security", description: "Security and critical-fix contributions" },
  { key: "velocity", label: "Velocity", description: "Weekly PR throughput" },
  { key: "reliability", label: "Reliability", description: "Low close/self-close rate" },
];

const CX = 50;
const CY = 50;
const RADIUS = 38;
const LEVELS = 4;

function polarToCartesian(angleDeg: number, radius: number): { x: number; y: number } {
  const angle = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CX + radius * Math.cos(angle),
    y: CY + radius * Math.sin(angle),
  };
}

function getPolygonPoints(values: number[]): string {
  const step = 360 / values.length;
  return values
    .map((val, i) => {
      const r = (val / 100) * RADIUS;
      const { x, y } = polarToCartesian(step * i, r);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function getSkillLevel(value: number): string {
  if (value >= 80) return "Expert";
  if (value >= 60) return "Advanced";
  if (value >= 40) return "Intermediate";
  if (value >= 20) return "Beginner";
  return "Novice";
}

function getSkillColor(value: number): string {
  if (value >= 80) return "#10B981";
  if (value >= 60) return "#3B82F6";
  if (value >= 40) return "#F59E0B";
  if (value >= 20) return "#F97316";
  return "#6B7280";
}

export function SkillsRadar({ skills, tierColor }: SkillsRadarProps) {
  const values = SKILL_LABELS.map((s) => skills[s.key]);
  const avgSkill = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const step = 360 / SKILL_LABELS.length;

  return (
    <section className="rounded-xl border border-border bg-card p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Contributor Skills</h3>
        <div className="text-sm text-muted-foreground font-mono">
          Avg: {avgSkill}/100
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        {/* Radar Chart */}
        <div className="flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="h-64 w-64" role="img" aria-label="Skills radar chart">
            {/* Background level rings */}
            {Array.from({ length: LEVELS }, (_, i) => {
              const r = ((i + 1) / LEVELS) * RADIUS;
              const points = SKILL_LABELS.map((_, j) => {
                const { x, y } = polarToCartesian(step * j, r);
                return `${x.toFixed(2)},${y.toFixed(2)}`;
              }).join(" ");
              return (
                <polygon
                  key={i}
                  points={points}
                  fill="none"
                  stroke="rgba(148,163,184,0.12)"
                  strokeWidth="0.3"
                />
              );
            })}

            {/* Axis lines */}
            {SKILL_LABELS.map((_, i) => {
              const { x, y } = polarToCartesian(step * i, RADIUS);
              return (
                <line
                  key={i}
                  x1={CX}
                  y1={CY}
                  x2={x}
                  y2={y}
                  stroke="rgba(148,163,184,0.12)"
                  strokeWidth="0.3"
                />
              );
            })}

            {/* Data polygon */}
            <polygon
              points={getPolygonPoints(values)}
              fill={`${tierColor}22`}
              stroke={tierColor}
              strokeWidth="0.8"
            />

            {/* Data points */}
            {values.map((val, i) => {
              const r = (val / 100) * RADIUS;
              const { x, y } = polarToCartesian(step * i, r);
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="1.2"
                  fill={tierColor}
                />
              );
            })}

            {/* Axis labels */}
            {SKILL_LABELS.map((skill, i) => {
              const { x, y } = polarToCartesian(step * i, RADIUS + 8);
              return (
                <text
                  key={skill.key}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-muted-foreground"
                  fontSize="3.5"
                >
                  {skill.label}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Skill bars */}
        <div className="space-y-3">
          {SKILL_LABELS.map((skill) => {
            const value = skills[skill.key];
            const color = getSkillColor(value);
            const level = getSkillLevel(value);

            return (
              <div key={skill.key}>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="text-sm font-medium">{skill.label}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {skill.description}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-medium"
                      style={{ color }}
                    >
                      {level}
                    </span>
                    <span className="text-sm font-mono font-bold" style={{ color }}>
                      {value}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${value}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
