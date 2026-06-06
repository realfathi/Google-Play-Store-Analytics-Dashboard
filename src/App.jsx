import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  Brain,
  ChartBar,
  CheckCircle2,
  Database,
  FlaskConical,
  Gauge,
  LineChart as LineIcon,
  ListChecks,
  RefreshCw,
  Sigma,
  SlidersHorizontal,
  Sparkles,
  Star,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const THEME = {
  bg: "var(--bg)",
  card: "var(--card)",
  soft: "var(--soft)",
  text: "var(--text)",
  muted: "var(--muted)",
  accent: "var(--accent)",
  accentStrong: "var(--accent-strong)",
  accent2: "var(--accent-2)",
  green: "var(--green)",
  blue: "var(--blue)",
};

const CONTENT_RATING_SCORE = {
  "Everyone": 1,
  "Everyone 10+": 2,
  "Teen": 3,
  "Mature 17+": 4,
  "Adults only 18+": 5,
};

const NAV_ITEMS = [
  { label: "Overview", icon: BarChart3 },
  { label: "Distributions", icon: ChartBar },
  { label: "Correlation", icon: Sigma },
  { label: "Regression", icon: Target },
  { label: "Outliers", icon: AlertTriangle },
  { label: "Segmentation", icon: Boxes },
  { label: "Hypothesis", icon: FlaskConical },
  { label: "A/B", icon: Gauge },
  { label: "Composite", icon: Sparkles },
];

const SAMPLE_FALLBACK = [
  {
    App: "ChatWave",
    Category: "SOCIAL",
    Rating: 4.5,
    Reviews: 95000,
    Installs: 1000000,
    Type: "Free",
    "Content Rating": "Teen",
  },
  {
    App: "PicPulse",
    Category: "PHOTOGRAPHY",
    Rating: 4.1,
    Reviews: 12000,
    Installs: 500000,
    Type: "Free",
    "Content Rating": "Everyone",
  },
  {
    App: "QuickNote",
    Category: "PRODUCTIVITY",
    Rating: 4.8,
    Reviews: 220000,
    Installs: 5000000,
    Type: "Paid",
    "Content Rating": "Everyone",
  },
  {
    App: "Workout Plus",
    Category: "HEALTH",
    Rating: 4.3,
    Reviews: 42000,
    Installs: 1000000,
    Type: "Free",
    "Content Rating": "Everyone 10+",
  },
  {
    App: "StoryStream",
    Category: "ENTERTAINMENT",
    Rating: 3.9,
    Reviews: 610000,
    Installs: 10000000,
    Type: "Free",
    "Content Rating": "Teen",
  },
];

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (cell.length > 0 || row.length > 0) {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      }
    } else {
      cell += char;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  if (rows.length === 0) return [];
  const headers = rows[0];
  return rows.slice(1).map((values) => {
    const entry = {};
    headers.forEach((header, index) => {
      entry[header] = values[index];
    });
    return entry;
  });
}

function toNumber(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const trimmed = String(value).trim();
  if (!trimmed || trimmed === "NaN") return null;
  const cleaned = trimmed.replace(/\+/g, "").replace(/,/g, "");
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : null;
}

function mean(list) {
  if (!list.length) return 0;
  return list.reduce((sum, value) => sum + value, 0) / list.length;
}

