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

export type SosStatus = "queued" | "sending" | "received" | "failed";

export interface SosReport extends SosInput {
  id: string;
  createdAt: number;
  status: SosStatus;
  triage?: TriageResult;
}

export interface Route {
  path: LatLng[];
  distanceM: number;
  durationS: number;
  /** false when the routing service was unreachable and a straight line is shown. */
  routed: boolean;
}
