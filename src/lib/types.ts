export type Locale = "ar" | "en";

/** Text available in both supported languages. */
export type Bilingual = Record<Locale, string>;

/** [latitude, longitude] */
export type LatLng = [number, number];

export type HazardType = "missile" | "flood" | "fire" | "road" | "trapped";

export type Severity = "low" | "medium" | "high" | "critical";

export type ResponseTeam =
  | "civil_defense"
  | "ambulance"
  | "water_rescue"
  | "fire_rescue"
  | "police";

/** What residents inside the affected zone should do. */
export type ProtectiveAction = "shelter" | "evacuate" | "avoid";

export type Zone =
  | { kind: "circle"; center: LatLng; radiusM: number }
  | { kind: "polygon"; points: LatLng[] };

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

export interface VulnerableFlags {
  children: boolean;
  elderly: boolean;
  disabled: boolean;
}

export interface SosInput {
  hazard: HazardType | "unknown";
  description: string;
  peopleCount: number;
  vulnerable: VulnerableFlags;
  /** Consent to share vulnerability details with responders. */
  shareVulnerable: boolean;
  position: LatLng;
}

export interface TriageResult {
  hazard: HazardType;
  severity: Severity;
  /** 1 (lowest) – 100 (highest); used to order the response queue. */
  priority: number;
  team: ResponseTeam;
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
  team?: { name: Bilingual; type: ResponseTeam };
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
  teamId?: string;
  /** Estimated travel time of the assigned team, set at dispatch. */
  etaS?: number;
}

/** A dispatcher's decision on a case. */
export type CaseAction =
  | { action: "review"; severity: Severity }
  | { action: "assign"; teamId: string }
  | { action: "on_scene" }
  | { action: "resolve" };

export interface OpsState {
  cases: SosCase[];
  teams: Team[];
  scenarioId: string | null;
}

export interface Route {
  path: LatLng[];
  distanceM: number;
  durationS: number;
  /** false when the routing service was unreachable and a straight line is shown. */
  routed: boolean;
}