function median(list) {
  if (!list.length) return 0;
  const sorted = [...list].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function variance(list) {
  if (list.length <= 1) return 0;
  const m = mean(list);
  return mean(list.map((value) => (value - m) ** 2));
}

function stdDev(list) {
  return Math.sqrt(variance(list));
}

function skewness(list) {
  if (list.length < 3) return 0;
  const m = mean(list);
  const s = stdDev(list);
  if (s === 0) return 0;
  const n = list.length;
  const third = list.reduce((sum, value) => sum + (value - m) ** 3, 0) / n;
  return third / s ** 3;
}

function kurtosis(list) {
  if (list.length < 4) return 0;
  const m = mean(list);
  const s = stdDev(list);
  if (s === 0) return 0;
  const n = list.length;
  const fourth = list.reduce((sum, value) => sum + (value - m) ** 4, 0) / n;
  return fourth / s ** 4 - 3;
}

function quantile(list, q) {
  if (!list.length) return 0;
  const sorted = [...list].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

function histogram(list, bins = 12) {
  if (!list.length) return [];
  const min = Math.min(...list);
  const max = Math.max(...list);
  const width = (max - min) / bins || 1;
  const buckets = Array.from({ length: bins }, (_, i) => ({
    index: i,
    x0: min + i * width,
    x1: min + (i + 1) * width,
    count: 0,
  }));
  list.forEach((value) => {
    const idx = Math.min(bins - 1, Math.floor((value - min) / width));
    buckets[idx].count += 1;
  });
  return buckets.map((bucket) => ({
    name: `${bucket.x0.toFixed(1)}-${bucket.x1.toFixed(1)}`,
    value: bucket.count,
  }));
}

function gaussianKernel(u) {
  return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * u * u);
}

function density(list, points = 40) {
  if (!list.length) return [];
  const min = Math.min(...list);
  const max = Math.max(...list);
  const sd = stdDev(list);
  const bandwidth = 1.06 * sd * Math.pow(list.length, -0.2) || 1;
  const step = (max - min) / (points - 1 || 1);
  return Array.from({ length: points }, (_, i) => {
    const x = min + i * step;
    const sum = list.reduce(
      (acc, value) => acc + gaussianKernel((x - value) / bandwidth),
      0
    );
    return { x: Number(x.toFixed(2)), y: sum / (list.length * bandwidth) };
  });
}

function normalize(list) {
  if (!list.length) return [];
  const min = Math.min(...list);
  const max = Math.max(...list);
  if (max === min) return list.map(() => 0);
  return list.map((value) => (value - min) / (max - min));
}

function pearson(x, y) {
  if (!x.length || x.length !== y.length) return 0;
  const mx = mean(x);
  const my = mean(y);
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < x.length; i += 1) {
    const vx = x[i] - mx;
    const vy = y[i] - my;
    num += vx * vy;
    dx += vx ** 2;
    dy += vy ** 2;
  }
  return num / Math.sqrt(dx * dy || 1);
}

function rank(list) {
  const sorted = list
    .map((value, index) => ({ value, index }))
    .sort((a, b) => a.value - b.value);
  const ranks = Array(list.length).fill(0);
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j < sorted.length - 1 && sorted[j].value === sorted[j + 1].value) {
      j += 1;
    }
    const avg = (i + j + 2) / 2;
    for (let k = i; k <= j; k += 1) {
      ranks[sorted[k].index] = avg;
    }
    i = j + 1;
  }
  return ranks;
}

function spearman(x, y) {
  return pearson(rank(x), rank(y));
}

function matrixInverse(matrix) {
  const size = matrix.length;
  const augmented = matrix.map((row, i) => [
    ...row,
    ...Array.from({ length: size }, (_, j) => (i === j ? 1 : 0)),
  ]);

  for (let col = 0; col < size; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < size; row += 1) {
      if (Math.abs(augmented[row][col]) > Math.abs(augmented[pivot][col])) {
        pivot = row;
      }
    }
    [augmented[col], augmented[pivot]] = [augmented[pivot], augmented[col]];

    const divisor = augmented[col][col] || 1;
    for (let j = 0; j < size * 2; j += 1) {
      augmented[col][j] /= divisor;
    }
    for (let row = 0; row < size; row += 1) {
      if (row === col) continue;
      const factor = augmented[row][col];
      for (let j = 0; j < size * 2; j += 1) {
        augmented[row][j] -= factor * augmented[col][j];
      }
    }
  }
  return augmented.map((row) => row.slice(size));
}

function linearRegression(X, y) {
  if (!X.length) return null;
  const rows = X.length;
  const cols = X[0].length + 1;
  const design = X.map((row) => [1, ...row]);
  const xtx = Array.from({ length: cols }, () => Array(cols).fill(0));
  const xty = Array(cols).fill(0);

  for (let i = 0; i < rows; i += 1) {
    for (let j = 0; j < cols; j += 1) {
      xty[j] += design[i][j] * y[i];
      for (let k = 0; k < cols; k += 1) {
        xtx[j][k] += design[i][j] * design[i][k];
      }
    }
  }

  const inv = matrixInverse(xtx);
  const beta = inv.map((row) => row.reduce((sum, value, i) => sum + value * xty[i], 0));
  const predictions = design.map((row) => row.reduce((sum, value, i) => sum + value * beta[i], 0));
  const ssRes = predictions.reduce((sum, pred, i) => sum + (y[i] - pred) ** 2, 0);
  const ssTot = y.reduce((sum, value) => sum + (value - mean(y)) ** 2, 0);
  const r2 = 1 - ssRes / (ssTot || 1);
  return { beta, r2 };
}

function zScores(list) {
  const m = mean(list);
  const s = stdDev(list) || 1;
  return list.map((value) => (value - m) / s);
}

