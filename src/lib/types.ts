export type Locale = "ar" | "en";

/** Text available in both supported languages. */
export type Bilingual = Record<Locale, string>;

/** [latitude, longitude] */
export type LatLng = [number, number];

export type HazardType = "missile" | "flood" | "fire" | "collapse" | "trapped";

export type Severity = "low" | "medium" | "high" | "critical";

export type ResponseTeam = "civil_defense" | "ambulance" | "water_rescue" | "fire_rescue" | "police";

/** What residents inside the affected zone should do. */
export type ProtectiveAction = "shelter" | "evacuate" | "avoid";

export type Zone = { kind: "circle"; center: LatLng; radiusM: number } | { kind: "polygon"; points: LatLng[] };

export interface Incident {
  id: string;
  type: HazardType;
  position: LatLng;
  label: Bilingual;
}

export interface Scenario {
  id: string;
  hazard: HazardType;
  name: Bilingual;
  /** Simulated official alert text pushed to residents in the zone. */
  alert: Bilingual;
  action: ProtectiveAction;
  zone: Zone;
  incidents: Incident[];
  closedRoads: { id: string; label: Bilingual; path: LatLng[] }[];
  /** Map view to fly to when the scenario starts. */
  focus: { center: LatLng; zoom: number };
}

export type SafePlaceKind = "shelter" | "assembly";

export interface SafePlace {
  id: string;
  kind: SafePlaceKind;
  name: Bilingual;
  position: LatLng;
  capacity: number;
}

/** Groups of affected people the resident can count. */
export type AffectedGroup = "elderly" | "disabled" | "children" | "pregnant" | "adults" | "trapped";

export type AffectedCounts = Record<AffectedGroup, number>;

/** How the resident described the situation. */
export type ReportChannel = "text" | "photo" | "voice" | "sos";

/** What the image analysis made of an incident photo. */
export interface ImageAnalysis {
  hazard: HazardType;
  severity: Severity;
  teams: ResponseTeam[];
  findings: Bilingual;
  /** 0–1. */
  confidence: number;
  source: "ai" | "simulated";
}

export interface SosInput {
  hazard: HazardType | "unknown";
  description: string;
  affected: AffectedCounts;
  /** Consent to share the vulnerable groups (all but adults and trapped) with responders. */
  shareVulnerable: boolean;
  position: LatLng;
  channel: ReportChannel;
  /** Downscaled JPEG data URL. */
  photo?: string;
  photoAnalysis?: ImageAnalysis;
}

/** Teams and equipment a case needs. */
export interface ResourcePlan {
  teams: { type: ResponseTeam; count: number }[];
  equipment: Bilingual[];
}

export interface TriageResult {
  hazard: HazardType;
  severity: Severity;
  /** 1 (lowest) – 100 (highest); used to order the response queue. */
  priority: number;
  /** Team types needed, most important first. */
  teams: ResponseTeam[];
  resources: ResourcePlan;
  reasoning: Bilingual;
  source: "ai" | "rules";
}

/** Delivery state of a report on the resident's device. */
export type SosStatus = "queued" | "sending" | "received" | "failed";

/** Where a case stands in the emergency response, as set by dispatchers. */
export type CaseStatus = "new" | "reviewed" | "assigned" | "on_scene" | "resolved";

/** What the resident sees about the response to their report. */
export interface ResponseUpdate {
  id: string;
  status: CaseStatus;
  severity: Severity;
  teams: { name: Bilingual; type: ResponseTeam }[];
  etaS?: number;
}

export interface SosReport extends SosInput {
  id: string;
  createdAt: number;
  status: SosStatus;
  triage?: TriageResult;
  response?: ResponseUpdate;
}

export type TeamStatus = "available" | "dispatched" | "on_scene";

export interface Team {
  id: string;
  name: Bilingual;
  type: ResponseTeam;
  base: LatLng;
  status: TeamStatus;
  caseId?: string;
}

/** A report as held by the operations centre. */
export interface SosCase extends SosInput {
  id: string;
  createdAt: number;
  updatedAt: number;
  origin: "resident" | "demo";
  triage: TriageResult;
  /** Severity confirmed or corrected by a dispatcher. */
  reviewedSeverity?: Severity;
  status: CaseStatus;
  teamIds: string[];
  /** Estimated travel time of the first team to arrive, set at dispatch. */
  etaS?: number;
  assignedAt?: number;
  onSceneAt?: number;
  resolvedAt?: number;
  outcome?: CaseOutcome;
  /** An open case that looks like the same incident. */
  duplicateOf?: string;
  /** Set when this case was merged into another one. */
  mergedInto?: string;
  /** Severity and priority over time, newest last. */
  history: CaseHistoryEntry[];
}

export type CaseOutcome = "rescued" | "transferred" | "false_alarm" | "merged";

export interface CaseHistoryEntry {
  at: number;
  severity: Severity;
  priority: number;
  reason: Bilingual;
}

/** A dispatcher's decision on a case. */
export type CaseAction =
  | { action: "review"; severity: Severity }
  | { action: "assign"; teamId: string }
  | { action: "release"; teamId: string }
  | { action: "on_scene" }
  | { action: "resolve"; outcome: Exclude<CaseOutcome, "merged"> }
  | { action: "reassess"; affected: AffectedCounts; note: string }
  | { action: "merge"; intoId: string }
  | { action: "not_duplicate" };

export interface OpsState {
  cases: SosCase[];
  teams: Team[];
  scenarioIds: string[];
}

export interface Route {
  path: LatLng[];
  distanceM: number;
  durationS: number;
  /** false when the routing service was unreachable and a straight line is shown. */
  routed: boolean;
  /** An alternative chosen to avoid danger zones or closed roads. */
  alternative?: boolean;
}
