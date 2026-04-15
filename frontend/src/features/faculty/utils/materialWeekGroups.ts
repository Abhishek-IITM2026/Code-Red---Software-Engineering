type MaterialWithWeek = {
  id: string;
  week?: string | null;
};

export type WeekMaterialGroup<T> = {
  id: string;
  label: string;
  items: T[];
  order: number;
};

const WEEK_PATTERN = /week\s*(\d+)/i;

export const normalizeWeekLabel = (value?: string | null) => {
  const normalized = (value || "").trim();
  if (!normalized) return "General";

  const directMatch = normalized.match(WEEK_PATTERN);
  if (directMatch) return `Week ${Number.parseInt(directMatch[1], 10)}`;
  if (/^\d+$/.test(normalized)) return `Week ${Number.parseInt(normalized, 10)}`;

  return normalized;
};

const getWeekOrder = (label: string) => {
  const match = label.match(WEEK_PATTERN);
  if (match) return Number.parseInt(match[1], 10);
  if (label.toLowerCase() === "general") return Number.MAX_SAFE_INTEGER - 1;
  return Number.MAX_SAFE_INTEGER;
};

export const groupMaterialsByWeek = <T extends MaterialWithWeek>(materials: T[]) => {
  const groups = new Map<string, WeekMaterialGroup<T>>();

  materials.forEach((material) => {
    const label = normalizeWeekLabel(material.week);
    const existing = groups.get(label);
    if (existing) {
      existing.items.push(material);
      return;
    }

    groups.set(label, {
      id: label.toLowerCase().replace(/\s+/g, "-"),
      label,
      items: [material],
      order: getWeekOrder(label),
    });
  });

  return Array.from(groups.values()).sort((left, right) => {
    if (left.order !== right.order) return left.order - right.order;
    return left.label.localeCompare(right.label);
  });
};