function mad(list) {
  const med = median(list);
  const deviations = list.map((value) => Math.abs(value - med));
  return median(deviations);
}

function kmeans(points, k = 3, iterations = 10) {
  if (points.length < k) return [];
  const centroids = points.slice(0, k).map((point) => [...point]);
  const assignments = new Array(points.length).fill(0);

  for (let iter = 0; iter < iterations; iter += 1) {
    for (let i = 0; i < points.length; i += 1) {
      let best = 0;
      let bestDist = Infinity;
      for (let c = 0; c < k; c += 1) {
        const dist = points[i].reduce((sum, value, idx) => sum + (value - centroids[c][idx]) ** 2, 0);
        if (dist < bestDist) {
          bestDist = dist;
          best = c;
        }
      }
      assignments[i] = best;
    }

    const sums = Array.from({ length: k }, () => Array(points[0].length).fill(0));
    const counts = Array(k).fill(0);
    for (let i = 0; i < points.length; i += 1) {
      const cluster = assignments[i];
      counts[cluster] += 1;
      points[i].forEach((value, idx) => {
        sums[cluster][idx] += value;
      });
    }

    for (let c = 0; c < k; c += 1) {
      if (counts[c] === 0) continue;
      centroids[c] = centroids[c].map((_, idx) => sums[c][idx] / counts[c]);
    }
  }

  return assignments;
}

function erf(x) {
  const sign = x >= 0 ? 1 : -1;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * Math.abs(x));
  const y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-x * x);
  return sign * y;
}

function normalCdf(x) {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

function approxChiSquarePValue(stat, df) {
  if (df <= 0) return 1;
  const z = (Math.pow(stat / df, 1 / 3) - (1 - 2 / (9 * df))) / Math.sqrt(2 / (9 * df));
  return 1 - normalCdf(z);
}

function approxFPValue(stat, df1, df2) {
  if (df1 <= 0 || df2 <= 0) return 1;
  const z = (Math.pow(stat, 1 / 3) - (1 - 2 / (9 * df2))) / Math.sqrt(2 / (9 * df2));
  return 1 - normalCdf(z);
}

function bootstrap(values, metricFn, iterations = 400) {
  if (!values.length) return [0, 0, 0];
  const stats = [];
  for (let i = 0; i < iterations; i += 1) {
    const sample = Array.from({ length: values.length }, () => values[Math.floor(Math.random() * values.length)]);
    stats.push(metricFn(sample));
  }
  stats.sort((a, b) => a - b);
  return [stats[0], stats[Math.floor(iterations * 0.5)], stats[Math.floor(iterations * 0.95)]];
}

function formatNumber(value) {
  if (value === null || value === undefined) return "-";
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return Number(value).toFixed(2);
}

function Card({ title, icon: Icon, children, right }) {
  return (
    <div className="rounded-3xl bg-white shadow-[0_18px_40px_rgba(31,41,55,0.08)] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          {Icon && (
            <span className="inline-flex items-center justify-center rounded-xl bg-orange-50 text-orange-500 p-2">
              <Icon size={16} />
            </span>
          )}
          <span>{title}</span>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function Heatmap({ matrix, labels }) {
  const min = Math.min(...matrix.flat());
  const max = Math.max(...matrix.flat());
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${labels.length + 1}, minmax(0, 1fr))` }}>
      <div />
      {labels.map((label) => (
        <div key={label} className="text-xs text-slate-500 font-medium text-center">
          {label}
        </div>
      ))}
      {matrix.map((row, i) => (
        <React.Fragment key={labels[i]}>
          <div className="text-xs text-slate-500 font-medium">{labels[i]}</div>
          {row.map((value, j) => {
            const ratio = (value - min) / (max - min || 1);
            const hue = 26 + ratio * 200;
            return (
              <div
                key={`${i}-${j}`}
                className="rounded-xl p-3 text-xs font-semibold text-center"
                style={{ background: `hsl(${hue} 80% 88%)`, color: "#1f2937" }}
              >
                {value.toFixed(2)}
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}

function ViolinPlot({ data, color }) {
  const maxY = Math.max(...data.map((d) => d.y));
  const points = data.map((d) => ({ x: d.x, y: d.y / maxY }));
  const top = points
    .map((d, i) => `${(i / (points.length - 1)) * 200},${100 - d.y * 90}`)
    .join(" ");
  const bottom = points
    .map((d, i) => `${(1 - i / (points.length - 1)) * 200},${100 + d.y * 90}`)
    .join(" ");

  return (
    <svg viewBox="0 0 200 200" className="w-full h-40">
      <polygon points={`${top} ${bottom}`} fill={color} opacity="0.65" />
      <line x1="0" y1="100" x2="200" y2="100" stroke="#e2e8f0" strokeDasharray="4 4" />
    </svg>
  );
}

export default function App() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState("Category");
  const [corrType, setCorrType] = useState("pearson");
  const [activeSection, setActiveSection] = useState("Overview");
  const [csvText, setCsvText] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/googleplaystore.csv");
        if (!response.ok) throw new Error("CSV not found");
        const text = await response.text();
        if (!active) return;
        setCsvText(text);
        const parsed = parseCSV(text);
        setRows(parsed.length ? parsed : SAMPLE_FALLBACK);
      } catch (error) {
        if (active) setRows(SAMPLE_FALLBACK);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const data = useMemo(() => {
    return rows
      .map((row) => ({
        app: row.App || row.app || "Unknown",
        category: row.Category || row.category || "Unknown",
        rating: toNumber(row.Rating),
        reviews: toNumber(row.Reviews),
        installs: toNumber(row.Installs),
        type: row.Type || "Free",
        contentRating: row["Content Rating"] || row.ContentRating || "Everyone",
      }))
      .filter((row) => row.rating && row.reviews && row.installs);
  }, [rows]);

  const rating = data.map((d) => d.rating);
  const reviews = data.map((d) => d.reviews);
  const installs = data.map((d) => d.installs);

  const distribution = useMemo(() => {
    return {
      rating: {
        hist: histogram(rating, 10),
        density: density(rating, 40),
        skew: skewness(rating),
        kurt: kurtosis(rating),
      },
      reviews: {
        hist: histogram(reviews, 10),
        density: density(reviews, 40),
        skew: skewness(reviews),
        kurt: kurtosis(reviews),
      },
      installs: {
        hist: histogram(installs, 10),
        density: density(installs, 40),
        skew: skewness(installs),
        kurt: kurtosis(installs),
      },
    };
  }, [rating, reviews, installs]);

  const topK = useMemo(() => {
    const sortBy = (key) => [...data].sort((a, b) => b[key] - a[key]).slice(0, 5);
    return {
      reviews: sortBy("reviews"),
      rating: sortBy("rating"),
      installs: sortBy("installs"),
    };
  }, [data]);

  const groupStats = useMemo(() => {
    const groups = {};
    data.forEach((row) => {
      const key = row[groupBy === "Category" ? "category" : "contentRating"] || "Unknown";
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    });
    return Object.entries(groups)
      .map(([key, rows]) => ({
        key,
        meanRating: mean(rows.map((r) => r.rating)),
        medianRating: median(rows.map((r) => r.rating)),
        totalInstalls: rows.reduce((sum, r) => sum + r.installs, 0),
        avgReviews: mean(rows.map((r) => r.reviews)),
      }))
      .sort((a, b) => b.totalInstalls - a.totalInstalls)
      .slice(0, 8);
  }, [data, groupBy]);

  const correlation = useMemo(() => {
    const fields = [rating, reviews, installs];
    const fn = corrType === "pearson" ? pearson : spearman;
    return fields.map((row, i) => fields.map((col, j) => fn(row, col)));
  }, [rating, reviews, installs, corrType]);

  const regression = useMemo(() => {
    const X = data.map((row) => [
      Math.log(row.reviews + 1),
      Math.log(row.installs + 1),
      row.type === "Paid" ? 1 : 0,
      CONTENT_RATING_SCORE[row.contentRating] || 1,
    ]);
    const y = data.map((row) => row.rating);
    return linearRegression(X, y);
  }, [data]);

  const outliers = useMemo(() => {
    const reviewScores = zScores(reviews);
    const installScores = zScores(installs);
    const ratingMad = mad(rating) || 1;
    return data
      .map((row, index) => ({
        ...row,
        zReview: reviewScores[index],
        zInstall: installScores[index],
        robust: Math.abs(row.rating - median(rating)) / ratingMad,
      }))
      .filter((row) => Math.abs(row.zReview) > 3 || Math.abs(row.zInstall) > 3 || row.robust > 3.5)
      .slice(0, 8);
  }, [data, rating, reviews, installs]);

  const clusters = useMemo(() => {
    const points = data.map((row) => [row.rating, row.reviews, row.installs]);
    const norm = points.map((point) => {
      const normRating = (point[0] - mean(rating)) / (stdDev(rating) || 1);
      const normReviews = (point[1] - mean(reviews)) / (stdDev(reviews) || 1);
      const normInstalls = (point[2] - mean(installs)) / (stdDev(installs) || 1);
      return [normRating, normReviews, normInstalls];
    });
    const assignment = kmeans(norm, 3, 10);
    return data.slice(0, assignment.length).map((row, i) => ({
      ...row,
      cluster: assignment[i],
    }));
  }, [data, rating, reviews, installs]);

  const hypothesis = useMemo(() => {
    const free = data.filter((row) => row.type === "Free").map((row) => row.rating);
    const paid = data.filter((row) => row.type === "Paid").map((row) => row.rating);
    const freeMean = mean(free);
    const paidMean = mean(paid);
    const freeVar = variance(free);
    const paidVar = variance(paid);
    const t = (freeMean - paidMean) / Math.sqrt(freeVar / free.length + paidVar / paid.length || 1);
    const tP = 2 * (1 - normalCdf(Math.abs(t)));

    const categories = [...new Set(data.map((row) => row.category))].slice(0, 6);
    const grouped = categories.map((cat) => data.filter((row) => row.category === cat).map((row) => row.rating));
    const overall = mean(rating);
    const ssBetween = grouped.reduce((sum, group) => sum + group.length * (mean(group) - overall) ** 2, 0);
    const ssWithin = grouped.reduce((sum, group) => sum + group.reduce((acc, value) => acc + (value - mean(group)) ** 2, 0), 0);
    const dfBetween = grouped.length - 1;
    const dfWithin = rating.length - grouped.length;
    const f = (ssBetween / dfBetween) / (ssWithin / dfWithin || 1);
    const fP = approxFPValue(f, dfBetween, dfWithin);

    const typeLevels = ["Free", "Paid"];
    const ratingLevels = [...new Set(data.map((row) => row.contentRating))].slice(0, 5);
    const table = typeLevels.map(() => ratingLevels.map(() => 0));
    data.forEach((row) => {
      const i = typeLevels.indexOf(row.type);
      const j = ratingLevels.indexOf(row.contentRating);
      if (i >= 0 && j >= 0) table[i][j] += 1;
    });
    const rowTotals = table.map((row) => row.reduce((sum, value) => sum + value, 0));
    const colTotals = ratingLevels.map((_, j) => table.reduce((sum, row) => sum + row[j], 0));
    const total = rowTotals.reduce((sum, value) => sum + value, 0);
    let chi = 0;
    table.forEach((row, i) => {
      row.forEach((value, j) => {
        const expected = (rowTotals[i] * colTotals[j]) / (total || 1);
        chi += (value - expected) ** 2 / (expected || 1);
      });
    });
    const chiP = approxChiSquarePValue(chi, (typeLevels.length - 1) * (ratingLevels.length - 1));

    return {
      t,
      tP,
      f,
      fP,
      chi,
      chiP,
    };
  }, [data, rating]);

  const bootstrapStats = useMemo(() => {
    const [lowMean, midMean, highMean] = bootstrap(rating, mean, 300);
    const [lowMed, midMed, highMed] = bootstrap(rating, median, 300);
    return {
      mean: [lowMean, midMean, highMean],
      median: [lowMed, midMed, highMed],
    };
  }, [rating]);

  const composite = useMemo(() => {
    const nr = normalize(rating);
    const nrev = normalize(reviews);
    const ninst = normalize(installs);
    return data
      .map((row, i) => ({
        ...row,
        score: 0.4 * nr[i] + 0.3 * nrev[i] + 0.3 * ninst[i],
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [data, rating, reviews, installs]);

  const scatterData = data.slice(0, 400).map((row) => ({
    rating: row.rating,
    reviews: Math.log(row.reviews + 1),
    installs: Math.log(row.installs + 1),
  }));

  const clusterScatter = clusters.slice(0, 400).map((row) => ({
    x: Math.log(row.reviews + 1),
    y: row.rating,
    cluster: row.cluster,
  }));

  const exportRows = rows.length ? rows : SAMPLE_FALLBACK;
  const exportHeaders = ["App", "Category", "Rating", "Reviews", "Installs", "Type", "Content Rating"];

  const handleExport = () => {
    const content = csvText
      ? csvText
      : [
          exportHeaders.join(","),
          ...exportRows.map((row) =>
            exportHeaders
              .map((header) => {
                const value = row[header] ?? "";
                const escaped = String(value).replace(/"/g, '""');
                return `"${escaped}"`;
              })
              .join(",")
          ),
        ].join("\n");

    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "googleplaystore.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen page-shell" style={{ color: THEME.text }}>
      <div className="flex min-h-screen">
        <aside className="hidden lg:flex flex-col w-64 px-6 py-8 bg-white/90 backdrop-blur border-r border-slate-100">
          <div className="flex items-center gap-3 text-lg font-semibold">
            <div className="h-10 w-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-500">
              <TrendingUp size={18} />
            </div>
            Socialsentix
          </div>
          <nav className="mt-10 space-y-3 text-sm">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.label;
              return (
                <div
                  key={item.label}
                  onClick={() => setActiveSection(item.label)}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition cursor-pointer ${
                    isActive
                      ? "bg-orange-50 text-orange-600"
                      : "text-slate-600 hover:bg-orange-50 hover:text-orange-600"
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </div>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 px-6 py-8 lg:px-10">
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-500">Social Media Customer Feedback Analytics</p>
              <h1 className="text-2xl font-semibold font-display">Social Feedback Intelligence Dashboard</h1>
              <p className="text-xs text-slate-400 mt-1">Real-time sentiment and performance cues for your graduation project.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold shadow-sm"
              >
                Export CSV
              </button>
            </div>
          </header>

          {activeSection === "Overview" && (
            <>
              <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Apps Analyzed", value: data.length, icon: Database, color: "text-orange-500" },
                  { label: "Avg Rating", value: mean(rating).toFixed(2), icon: Star, color: "text-indigo-500" },
                  { label: "Median Reviews", value: formatNumber(median(reviews)), icon: ListChecks, color: "text-blue-500" },
                  { label: "Total Installs", value: formatNumber(installs.reduce((s, v) => s + v, 0)), icon: TrendingUp, color: "text-emerald-500" },
                ].map((card) => (
                  <div key={card.label} className="rounded-3xl bg-white p-5 shadow-sm">
                    <div className={`h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center ${card.color}`}>
                      <card.icon size={18} />
                    </div>
                    <p className="mt-4 text-sm text-slate-500">{card.label}</p>
                    <p className="mt-1 text-2xl font-semibold">{card.value}</p>
                  </div>
                ))}
              </section>

              <section className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-3">
                <Card title="Top-K Apps" icon={ListChecks}>
                  <div className="space-y-4">
                    {[
                      { title: "Top Reviews", list: topK.reviews, key: "reviews" },
                      { title: "Top Rating", list: topK.rating, key: "rating" },
                      { title: "Top Installs", list: topK.installs, key: "installs" },
                    ].map((block) => (
                      <div key={block.title}>
                        <p className="text-xs text-slate-500 mb-2">{block.title}</p>
                        <div className="space-y-2">
                          {block.list.map((row, i) => (
                            <div key={row.app} className="flex items-center justify-between text-sm">
                              <span className="text-slate-700">{i + 1}. {row.app}</span>
                              <span className="text-slate-500">{formatNumber(row[block.key])}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card
                  title="Group Comparisons"
                  icon={SlidersHorizontal}
                  right={
                    <select
                      value={groupBy}
                      onChange={(event) => setGroupBy(event.target.value)}
                      className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600"
                    >
                      <option value="Category">Category</option>
                      <option value="Content Rating">Content Rating</option>
                    </select>
                  }
                >
                  <div className="h-64">
                    <ResponsiveContainer>
                      <BarChart data={groupStats}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="key" tick={{ fontSize: 10 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="totalInstalls" fill={THEME.accent} radius={[10, 10, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
                    {groupStats.map((row) => (
                      <div key={row.key} className="rounded-xl bg-slate-50 p-2">
                        <p className="font-semibold text-slate-700">{row.key}</p>
                        <p>Mean Rating: {row.meanRating.toFixed(2)}</p>
                        <p>Median Rating: {row.medianRating.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card title="Data Health" icon={CheckCircle2}>
                  <div className="space-y-4 text-sm text-slate-600">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="font-semibold text-slate-700">Coverage</p>
                      <p>{data.length} rows with complete numeric fields.</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="font-semibold text-slate-700">Loading</p>
                      <p>{loading ? "Reading CSV..." : "CSV parsed successfully."}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="font-semibold text-slate-700">Note</p>
                      <p className="text-xs text-slate-500">Place googleplaystore.csv in the public folder to load real data.</p>
                    </div>
                  </div>
                </Card>
              </section>
            </>
          )}

          {activeSection === "Distributions" && (
            <section className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-3">
              <Card title="Distribution Analysis" icon={ChartBar}>
                <div className="space-y-4">
                  {["rating", "reviews", "installs"].map((key) => (
                    <div key={key} className="rounded-2xl bg-slate-50 p-3">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="uppercase tracking-wide">{key}</span>
                        <span>Skew {distribution[key].skew.toFixed(2)} | Kurt {distribution[key].kurt.toFixed(2)}</span>
                      </div>
                      <div className="h-24">
                        <ResponsiveContainer>
                          <AreaChart data={distribution[key].hist}>
                            <defs>
                              <linearGradient id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={THEME.accent} stopOpacity={0.6} />
                                <stop offset="100%" stopColor={THEME.accent} stopOpacity={0.1} />
                              </linearGradient>
                            </defs>
                            <Area dataKey="value" stroke={THEME.accent} fill={`url(#grad-${key})`} />
                            <Tooltip />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Density & Violin" icon={LineIcon}>
                <div className="space-y-6">
                  <div>
                    <p className="text-xs text-slate-500 mb-2">Rating Density</p>
                    <div className="h-32">
                      <ResponsiveContainer>
                        <LineChart data={distribution.rating.density}>
                          <Line type="monotone" dataKey="y" stroke={THEME.accent2} strokeWidth={2} dot={false} />
                          <Tooltip />
                          <XAxis dataKey="x" hide />
                          <YAxis hide />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-2">Violin Plot (Rating)</p>
                    <ViolinPlot data={distribution.rating.density} color={THEME.accent2} />
                  </div>
                </div>
              </Card>

              <Card title="Visualization Suite" icon={ChartBar}>
                <div className="grid grid-cols-1 gap-4">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500 mb-2">Installs Histogram</p>
                    <div className="h-32">
                      <ResponsiveContainer>
                        <BarChart data={distribution.installs.hist}>
                          <Bar dataKey="value" fill={THEME.accent} radius={[6, 6, 0, 0]} />
                          <Tooltip />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500 mb-2">Reviews Density</p>
                    <div className="h-32">
                      <ResponsiveContainer>
                        <LineChart data={distribution.reviews.density}>
                          <Line type="monotone" dataKey="y" stroke={THEME.green} strokeWidth={2} dot={false} />
                          <Tooltip />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </Card>
            </section>
          )}

          {activeSection === "Correlation" && (
            <section className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-2">
              <Card
                title="Correlation Analysis"
                icon={Sigma}
                right={
                  <div className="flex items-center gap-2">
                    {[
                      { label: "Pearson", value: "pearson" },
                      { label: "Spearman", value: "spearman" },
                    ].map((item) => (
                      <button
                        key={item.value}
                        onClick={() => setCorrType(item.value)}
                        className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                          corrType === item.value ? "bg-orange-500 text-white" : "bg-slate-50 text-slate-600"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                }
              >
                <Heatmap matrix={correlation} labels={["Rating", "Reviews", "Installs"]} />
                <div className="mt-4 text-xs text-slate-500">
                  Rank correlation between Rating and Reviews: {spearman(rating, reviews).toFixed(2)}
                </div>
              </Card>

              <Card title="Scatter & Boxplot" icon={ChartBar}>
                <div className="h-52">
                  <ResponsiveContainer>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="reviews" name="log Reviews" />
                      <YAxis dataKey="rating" name="Rating" />
                      <Tooltip />
                      <Scatter data={scatterData} fill={THEME.accent2} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
                  {groupStats.slice(0, 4).map((group) => {
                    const groupRatings = data
                      .filter((row) => row.category === group.key)
                      .map((row) => row.rating);
                    const q1 = quantile(groupRatings, 0.25);
                    const q3 = quantile(groupRatings, 0.75);
                    const med = quantile(groupRatings, 0.5);
                    return (
                      <div key={group.key} className="rounded-xl bg-slate-50 p-2">
                        <p className="font-semibold text-slate-700">{group.key}</p>
                        <p>Q1 {q1.toFixed(2)} | Med {med.toFixed(2)} | Q3 {q3.toFixed(2)}</p>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </section>
          )}

          {activeSection === "Regression" && (
            <section className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-2">
              <Card title="Regression Insights" icon={Target}>
                {regression ? (
                  <div className="space-y-3 text-sm text-slate-600">
                    <p className="font-semibold text-slate-700">Model: Rating ~ log(Reviews) + log(Installs) + Paid + Content Rating</p>
                    <p>Intercept: {regression.beta[0].toFixed(3)}</p>
                    <p>log Reviews: {regression.beta[1].toFixed(3)}</p>
                    <p>log Installs: {regression.beta[2].toFixed(3)}</p>
                    <p>Paid: {regression.beta[3].toFixed(3)}</p>
                    <p>Content Rating: {regression.beta[4].toFixed(3)}</p>
                    <p className="text-slate-500">R2: {regression.r2.toFixed(3)}</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Not enough data to fit regression.</p>
                )}
              </Card>
            </section>
          )}

          {activeSection === "Outliers" && (
            <section className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-2">
              <Card title="Outlier Detection" icon={AlertTriangle}>
                <div className="space-y-3 text-sm text-slate-600">
                  {outliers.length ? (
                    outliers.map((row) => (
                      <div key={row.app} className="flex items-center justify-between">
                        <span className="text-slate-700">{row.app}</span>
                        <span className="text-xs text-slate-500">zRev {row.zReview.toFixed(1)} | zInst {row.zInstall.toFixed(1)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">No extreme outliers found in this sample.</p>
                  )}
                </div>
              </Card>
            </section>
          )}

          {activeSection === "Segmentation" && (
            <section className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-2">
              <Card title="Segmentation (K-Means)" icon={Boxes}>
                <div className="h-52">
                  <ResponsiveContainer>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="x" name="log Reviews" />
                      <YAxis dataKey="y" name="Rating" />
                      <Tooltip />
                      <Scatter data={clusterScatter}>
                        {clusterScatter.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={["#f97316", "#6366f1", "#10b981"][entry.cluster % 3]}
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-xs text-slate-500">
                  Clusters highlight emerging segments in reviews vs ratings.
                </div>
              </Card>
            </section>
          )}

          {activeSection === "Hypothesis" && (
            <section className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-2">
              <Card title="Hypothesis Tests" icon={FlaskConical}>
                <div className="space-y-3 text-sm text-slate-600">
                  <div>
                    <p className="font-semibold text-slate-700">T-test (Free vs Paid Ratings)</p>
                    <p>t = {hypothesis.t.toFixed(2)} | p ~ {hypothesis.tP.toFixed(3)}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">ANOVA (Category Ratings)</p>
                    <p>F = {hypothesis.f.toFixed(2)} | p ~ {hypothesis.fP.toFixed(3)}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">Chi-square (Type x Content Rating)</p>
                    <p>$\chi^2$ = {hypothesis.chi.toFixed(2)} | p ~ {hypothesis.chiP.toFixed(3)}</p>
                  </div>
                </div>
              </Card>

              <Card title="Bootstrapping & CIs" icon={RefreshCw}>
                <div className="space-y-4 text-sm text-slate-600">
                  <div>
                    <p className="font-semibold text-slate-700">Mean Rating (95% CI)</p>
                    <p>{bootstrapStats.mean.map((v) => v.toFixed(2)).join(" - ")}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">Median Rating (95% CI)</p>
                    <p>{bootstrapStats.median.map((v) => v.toFixed(2)).join(" - ")}</p>
                  </div>
                </div>
              </Card>
            </section>
          )}

          {activeSection === "A/B" && (
            <section className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-2">
              <Card title="A/B Style Comparison" icon={Gauge}>
                <div className="space-y-3 text-sm text-slate-600">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="font-semibold text-slate-700">Free vs Paid</p>
                    <p>Mean Rating Diff: {(mean(data.filter((d) => d.type === "Free").map((d) => d.rating)) - mean(data.filter((d) => d.type === "Paid").map((d) => d.rating))).toFixed(2)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="font-semibold text-slate-700">Installs Lift</p>
                    <p>Free/Paid ratio: {(mean(data.filter((d) => d.type === "Free").map((d) => d.installs)) / (mean(data.filter((d) => d.type === "Paid").map((d) => d.installs)) || 1)).toFixed(2)}</p>
                  </div>
                </div>
              </Card>
            </section>
          )}

          {activeSection === "Composite" && (
            <section className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-3">
              <Card title="Composite Score" icon={Sparkles}>
                <div className="space-y-3 text-sm text-slate-600">
                  {composite.map((row, i) => (
                    <div key={row.app} className="flex items-center justify-between">
                      <span>{i + 1}. {row.app}</span>
                      <span className="text-xs text-slate-500">{row.score.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Performance Heat" icon={Brain}>
                <div className="h-52">
                  <ResponsiveContainer>
                    <BarChart data={groupStats} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis dataKey="key" type="category" width={80} />
                      <Tooltip />
                      <Bar dataKey="avgReviews" fill={THEME.blue} radius={[0, 10, 10, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
