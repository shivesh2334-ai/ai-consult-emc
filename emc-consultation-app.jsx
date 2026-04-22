import { useState, useCallback, useRef, useEffect } from "react";

// ─── CONSTANTS ──────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, code: "A", label: "Client Profile",       icon: "🏥", color: "#0e7490" },
  { id: 2, code: "B", label: "Tech Assessment",      icon: "💻", color: "#1e40af" },
  { id: 3, code: "C", label: "Pain Points",          icon: "⚡", color: "#7c3aed" },
  { id: 4, code: "D", label: "AI Use Cases",         icon: "🧠", color: "#0f766e" },
  { id: 5, code: "E", label: "Product Selection",    icon: "🔧", color: "#b45309" },
  { id: 6, code: "F", label: "Solution Design",      icon: "📐", color: "#1d4ed8" },
  { id: 7, code: "G", label: "Roadmap",              icon: "🗺️", color: "#065f46" },
  { id: 8, code: "H", label: "Commercial",           icon: "💼", color: "#9f1239" },
  { id: 9, code: "I+J", label: "Regulatory & Sign-off", icon: "✅", color: "#44403c" },
];

const ORG_TYPES = ["Private Hospital","Government Hospital","Diagnostic Chain","Medical College","Clinic Network","Health Insurance / TPA","Pharma","Health Tech","Other"];
const ACCREDITATIONS = ["NABH","JCI","NABL","ISO 27001","None","In Progress"];
const SPECIALTIES = ["Cardiology","Radiology / Imaging","ICU / Critical Care","Emergency Medicine","Nephrology","Oncology","Endocrinology","Neurology","Pulmonology","General Medicine","Surgery / Peri-op","OB & Gynaecology","Pathology / Lab","Pharmacy","Administration","Medical Education","Rural / PHC","Telemedicine","Research / Academia"];
const CLOUD = ["On-premise only","AWS ap-south-1","AWS other region","Azure","GCP","NIC Cloud","Hybrid"];
const FHIR_STATUS = ["FHIR R4 implemented","HL7 v2.x only","Proprietary format","No standard format"];
const AI_MATURITY = [
  { level: 0, label: "Level 0 — No AI tools; largely paper-based" },
  { level: 1, label: "Level 1 — Basic automation only (reminders, templates)" },
  { level: 2, label: "Level 2 — Some third-party AI tools in use" },
  { level: 3, label: "Level 3 — Multiple AI systems; data analytics active" },
  { level: 4, label: "Level 4 — AI-first culture; internal data science team" },
];

const ADMIN_PAINS = [
  "Excessive time on clinical documentation & note-writing",
  "High insurance claim denial / CGHS billing error rate",
  "Manual & error-prone medical coding (ICD-10 / procedure)",
  "Appointment scheduling inefficiency & high no-show rates",
  "Patient enquiry overload on phones / reception",
  "Difficulty generating NABH / DPDPA compliance documents",
  "ABDM integration absent — cannot share records via ABHA",
  "Staff time wasted on repetitive administrative queries",
  "Slow discharge summary / referral letter generation",
  "Inadequate financial forecasting / department budget planning",
];
const CLINICAL_PAINS = [
  "Radiologist shortage causing imaging report delays",
  "High missed-finding rate on X-rays / CT scans",
  "Delayed ECG interpretation & cardiac triage",
  "Inadequate early warning for deteriorating ICU patients",
  "Sepsis / acute event alerts arriving too late",
  "Clinician burnout due to manual note-taking during rounds",
  "Difficulty integrating clinical guidelines into daily practice",
  "Poor medication adherence & patient follow-up",
  "Lack of pre-operative cardiac risk stratification",
  "No structured lab report AI analysis for abnormal patterns",
];
const EDUCATION_PAINS = [
  "Limited telemedicine capability for remote / rural patients",
  "Poor patient communication after teleconsultation",
  "CME delivery for staff is costly, manual & poorly tracked",
  "NEET-PG / postgraduate exam preparation support lacking",
  "No infrastructure for clinical research data collection",
  "Literature review for clinical decisions is time-consuming",
  "Lack of structured patient education materials post-discharge",
  "Language barrier — no Hindi / vernacular patient communication",
];

const ENGAGEMENT_MODELS = [
  { id: "discovery", label: "Discovery & Assessment", desc: "One-time paid scoping (2–4 hrs) + written report", price: "" },
  { id: "project", label: "Project Consulting (Fixed Scope)", desc: "Fixed-fee for defined deliverables — builds, integrations", price: "" },
  { id: "vcto", label: "vCTO / AI Advisor Retainer", desc: "Monthly retainer as Virtual CTO / AI Advisor", price: "" },
  { id: "saas", label: "SaaS Subscription", desc: "Per-seat / per-facility licence for EMC platform products", price: "" },
  { id: "api", label: "API / Usage-based", desc: "Pay-per-call for EMC AI endpoints (ECG, lab, billing)", price: "" },
  { id: "training", label: "Training & CME Programme", desc: "AI-in-medicine workshops for clinical / admin staff", price: "" },
  { id: "resale", label: "White-label Resale", desc: "EMC as integrator/reseller of third-party AI products", price: "" },
];

const REGULATORY = [
  "ABDM / ABHA Integration (NHA mandate)",
  "DPDPA 2023 — Patient Data Privacy Policy",
  "NMC Telemedicine Guidelines 2020",
  "NABH Documentation & Quality Records",
  "CGHS Empanelment / Documentation Audit",
  "IRDAI Health Insurance Claim AI Compliance",
  "FHIR R4 / HL7 Data Interoperability",
  "CDSCO SaMD Classification (AI Medical Device)",
  "Data Residency (AWS ap-south-1 / NIC Cloud)",
];

// ─── API CALL ────────────────────────────────────────────────────────────────
async function callClaude(systemPrompt, userPrompt) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemPrompt,
      userPrompt,
    }),
  });
  if (!res.ok) throw new Error("Claude API request failed");
  const data = await res.json();
  return data.text || "";
}

// ─── STYLES ─────────────────────────────────────────────────────────────────
const S = {
  app: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #060b18 0%, #0d1628 50%, #060b18 100%)",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    color: "#e2e8f0",
    position: "relative",
    overflowX: "hidden",
  },
  header: {
    borderBottom: "1px solid rgba(99,179,237,0.15)",
    padding: "18px 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "rgba(6,11,24,0.9)",
    backdropFilter: "blur(12px)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  logo: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "1.4rem",
    fontWeight: 700,
    letterSpacing: "-0.3px",
    color: "#fff",
  },
  logoSpan: { color: "#38bdf8" },
  badge: {
    fontSize: "0.6rem",
    letterSpacing: "2.5px",
    textTransform: "uppercase",
    color: "#64748b",
    padding: "3px 10px",
    border: "1px solid #1e293b",
    borderRadius: "20px",
  },
  stepBar: {
    display: "flex",
    gap: "0",
    padding: "0 32px",
    background: "rgba(13,22,40,0.95)",
    borderBottom: "1px solid rgba(99,179,237,0.1)",
    overflowX: "auto",
  },
  stepItem: (active, done, color) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    padding: "12px 16px",
    cursor: "pointer",
    borderBottom: active ? `2px solid ${color}` : "2px solid transparent",
    opacity: done ? 1 : active ? 1 : 0.45,
    transition: "all 0.2s",
    minWidth: "90px",
    flexShrink: 0,
  }),
  stepIcon: (active, done, color) => ({
    width: "32px", height: "32px", borderRadius: "50%",
    background: done ? color : active ? `${color}30` : "rgba(255,255,255,0.05)",
    border: `1.5px solid ${active || done ? color : "rgba(255,255,255,0.1)"}`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "0.85rem",
  }),
  stepLabel: (active) => ({
    fontSize: "0.6rem", letterSpacing: "0.5px",
    color: active ? "#e2e8f0" : "#64748b",
    textAlign: "center", lineHeight: 1.3,
  }),
  main: {
    maxWidth: "860px",
    margin: "0 auto",
    padding: "40px 24px 80px",
  },
  card: {
    background: "rgba(15,23,42,0.8)",
    border: "1px solid rgba(99,179,237,0.12)",
    borderRadius: "12px",
    padding: "32px",
    marginBottom: "24px",
    backdropFilter: "blur(8px)",
  },
  sectionTitle: (color = "#38bdf8") => ({
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#fff",
    marginBottom: "6px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  }),
  sectionCode: (color) => ({
    fontSize: "0.75rem",
    fontFamily: "'DM Mono', monospace",
    color: color || "#38bdf8",
    letterSpacing: "2px",
    textTransform: "uppercase",
    marginBottom: "4px",
    opacity: 0.8,
  }),
  label: {
    fontSize: "0.75rem",
    letterSpacing: "1px",
    textTransform: "uppercase",
    color: "#94a3b8",
    marginBottom: "6px",
    display: "block",
    fontFamily: "'DM Mono', monospace",
  },
  input: {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "6px",
    padding: "10px 14px",
    color: "#e2e8f0",
    fontSize: "0.9rem",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "6px",
    padding: "10px 14px",
    color: "#e2e8f0",
    fontSize: "0.9rem",
    outline: "none",
    resize: "vertical",
    minHeight: "80px",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    background: "rgba(15,23,42,0.95)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "6px",
    padding: "10px 14px",
    color: "#e2e8f0",
    fontSize: "0.9rem",
    outline: "none",
    boxSizing: "border-box",
  },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" },
  checkChip: (checked, color = "#0e7490") => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    border: `1px solid ${checked ? color : "rgba(255,255,255,0.08)"}`,
    background: checked ? `${color}20` : "rgba(255,255,255,0.02)",
    color: checked ? "#e2e8f0" : "#94a3b8",
    fontSize: "0.82rem",
    transition: "all 0.15s",
    userSelect: "none",
  }),
  painRow: (sev, color) => ({
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 14px",
    borderRadius: "6px",
    background: sev ? `${color}10` : "rgba(255,255,255,0.02)",
    border: `1px solid ${sev ? `${color}40` : "rgba(255,255,255,0.05)"}`,
    marginBottom: "8px",
    transition: "all 0.15s",
  }),
  severityBtn: (active, c) => ({
    padding: "3px 10px",
    borderRadius: "4px",
    fontSize: "0.7rem",
    fontFamily: "'DM Mono', monospace",
    cursor: "pointer",
    border: `1px solid ${active ? c : "rgba(255,255,255,0.15)"}`,
    background: active ? `${c}30` : "transparent",
    color: active ? c : "#64748b",
    fontWeight: 600,
    letterSpacing: "1px",
    transition: "all 0.12s",
  }),
  btn: (color = "#0e7490", outline = false) => ({
    padding: "12px 28px",
    borderRadius: "8px",
    border: outline ? `1.5px solid ${color}` : "none",
    background: outline ? "transparent" : `linear-gradient(135deg, ${color}, ${color}cc)`,
    color: outline ? color : "#fff",
    fontSize: "0.88rem",
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: "0.5px",
    transition: "all 0.2s",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  }),
  aiBox: {
    background: "linear-gradient(135deg, rgba(14,116,144,0.12), rgba(30,64,175,0.08))",
    border: "1px solid rgba(56,189,248,0.25)",
    borderRadius: "10px",
    padding: "20px 24px",
    marginBottom: "20px",
    position: "relative",
    overflow: "hidden",
  },
  aiBoxLabel: {
    fontSize: "0.62rem",
    letterSpacing: "2px",
    textTransform: "uppercase",
    color: "#38bdf8",
    fontFamily: "'DM Mono', monospace",
    marginBottom: "10px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  loading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    padding: "48px",
    color: "#64748b",
  },
  spinner: {
    width: "40px", height: "40px",
    border: "2px solid rgba(56,189,248,0.2)",
    borderTopColor: "#38bdf8",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  tag: (c) => ({
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "0.62rem",
    fontFamily: "'DM Mono', monospace",
    border: `1px solid ${c}50`,
    background: `${c}15`,
    color: c,
    marginRight: "4px",
    letterSpacing: "0.5px",
    fontWeight: 600,
  }),
  divider: {
    height: "1px",
    background: "rgba(99,179,237,0.08)",
    margin: "24px 0",
  },
  engCard: (active) => ({
    padding: "16px 20px",
    borderRadius: "8px",
    border: `1px solid ${active ? "#38bdf8" : "rgba(255,255,255,0.06)"}`,
    background: active ? "rgba(56,189,248,0.06)" : "rgba(255,255,255,0.02)",
    cursor: "pointer",
    transition: "all 0.15s",
    marginBottom: "10px",
  }),
  progBar: (pct, c) => ({
    height: "4px",
    borderRadius: "2px",
    background: `linear-gradient(90deg, ${c}, ${c}88)`,
    width: `${pct}%`,
    transition: "width 0.6s ease",
  }),
  reportSection: {
    marginBottom: "28px",
    padding: "20px 24px",
    borderRadius: "8px",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
};

// ─── CHECKBOX CHIP ───────────────────────────────────────────────────────────
function Chip({ label, checked, onChange, color = "#0e7490" }) {
  return (
    <div style={S.checkChip(checked, color)} onClick={() => onChange(!checked)}>
      <span style={{ fontSize: "0.7rem" }}>{checked ? "✓" : "○"}</span>
      <span>{label}</span>
    </div>
  );
}

// ─── PAIN ROW ────────────────────────────────────────────────────────────────
function PainRow({ label, value, onChange, color }) {
  const sevs = ["H", "M", "L"];
  const sevColors = { H: "#ef4444", M: "#f97316", L: "#22c55e" };
  return (
    <div style={S.painRow(value, color)}>
      <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked ? "M" : null)}
        style={{ accentColor: color, width: 16, height: 16, flexShrink: 0, cursor: "pointer" }} />
      <span style={{ flex: 1, fontSize: "0.83rem", color: value ? "#e2e8f0" : "#94a3b8" }}>{label}</span>
      {value && (
        <div style={{ display: "flex", gap: "4px" }}>
          {sevs.map(s => (
            <button key={s} style={S.severityBtn(value === s, sevColors[s])}
              onClick={() => onChange(s)}>{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── FIELD ───────────────────────────────────────────────────────────────────
function Field({ label, children, mb = 20 }) {
  return (
    <div style={{ marginBottom: mb }}>
      <label style={S.label}>{label}</label>
      {children}
    </div>
  );
}

// ─── AI INSIGHT BOX ──────────────────────────────────────────────────────────
function AIBox({ title, content, loading }) {
  if (loading) return (
    <div style={S.aiBox}>
      <div style={S.aiBoxLabel}>⟳ AI Analysis Running...</div>
      <div style={{ color: "#64748b", fontSize: "0.85rem" }}>Generating recommendations from your inputs...</div>
    </div>
  );
  if (!content) return null;
  return (
    <div style={S.aiBox}>
      <div style={S.aiBoxLabel}>✦ {title}</div>
      <div style={{ fontSize: "0.88rem", lineHeight: 1.75, color: "#cbd5e1", whiteSpace: "pre-wrap" }}>{content}</div>
    </div>
  );
}

// ─── PRODUCT CARD ────────────────────────────────────────────────────────────
function ProductCard({ name, origin, product, capability, tags, selected, onSelect, tagColors }) {
  return (
    <div style={{
      padding: "14px 16px", borderRadius: "8px", marginBottom: "8px", cursor: "pointer",
      border: `1px solid ${selected ? "#0e7490" : "rgba(255,255,255,0.06)"}`,
      background: selected ? "rgba(14,116,144,0.08)" : "rgba(255,255,255,0.02)",
      transition: "all 0.15s",
    }} onClick={onSelect}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "#e2e8f0" }}>{name}</span>
            <span style={{ fontSize: "0.7rem", color: "#64748b", fontFamily: "'DM Mono', monospace" }}>{origin}</span>
          </div>
          <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginBottom: "6px" }}>{product} — {capability}</div>
          <div>{(tags || []).map((t, i) => <span key={i} style={S.tag(tagColors?.[i] || "#38bdf8")}>{t}</span>)}</div>
        </div>
        <div style={{
          width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0,
          border: `1.5px solid ${selected ? "#0e7490" : "rgba(255,255,255,0.15)"}`,
          background: selected ? "#0e7490" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem",
        }}>{selected ? "✓" : ""}</div>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState(1);
  const [completed, setCompleted] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [aiOutputs, setAiOutputs] = useState({});
  const topRef = useRef(null);

  // ─ FORM STATE ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    // Section A
    orgName: "", orgType: "", accreditation: [], beds: "", locations: "",
    cghs: "", abdm: "", city: "", specialties: [],
    contactName: "", contactEmail: "", contactPhone: "", contactTitle: "",

    // Section B
    his: "", pacs: "", lis: "", telemedicine: "", billing: "", ecg: "",
    cloud: "", fhir: "", beds_month: "", imaging_month: "", labs_month: "",
    dpdpa: "", aiMaturity: "",

    // Section C
    adminPains: {}, clinicalPains: {}, educationPains: {},
    otherPains: "",

    // Section D — populated by AI + user confirmation
    useCasePriorities: {},

    // Section E — product selections
    selectedProducts: {},

    // Section F — architecture
    solutionName: "", buildBuyPartner: {}, integrations: "", dataFlows: "",

    // Section G — roadmap notes
    milestones: "", constraints: "", budget: "",

    // Section H — commercial
    engagements: {}, fees: [{ item: "", amount: "", timeline: "" }],
    paymentTerms: "50/50", validity: "30",

    // Section I+J
    regStatus: {}, consentMechanism: "", nextMeetingDate: "",
    actions: [{ action: "", owner: "", due: "" }],
    clientName: "", clientDesig: "", consultDate: new Date().toISOString().split("T")[0],
  });

  function upd(key, val) { setForm(f => ({ ...f, [key]: val })); }
  function updObj(key, sub, val) { setForm(f => ({ ...f, [key]: { ...f[key], [sub]: val } })); }
  function scrollTop() { topRef.current?.scrollIntoView({ behavior: "smooth" }); }

  // ─ AI CALLS ───────────────────────────────────────────────────────────────
  async function runAI(stepKey, system, user) {
    setLoading(true);
    try {
      const text = await callClaude(system, user);
      setAiOutputs(o => ({ ...o, [stepKey]: text }));
    } catch (e) {
      setAiOutputs(o => ({ ...o, [stepKey]: "⚠ Unable to reach AI. Please check connection and try again." }));
    }
    setLoading(false);
  }

  function buildClientSummary() {
    const pains = [
      ...Object.entries(form.adminPains).filter(([,v])=>v).map(([k,v])=>`[Admin-${v}] ${ADMIN_PAINS[k]}`),
      ...Object.entries(form.clinicalPains).filter(([,v])=>v).map(([k,v])=>`[Clinical-${v}] ${CLINICAL_PAINS[k]}`),
      ...Object.entries(form.educationPains).filter(([,v])=>v).map(([k,v])=>`[Edu-${v}] ${EDUCATION_PAINS[k]}`),
    ];
    return `Organisation: ${form.orgName} (${form.orgType}), ${form.city}
Beds: ${form.beds}, Locations: ${form.locations}
Specialties: ${form.specialties.join(", ")}
AI Maturity: ${form.aiMaturity}
ABDM: ${form.abdm}, CGHS: ${form.cghs}, FHIR: ${form.fhir}
Pain Points: ${pains.join("; ")}`;
  }

  async function analyzeUseCases() {
    await runAI("usecases",
      "You are Dr. Shivesh Kumar, a cardiologist and AI healthcare consultant at EMC Digitals. Provide concrete, prioritised AI use case recommendations for Indian healthcare contexts. Be specific, practical, and reference relevant regulations (ABDM, DPDPA, NABH, CGHS). Format as numbered list with Priority (HIGH/MED/LOW), Use Case name, rationale, and suggested third-party product. Keep each item to 2 lines.",
      `Based on this client profile, recommend the top 6 AI use cases to prioritise:\n${buildClientSummary()}`
    );
  }

  async function generateProductRecommendations() {
    const selected = Object.entries(form.selectedProducts).filter(([,v])=>v).map(([k])=>k).join(", ");
    await runAI("products",
      "You are an AI healthcare integration expert at EMC Digitals. Provide a concise deployment strategy for the selected products in the Indian context. Include integration sequence, key risks, and how EMC adds value as the implementation partner. Be specific and actionable.",
      `Client: ${form.orgName} (${form.orgType}). Selected products: ${selected}. Client context: ${buildClientSummary()}. Provide deployment strategy in 200 words.`
    );
  }

  async function generateSolutionArchitecture() {
    await runAI("architecture",
      "You are a senior healthcare IT architect at EMC Digitals. Design a practical solution architecture for an Indian hospital. Reference ABDM FHIR R4, DPDPA compliance, AWS ap-south-1 data residency, and integration patterns. Be specific about layers and technologies.",
      `Design a solution architecture for: ${form.orgName}\nSolution name: ${form.solutionName}\nSelected products: ${Object.entries(form.selectedProducts).filter(([,v])=>v).map(([k])=>k).join(", ")}\nClient context: ${buildClientSummary()}\nIntegration needs: ${form.integrations}\nKeep to 220 words with clear sections.`
    );
  }

  async function generateRoadmap() {
    await runAI("roadmap",
      "You are a healthcare AI project manager at EMC Digitals. Create a concise phased implementation roadmap with realistic timelines, milestones, and key risks for Indian healthcare AI deployments. Be specific.",
      `Create a phased roadmap for: ${form.orgName}\nBudget indicated: ${form.budget}\nConstraints: ${form.constraints}\nSelected products: ${Object.entries(form.selectedProducts).filter(([,v])=>v).map(([k])=>k).join(", ")}\nTop use cases: ${aiOutputs.usecases?.slice(0,300) || "as per Section D"}\nFormat as Phase 0-4 with timelines and deliverables. 200 words max.`
    );
  }

  async function generateFullReport() {
    await runAI("report",
      "You are Dr. Shivesh Kumar, Founder & CTO of EMC Digitals. Write a professional executive summary for a healthcare AI consultation report. Include: situation summary, recommended AI strategy, key products, phased approach, regulatory considerations, and commercial recommendation. Write in first person as a clinician-technologist. Professional and confident tone.",
      `Generate executive summary for:\nClient: ${form.orgName} (${form.orgType}), ${form.city}\nKey pain points: ${Object.entries({...form.adminPains,...form.clinicalPains,...form.educationPains}).filter(([,v])=>v).length} identified\nUse case analysis: ${aiOutputs.usecases?.slice(0,200) || "see above"}\nDeployment strategy: ${aiOutputs.products?.slice(0,200) || "see above"}\nRoadmap: ${aiOutputs.roadmap?.slice(0,200) || "see above"}\nEngagements selected: ${Object.entries(form.engagements).filter(([,v])=>v).map(([k])=>ENGAGEMENT_MODELS.find(e=>e.id===k)?.label).join(", ")}\nWrite 250 words.`
    );
  }

  function goNext() {
    setCompleted(c => new Set([...c, step]));
    if (step === 3) analyzeUseCases();
    if (step === 5) generateProductRecommendations();
    if (step === 6) generateSolutionArchitecture();
    if (step === 7) generateRoadmap();
    if (step === 9) generateFullReport();
    setStep(s => Math.min(s + 1, 10));
    scrollTop();
  }

  function goPrev() { setStep(s => Math.max(s - 1, 1)); scrollTop(); }

  const pct = Math.round(((step - 1) / 9) * 100);

  // ─ RENDER STEPS ───────────────────────────────────────────────────────────

  function renderStep1() {
    return (
      <div>
        <div style={S.sectionCode("#0e7490")}>Section A · Step 1 of 9</div>
        <div style={S.sectionTitle()}>Client Organisation Profile</div>
        <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "28px" }}>
          Complete the organisation details. This drives all subsequent AI recommendations.
        </p>

        <div style={S.grid2}>
          <Field label="Organisation Name">
            <input style={S.input} value={form.orgName} onChange={e => upd("orgName", e.target.value)} placeholder="e.g. Apollo Hospitals, Dwarka" />
          </Field>
          <Field label="City / State">
            <input style={S.input} value={form.city} onChange={e => upd("city", e.target.value)} placeholder="e.g. New Delhi" />
          </Field>
        </div>

        <Field label="Organisation Type">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {ORG_TYPES.map(t => (
              <Chip key={t} label={t} checked={form.orgType === t} onChange={() => upd("orgType", t)} />
            ))}
          </div>
        </Field>

        <div style={S.grid2}>
          <Field label="No. of Beds">
            <input style={S.input} value={form.beds} onChange={e => upd("beds", e.target.value)} placeholder="e.g. 250" />
          </Field>
          <Field label="No. of Locations / Branches">
            <input style={S.input} value={form.locations} onChange={e => upd("locations", e.target.value)} placeholder="e.g. 3" />
          </Field>
          <Field label="CGHS Empanelled">
            <select style={S.select} value={form.cghs} onChange={e => upd("cghs", e.target.value)}>
              <option value="">Select...</option>
              {["Yes","No","Applied"].map(o => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="ABDM Registered">
            <select style={S.select} value={form.abdm} onChange={e => upd("abdm", e.target.value)}>
              <option value="">Select...</option>
              {["Yes","No","In Progress"].map(o => <option key={o}>{o}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Accreditations (select all)">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {ACCREDITATIONS.map(a => (
              <Chip key={a} label={a} color="#1e40af"
                checked={form.accreditation.includes(a)}
                onChange={v => upd("accreditation", v ? [...form.accreditation, a] : form.accreditation.filter(x => x !== a))} />
            ))}
          </div>
        </Field>

        <Field label="Departments / Specialties In Scope">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {SPECIALTIES.map(s => (
              <Chip key={s} label={s} color="#7c3aed"
                checked={form.specialties.includes(s)}
                onChange={v => upd("specialties", v ? [...form.specialties, s] : form.specialties.filter(x => x !== s))} />
            ))}
          </div>
        </Field>

        <div style={S.divider} />
        <div style={{ ...S.sectionCode(), marginBottom: "12px" }}>Primary Contact</div>
        <div style={S.grid2}>
          <Field label="Contact Name">
            <input style={S.input} value={form.contactName} onChange={e => upd("contactName", e.target.value)} placeholder="Full name" />
          </Field>
          <Field label="Designation">
            <input style={S.input} value={form.contactTitle} onChange={e => upd("contactTitle", e.target.value)} placeholder="e.g. CMO, CIO" />
          </Field>
          <Field label="Email">
            <input style={S.input} type="email" value={form.contactEmail} onChange={e => upd("contactEmail", e.target.value)} placeholder="email@hospital.com" />
          </Field>
          <Field label="Phone">
            <input style={S.input} value={form.contactPhone} onChange={e => upd("contactPhone", e.target.value)} placeholder="+91 XXXXX XXXXX" />
          </Field>
        </div>
      </div>
    );
  }

  function renderStep2() {
    return (
      <div>
        <div style={S.sectionCode("#1e40af")}>Section B · Step 2 of 9</div>
        <div style={S.sectionTitle("#60a5fa")}>Technology & Infrastructure Assessment</div>
        <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "28px" }}>
          Map current digital infrastructure to identify integration points and gaps.
        </p>

        <div style={{ ...S.sectionCode(), marginBottom: "12px" }}>Existing Systems</div>
        {[
          ["his","Hospital Information System (HIS) / EMR","e.g. Eka Care, MocDoc, Practo, Custom"],
          ["pacs","PACS / Radiology Information System","e.g. Agfa, Infinitt, Intelerad"],
          ["lis","Laboratory Information System (LIS)","e.g. Cerner PathNet, Custom LIS"],
          ["billing","Billing / Revenue Cycle System","e.g. Oracle Health, custom"],
          ["telemedicine","Telemedicine Platform","e.g. eSanjeevani, Practo, Custom"],
          ["ecg","ECG / Cardiac Monitoring System","e.g. GE MAC, Schiller, Philips"],
        ].map(([key, label, ph]) => (
          <div key={key} style={S.grid2}>
            <Field label={label} mb={12}>
              <input style={S.input} value={form[key]} onChange={e => upd(key, e.target.value)} placeholder={ph} />
            </Field>
          </div>
        ))}

        <div style={S.divider} />
        <div style={{ ...S.sectionCode(), marginBottom: "12px" }}>Data Infrastructure</div>
        <div style={S.grid2}>
          <Field label="Cloud / Hosting">
            <select style={S.select} value={form.cloud} onChange={e => upd("cloud", e.target.value)}>
              <option value="">Select...</option>
              {CLOUD.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Data Format / Interoperability">
            <select style={S.select} value={form.fhir} onChange={e => upd("fhir", e.target.value)}>
              <option value="">Select...</option>
              {FHIR_STATUS.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Imaging Studies / Month">
            <input style={S.input} value={form.imaging_month} onChange={e => upd("imaging_month", e.target.value)} placeholder="e.g. 500" />
          </Field>
          <Field label="Lab Reports / Month">
            <input style={S.input} value={form.labs_month} onChange={e => upd("labs_month", e.target.value)} placeholder="e.g. 2000" />
          </Field>
        </div>

        <Field label="DPDPA / Data Governance Status">
          <select style={S.select} value={form.dpdpa} onChange={e => upd("dpdpa", e.target.value)}>
            <option value="">Select...</option>
            {["DPDPA policy in place","ISO 27001 certified","Annual pen testing done","NABH IT standards only","None currently"].map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>

        <div style={S.divider} />
        <div style={{ ...S.sectionCode(), marginBottom: "12px" }}>AI Maturity Self-Assessment</div>
        {AI_MATURITY.map(m => (
          <div key={m.level} style={{
            padding: "12px 16px", borderRadius: "8px", marginBottom: "8px", cursor: "pointer",
            border: `1px solid ${form.aiMaturity === String(m.level) ? "#1e40af" : "rgba(255,255,255,0.06)"}`,
            background: form.aiMaturity === String(m.level) ? "rgba(30,64,175,0.1)" : "rgba(255,255,255,0.01)",
            display: "flex", gap: "12px", alignItems: "center",
          }} onClick={() => upd("aiMaturity", String(m.level))}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
              background: form.aiMaturity === String(m.level) ? "#1e40af" : "rgba(255,255,255,0.05)",
              border: "1.5px solid rgba(30,64,175,0.6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.78rem", fontWeight: 700, color: "#93c5fd",
            }}>{m.level}</div>
            <span style={{ fontSize: "0.85rem", color: form.aiMaturity === String(m.level) ? "#e2e8f0" : "#94a3b8" }}>{m.label}</span>
          </div>
        ))}
      </div>
    );
  }

  function renderStep3() {
    const col = (pains, key, color, title) => (
      <div style={{ marginBottom: "28px" }}>
        <div style={{ ...S.sectionCode(color), marginBottom: "10px" }}>● {title}</div>
        {pains.map((p, i) => (
          <PainRow key={i} label={p} value={form[key][i]} color={color}
            onChange={v => updObj(key, i, v)} />
        ))}
      </div>
    );
    return (
      <div>
        <div style={S.sectionCode("#7c3aed")}>Section C · Step 3 of 9</div>
        <div style={S.sectionTitle("#a78bfa")}>Pain Point Identification</div>
        <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "8px" }}>
          Tick each pain point present. Set severity: <span style={{ color: "#ef4444" }}>H</span>igh / <span style={{ color: "#f97316" }}>M</span>edium / <span style={{ color: "#22c55e" }}>L</span>ow.
          AI will analyse these to generate prioritised use cases.
        </p>
        <div style={{ ...S.tag("#7c3aed"), marginBottom: "24px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
          ✦ AI analysis triggers after this step
        </div>
        {col(ADMIN_PAINS, "adminPains", "#0e7490", "Administrative AI Pain Points [Pillar A]")}
        {col(CLINICAL_PAINS, "clinicalPains", "#9f1239", "Clinical & Diagnostic AI Pain Points [Pillar B]")}
        {col(EDUCATION_PAINS, "educationPains", "#7c3aed", "Telemedicine, Education & Research [Pillars C–E]")}
        <Field label="Additional Pain Points / Context">
          <textarea style={S.textarea} value={form.otherPains} onChange={e => upd("otherPains", e.target.value)}
            placeholder="Any other challenges, context or priorities not listed above..." />
        </Field>
      </div>
    );
  }

  function renderStep4() {
    return (
      <div>
        <div style={S.sectionCode("#0f766e")}>Section D · Step 4 of 9</div>
        <div style={S.sectionTitle("#34d399")}>AI Use Case Shortlist</div>
        <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "24px" }}>
          AI-generated use case recommendations based on your pain point profile. Review, then confirm priorities.
        </p>

        <AIBox title="AI-Generated Use Case Recommendations" content={aiOutputs.usecases} loading={loading && !aiOutputs.usecases} />

        {!aiOutputs.usecases && !loading && (
          <div style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
            <p style={{ marginBottom: "16px" }}>Complete Step 3 to generate AI use case recommendations.</p>
            <button style={S.btn("#0f766e")} onClick={analyzeUseCases}>Generate AI Analysis Now</button>
          </div>
        )}

        <div style={S.divider} />
        <Field label="Additional Notes — Use Case Priorities">
          <textarea style={S.textarea} value={form.budget} onChange={e => upd("budget", e.target.value)}
            placeholder="Add any use cases not listed, priority adjustments, or client-specific notes..." />
        </Field>
        <div style={S.grid2}>
          <Field label="Budget Range Indicated">
            <input style={S.input} value={form.budget} onChange={e => upd("budget", e.target.value)}
              placeholder="e.g. ₹15–25 lakhs first year" />
          </Field>
          <Field label="Key Constraints">
            <input style={S.input} value={form.constraints} onChange={e => upd("constraints", e.target.value)}
              placeholder="e.g. legacy HIS, no cloud, staff resistance" />
          </Field>
        </div>
      </div>
    );
  }

  function renderStep5() {
    const products = {
      "Documentation AI": [
        { name: "Microsoft Nuance", origin: "USA · Enterprise", product: "DAX Copilot", capability: "Ambient AI scribe; auto-generates SOAP notes; 2,500+ hospitals globally", tags: ["Global", "FDA", "Deploy"], tagColors: ["#38bdf8", "#f59e0b", "#22c55e"] },
        { name: "Abridge", origin: "USA · Startup", product: "Generative AI Notes", capability: "LLM note generation from doctor-patient dialogue; 150+ enterprise contracts 2025", tags: ["API", "Enterprise"], tagColors: ["#38bdf8", "#a78bfa"] },
        { name: "Eka Care", origin: "India 🇮🇳", product: "EMR + AI Assistant", capability: "ABDM-compliant; 300k+ Indian doctors; ABHA integrated", tags: ["India", "ABDM", "Partner"], tagColors: ["#34d399", "#38bdf8", "#f97316"] },
        { name: "Suki AI", origin: "USA · Voice", product: "Voice Assistant", capability: "Voice-driven EHR documentation; hands-free clinical encounters", tags: ["API", "Voice"], tagColors: ["#38bdf8", "#a78bfa"] },
      ],
      "Chatbots & Patient Engagement": [
        { name: "Haptik (Jio)", origin: "India 🇮🇳 · Enterprise", product: "Healthcare Chatbots", capability: "WhatsApp/web bots; 5M+ govt. queries; HIPAA-compliant", tags: ["India", "WhatsApp", "Deploy"], tagColors: ["#34d399", "#22c55e", "#f97316"] },
        { name: "WACTO", origin: "India 🇮🇳 · SME", product: "WhatsApp Bot", capability: "Appointment booking, prescription reminders; Indian clinic-ready", tags: ["India", "SME-Ready"], tagColors: ["#34d399", "#f97316"] },
        { name: "ASHABot / Khushi Baby", origin: "India 🇮🇳 · Rural", product: "ASHABot (GPT-4)", capability: "WhatsApp AI for ASHA workers; Hindi/Hinglish; Microsoft Research", tags: ["India", "Hindi", "Rural"], tagColors: ["#34d399", "#a78bfa", "#f59e0b"] },
      ],
      "ECG & Cardiology AI": [
        { name: "AliveCor Kardia 12L", origin: "India-launched 2025", product: "Kardia 12L", capability: "12-lead AI ECG for resource-poor settings; 39 algorithms; FDA-cleared; India-launched", tags: ["India", "FDA", "★ Top Pick"], tagColors: ["#34d399", "#f59e0b", "#ef4444"] },
        { name: "Eko Health SENSORA", origin: "USA · FDA-cleared", product: "SENSORA AI", capability: "ECG + heart sound AI; low EF detection; CMS reimbursable", tags: ["FDA", "Reimbursable"], tagColors: ["#f59e0b", "#34d399"] },
        { name: "Tricog Health", origin: "India 🇮🇳 · InstaECG", product: "InstaECG", capability: "Real-time 12-lead ECG AI; 7,000+ India locations; cloud-connected", tags: ["India", "Deploy"], tagColors: ["#34d399", "#f97316"] },
        { name: "Philips Cardiologs", origin: "France/USA · Enterprise", product: "AI ECG Marketplace", capability: "Multi-vendor cloud ECG analysis platform; commercial launch 2025", tags: ["Global", "CE/FDA"], tagColors: ["#38bdf8", "#f59e0b"] },
      ],
      "Radiology & Diagnostics AI": [
        { name: "Qure.ai", origin: "India 🇮🇳 · Global", product: "qXR / qCT / Aira", capability: "World's most deployed health AI; 100+ countries; 18 FDA clearances; Medanta deployed", tags: ["India", "★ Top Pick", "FDA"], tagColors: ["#34d399", "#ef4444", "#f59e0b"] },
        { name: "DeepTek", origin: "India 🇮🇳 · Pune", product: "Augmento / Genki", capability: "Cloud PACS + AI for 22 pathologies; strong Tier 2/3 India fit", tags: ["India", "Deploy"], tagColors: ["#34d399", "#f97316"] },
        { name: "Aidoc aiOS", origin: "USA/Israel · Enterprise", product: "aiOS Platform", capability: "30 FDA clearances; real-time stroke/PE/ICH alerts; 1,000+ sites", tags: ["Global", "FDA", "Enterprise"], tagColors: ["#38bdf8", "#f59e0b", "#a78bfa"] },
        { name: "Niramai Thermalytix", origin: "India 🇮🇳 · Women's", product: "Thermalytix", capability: "AI thermal breast cancer screening; CE-marked; radiation-free; pan-India", tags: ["India", "CE", "Women's"], tagColors: ["#34d399", "#f59e0b", "#f97316"] },
        { name: "Google MedGemma", origin: "USA · Open-weight", product: "MedGemma API", capability: "Open multimodal medical AI; TB AI with Apollo India; build-on API", tags: ["API", "Open-weight"], tagColors: ["#38bdf8", "#a78bfa"] },
      ],
      "ICU & Clinical Decision Support": [
        { name: "Innovaccer", origin: "India/USA 🇮🇳", product: "Provider Copilot", capability: "Clinical copilot in Cerner; DDx, patient summaries; 96k+ providers", tags: ["India", "Partner"], tagColors: ["#34d399", "#f97316"] },
        { name: "Glass Health", origin: "USA · Clinical", product: "Glass AI", capability: "Clinical reasoning AI — DDx drafts, A&P generation; used by residents globally", tags: ["API", "Free Tier"], tagColors: ["#38bdf8", "#34d399"] },
        { name: "UpToDate (Wolters Kluwer)", origin: "USA · Gold Standard", product: "UpToDate AI", capability: "Industry gold-standard clinical reference; used in 95%+ US hospitals", tags: ["Global", "Deploy"], tagColors: ["#38bdf8", "#f97316"] },
      ],
      "Medical Education AI": [
        { name: "AMBOSS", origin: "Germany · Global", product: "AMBOSS AI + QBank", capability: "11,000+ questions; USMLE/MRCP/PLAB; AI MAPPED slides; CME accredited", tags: ["Global", "CME", "MRCP"], tagColors: ["#38bdf8", "#34d399", "#a78bfa"] },
        { name: "BMJ OnExamination", origin: "UK · MRCP", product: "PACES AI Simulator", capability: "AI OSCE simulator for MRCP PACES23 with SimConverse; iterative feedback", tags: ["MRCP", "PACES", "UK"], tagColors: ["#a78bfa", "#38bdf8", "#f59e0b"] },
        { name: "Marrow / DAMS", origin: "India 🇮🇳 · NEET-PG", product: "Marrow AI Platform", capability: "India's #1 NEET-PG prep platform; AI QBank; 200k+ PG aspirants", tags: ["India", "NEET-PG"], tagColors: ["#34d399", "#f97316"] },
        { name: "iatroX", origin: "UK/India 🇮🇳", product: "Adaptive QBank", capability: "MRCP/MRCGP/PLAB adaptive AI QBank; free; spaced repetition", tags: ["Free", "MRCP", "India-linked"], tagColors: ["#34d399", "#a78bfa", "#38bdf8"] },
      ],
    };

    return (
      <div>
        <div style={S.sectionCode("#b45309")}>Section E · Step 5 of 9</div>
        <div style={S.sectionTitle("#fbbf24")}>Third-Party Product Selection</div>
        <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "24px" }}>
          Select products to deploy, integrate, or resell for this client.
          <span style={S.tag("#34d399")}> ★ Top Pick</span> = highest India deployment priority.
        </p>

        {Object.entries(products).map(([cat, prods]) => (
          <div key={cat} style={{ marginBottom: "24px" }}>
            <div style={{ ...S.sectionCode("#b45309"), marginBottom: "10px" }}>◆ {cat}</div>
            {prods.map((p, i) => (
              <ProductCard key={i} {...p}
                selected={!!form.selectedProducts[`${cat}-${p.name}`]}
                onSelect={() => updObj("selectedProducts", `${cat}-${p.name}`,
                  !form.selectedProducts[`${cat}-${p.name}`])} />
            ))}
          </div>
        ))}

        {Object.values(form.selectedProducts).filter(Boolean).length > 0 && (
          <div style={{ ...S.aiBox, marginTop: "20px" }}>
            <div style={S.aiBoxLabel}>✓ Selected Products</div>
            <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
              {Object.entries(form.selectedProducts).filter(([,v])=>v).map(([k]) =>
                k.split("-").slice(1).join("-")).join("  ·  ")}
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderStep6() {
    return (
      <div>
        <div style={S.sectionCode("#1d4ed8")}>Section F · Step 6 of 9</div>
        <div style={S.sectionTitle("#93c5fd")}>Proposed Solution Architecture</div>
        <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "24px" }}>
          Define the solution design. AI will generate architecture notes after this step.
        </p>

        <Field label="Solution / Project Working Name">
          <input style={S.input} value={form.solutionName} onChange={e => upd("solutionName", e.target.value)}
            placeholder='e.g. "Apollo AI Command Centre Phase 1"' />
        </Field>

        <Field label="Systems & APIs to Integrate With">
          <textarea style={S.textarea} value={form.integrations} onChange={e => upd("integrations", e.target.value)}
            placeholder="e.g. Eka Care EMR via FHIR R4, PACS via DICOM, WhatsApp Business API, ABDM gateway..." />
        </Field>

        <Field label="Data Flow & Privacy Considerations">
          <textarea style={S.textarea} value={form.dataFlows} onChange={e => upd("dataFlows", e.target.value)}
            placeholder="e.g. patient data stays on AWS ap-south-1, de-identified before AI processing, DPDPA consent in place..." />
        </Field>

        <div style={{ ...S.sectionCode(), marginBottom: "12px" }}>Build / Buy / Partner Decision by Layer</div>
        {["Frontend / UI", "AI Engine / Models", "EMR / Data Layer", "Chatbot / Communication", "ABDM Compliance", "Reporting & Analytics", "Cloud / Security"].map(layer => (
          <div key={layer} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
            <div style={{ minWidth: "200px", fontSize: "0.83rem", color: "#94a3b8" }}>{layer}</div>
            <div style={{ display: "flex", gap: "8px" }}>
              {["EMC Build", "3rd Party", "Client / Existing"].map(opt => (
                <Chip key={opt} label={opt} color="#1d4ed8"
                  checked={form.buildBuyPartner[layer] === opt}
                  onChange={() => updObj("buildBuyPartner", layer, opt)} />
              ))}
            </div>
          </div>
        ))}

        {aiOutputs.architecture && (
          <AIBox title="AI-Generated Solution Architecture Notes" content={aiOutputs.architecture} />
        )}
        {!aiOutputs.architecture && !loading && step === 6 && (
          <button style={{ ...S.btn("#1d4ed8"), marginTop: "16px" }} onClick={generateSolutionArchitecture}>
            ✦ Generate Architecture Notes
          </button>
        )}
        {loading && step === 6 && <AIBox loading title="" content="" />}
      </div>
    );
  }

  function renderStep7() {
    return (
      <div>
        <div style={S.sectionCode("#065f46")}>Section G · Step 7 of 9</div>
        <div style={S.sectionTitle("#6ee7b7")}>Implementation Roadmap</div>
        <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "24px" }}>
          AI will generate a phased roadmap. Add milestones and constraints below.
        </p>

        <AIBox title="AI-Generated Phased Roadmap" content={aiOutputs.roadmap} loading={loading && !aiOutputs.roadmap} />

        {!aiOutputs.roadmap && !loading && (
          <button style={{ ...S.btn("#065f46"), marginBottom: "20px" }} onClick={generateRoadmap}>
            ✦ Generate Implementation Roadmap
          </button>
        )}

        <Field label="Key Milestones (add / override)">
          <textarea style={S.textarea} value={form.milestones} onChange={e => upd("milestones", e.target.value)}
            placeholder="e.g. Go-live of ECG AI by July 2026, ABDM integration by September 2026..." />
        </Field>

        <div style={S.divider} />
        <div style={{ ...S.sectionCode(), marginBottom: "14px" }}>Action Items</div>
        {form.actions.map((a, i) => (
          <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <input style={{ ...S.input, flex: 2 }} value={a.action}
              onChange={e => { const arr = [...form.actions]; arr[i] = {...arr[i], action: e.target.value}; upd("actions", arr); }}
              placeholder={`Action ${i+1}`} />
            <input style={{ ...S.input, flex: 1 }} value={a.owner}
              onChange={e => { const arr = [...form.actions]; arr[i] = {...arr[i], owner: e.target.value}; upd("actions", arr); }}
              placeholder="Owner" />
            <input style={{ ...S.input, flex: 1 }} type="date" value={a.due}
              onChange={e => { const arr = [...form.actions]; arr[i] = {...arr[i], due: e.target.value}; upd("actions", arr); }} />
          </div>
        ))}
        <button style={S.btn("#065f46", true)}
          onClick={() => upd("actions", [...form.actions, { action: "", owner: "", due: "" }])}>
          + Add Action
        </button>
      </div>
    );
  }

  function renderStep8() {
    return (
      <div>
        <div style={S.sectionCode("#9f1239")}>Section H · Step 8 of 9</div>
        <div style={S.sectionTitle("#fca5a5")}>Commercial Proposal</div>
        <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "24px" }}>
          Select engagement models and complete fee details.
        </p>

        <div style={{ ...S.sectionCode(), marginBottom: "12px" }}>Engagement Models</div>
        {ENGAGEMENT_MODELS.map(m => (
          <div key={m.id} style={S.engCard(!!form.engagements[m.id])}
            onClick={() => updObj("engagements", m.id, !form.engagements[m.id])}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <div style={{
                width: "18px", height: "18px", borderRadius: "4px", flexShrink: 0, marginTop: "2px",
                border: `1.5px solid ${form.engagements[m.id] ? "#9f1239" : "rgba(255,255,255,0.2)"}`,
                background: form.engagements[m.id] ? "#9f1239" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem",
              }}>{form.engagements[m.id] ? "✓" : ""}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.88rem", marginBottom: "2px" }}>{m.label}</div>
                <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{m.desc}</div>
              </div>
              <div style={{ marginLeft: "auto", flexShrink: 0 }}>
                <input style={{ ...S.input, width: "140px", fontSize: "0.83rem" }}
                  onClick={e => e.stopPropagation()}
                  value={form.engagements[`${m.id}_price`] || ""}
                  onChange={e => { e.stopPropagation(); updObj("engagements", `${m.id}_price`, e.target.value); }}
                  placeholder="₹ Amount" />
              </div>
            </div>
          </div>
        ))}

        <div style={S.divider} />
        <div style={{ ...S.sectionCode(), marginBottom: "14px" }}>Fee Schedule</div>
        {form.fees.map((f, i) => (
          <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <input style={{ ...S.input, flex: 3 }} value={f.item}
              onChange={e => { const arr = [...form.fees]; arr[i] = {...arr[i], item: e.target.value}; upd("fees", arr); }}
              placeholder="Line item / deliverable" />
            <input style={{ ...S.input, flex: 1 }} value={f.amount}
              onChange={e => { const arr = [...form.fees]; arr[i] = {...arr[i], amount: e.target.value}; upd("fees", arr); }}
              placeholder="₹ Amount" />
            <input style={{ ...S.input, flex: 1 }} value={f.timeline}
              onChange={e => { const arr = [...form.fees]; arr[i] = {...arr[i], timeline: e.target.value}; upd("fees", arr); }}
              placeholder="Timeline" />
          </div>
        ))}
        <button style={S.btn("#9f1239", true)}
          onClick={() => upd("fees", [...form.fees, { item: "", amount: "", timeline: "" }])}>
          + Add Line Item
        </button>

        <div style={S.divider} />
        <div style={S.grid2}>
          <Field label="Payment Terms">
            <select style={S.select} value={form.paymentTerms} onChange={e => upd("paymentTerms", e.target.value)}>
              {["100% upfront", "50/50 milestone-based", "Monthly retainer", "Custom (see notes)"].map(o => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Quote Validity (days)">
            <input style={S.input} value={form.validity} onChange={e => upd("validity", e.target.value)} placeholder="e.g. 30" />
          </Field>
        </div>
      </div>
    );
  }

  function renderStep9() {
    return (
      <div>
        <div style={S.sectionCode("#44403c")}>Sections I + J · Step 9 of 9</div>
        <div style={S.sectionTitle("#d6d3d1")}>Regulatory Assessment & Sign-off</div>
        <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "24px" }}>
          Complete regulatory checklist and finalise the consultation record.
        </p>

        <div style={{ ...S.sectionCode(), marginBottom: "12px" }}>Regulatory Compliance Checklist</div>
        {REGULATORY.map((r, i) => (
          <div key={i} style={{
            display: "flex", gap: "12px", alignItems: "center", padding: "10px 14px",
            borderRadius: "6px", marginBottom: "8px",
            background: form.regStatus[i] === "Done" ? "rgba(34,197,94,0.05)" : "rgba(255,255,255,0.02)",
            border: `1px solid ${form.regStatus[i] ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.05)"}`,
          }}>
            <span style={{ flex: 1, fontSize: "0.83rem", color: "#94a3b8" }}>{r}</span>
            {["Done", "Partial", "Not started", "N/A"].map(s => (
              <button key={s} style={{
                padding: "3px 10px", borderRadius: "4px", fontSize: "0.7rem",
                cursor: "pointer", border: "1px solid",
                borderColor: form.regStatus[i] === s ? (s === "Done" ? "#22c55e" : s === "Partial" ? "#f97316" : "#ef4444") : "rgba(255,255,255,0.1)",
                background: form.regStatus[i] === s ? (s === "Done" ? "rgba(34,197,94,0.15)" : s === "Partial" ? "rgba(249,115,22,0.15)" : "rgba(239,68,68,0.15)") : "transparent",
                color: form.regStatus[i] === s ? (s === "Done" ? "#22c55e" : s === "Partial" ? "#f97316" : "#ef4444") : "#64748b",
                fontFamily: "'DM Mono', monospace", fontWeight: 600,
              }} onClick={() => updObj("regStatus", i, s)}>{s}</button>
            ))}
          </div>
        ))}

        <Field label="Data Consent & De-identification Approach">
          <textarea style={S.textarea} value={form.consentMechanism}
            onChange={e => upd("consentMechanism", e.target.value)}
            placeholder="Describe consent mechanisms for patient data processing, DPDPA compliance approach..." />
        </Field>

        <div style={S.divider} />
        <div style={{ ...S.sectionCode(), marginBottom: "12px" }}>Follow-up & Sign-off</div>
        <div style={S.grid2}>
          <Field label="Next Meeting Date">
            <input style={S.input} type="date" value={form.nextMeetingDate}
              onChange={e => upd("nextMeetingDate", e.target.value)} />
          </Field>
          <Field label="Consultation Date">
            <input style={S.input} type="date" value={form.consultDate}
              onChange={e => upd("consultDate", e.target.value)} />
          </Field>
          <Field label="Client Signatory Name">
            <input style={S.input} value={form.clientName} onChange={e => upd("clientName", e.target.value)}
              placeholder="Full name of authorising representative" />
          </Field>
          <Field label="Client Signatory Designation">
            <input style={S.input} value={form.clientDesig} onChange={e => upd("clientDesig", e.target.value)}
              placeholder="e.g. CEO, CMO, CIO" />
          </Field>
        </div>

        <div style={{ ...S.aiBox, marginTop: "24px", borderColor: "rgba(251,191,36,0.3)" }}>
          <div style={{ ...S.aiBoxLabel, color: "#fbbf24" }}>⚡ Generate Full Consultation Report</div>
          <p style={{ fontSize: "0.83rem", color: "#94a3b8", marginBottom: "16px" }}>
            Click below to generate a complete AI-written executive summary for this consultation, synthesising all sections.
          </p>
          <button style={S.btn("#b45309")} onClick={generateFullReport} disabled={loading}>
            {loading ? "⟳ Generating..." : "✦ Generate Executive Summary"}
          </button>
        </div>
      </div>
    );
  }

  function renderReport() {
    const painCount = [
      ...Object.values(form.adminPains),
      ...Object.values(form.clinicalPains),
      ...Object.values(form.educationPains),
    ].filter(Boolean).length;

    const highPains = [
      ...Object.values(form.adminPains),
      ...Object.values(form.clinicalPains),
      ...Object.values(form.educationPains),
    ].filter(v => v === "H").length;

    const selectedCount = Object.values(form.selectedProducts).filter(Boolean).length;
    const engCount = Object.entries(form.engagements).filter(([k,v]) => !k.includes("_price") && v).length;

    return (
      <div>
        <div style={{ textAlign: "center", padding: "32px 0 40px" }}>
          <div style={{ fontSize: "0.65rem", letterSpacing: "4px", textTransform: "uppercase", color: "#64748b", marginBottom: "8px", fontFamily: "'DM Mono', monospace" }}>
            EMC DIGITALS · CONSULTATION REPORT
          </div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "2rem", fontWeight: 700, color: "#fff", marginBottom: "6px" }}>
            {form.orgName || "Client Organisation"}
          </div>
          <div style={{ color: "#64748b", fontSize: "0.88rem" }}>{form.orgType} · {form.city} · {form.consultDate}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px", marginBottom: "28px" }}>
          {[
            { label: "Pain Points", value: painCount, sub: `${highPains} high severity`, c: "#ef4444" },
            { label: "AI Products", value: selectedCount, sub: "shortlisted", c: "#38bdf8" },
            { label: "Use Cases", value: "AI-Ranked", sub: "see analysis", c: "#34d399" },
            { label: "Engagements", value: engCount, sub: "models selected", c: "#fbbf24" },
          ].map(m => (
            <div key={m.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "16px", textAlign: "center" }}>
              <div style={{ fontSize: "1.6rem", fontWeight: 700, color: m.c, fontFamily: "'DM Mono', monospace" }}>{m.value}</div>
              <div style={{ fontSize: "0.7rem", letterSpacing: "1px", textTransform: "uppercase", color: "#94a3b8", marginTop: "2px" }}>{m.label}</div>
              <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "2px" }}>{m.sub}</div>
            </div>
          ))}
        </div>

        {aiOutputs.report && (
          <div style={S.reportSection}>
            <div style={{ ...S.sectionCode("#fbbf24"), marginBottom: "12px" }}>✦ Executive Summary</div>
            <div style={{ fontSize: "0.88rem", lineHeight: 1.8, color: "#cbd5e1", whiteSpace: "pre-wrap" }}>{aiOutputs.report}</div>
          </div>
        )}
        {!aiOutputs.report && !loading && (
          <div style={{ textAlign: "center", padding: "24px" }}>
            <button style={S.btn("#b45309")} onClick={generateFullReport}>✦ Generate Executive Summary</button>
          </div>
        )}
        {loading && <AIBox loading title="" content="" />}

        {aiOutputs.usecases && (
          <div style={S.reportSection}>
            <div style={{ ...S.sectionCode("#34d399"), marginBottom: "12px" }}>AI Use Case Recommendations</div>
            <div style={{ fontSize: "0.85rem", lineHeight: 1.8, color: "#cbd5e1", whiteSpace: "pre-wrap" }}>{aiOutputs.usecases}</div>
          </div>
        )}

        {aiOutputs.products && (
          <div style={S.reportSection}>
            <div style={{ ...S.sectionCode("#f97316"), marginBottom: "12px" }}>Product Deployment Strategy</div>
            <div style={{ fontSize: "0.85rem", lineHeight: 1.8, color: "#cbd5e1", whiteSpace: "pre-wrap" }}>{aiOutputs.products}</div>
          </div>
        )}

        {aiOutputs.architecture && (
          <div style={S.reportSection}>
            <div style={{ ...S.sectionCode("#93c5fd"), marginBottom: "12px" }}>Solution Architecture</div>
            <div style={{ fontSize: "0.85rem", lineHeight: 1.8, color: "#cbd5e1", whiteSpace: "pre-wrap" }}>{aiOutputs.architecture}</div>
          </div>
        )}

        {aiOutputs.roadmap && (
          <div style={S.reportSection}>
            <div style={{ ...S.sectionCode("#6ee7b7"), marginBottom: "12px" }}>Implementation Roadmap</div>
            <div style={{ fontSize: "0.85rem", lineHeight: 1.8, color: "#cbd5e1", whiteSpace: "pre-wrap" }}>{aiOutputs.roadmap}</div>
          </div>
        )}

        <div style={S.reportSection}>
          <div style={{ ...S.sectionCode("#d6d3d1"), marginBottom: "12px" }}>Sign-off Details</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "6px", fontFamily: "'DM Mono', monospace", letterSpacing: "1px", textTransform: "uppercase" }}>Client</div>
              <div style={{ fontSize: "0.88rem" }}>{form.clientName || "___________________________"}</div>
              <div style={{ fontSize: "0.82rem", color: "#64748b" }}>{form.clientDesig}</div>
              <div style={{ fontSize: "0.82rem", color: "#64748b" }}>{form.orgName}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "6px", fontFamily: "'DM Mono', monospace", letterSpacing: "1px", textTransform: "uppercase" }}>EMC Digitals</div>
              <div style={{ fontSize: "0.88rem", fontWeight: 600 }}>Dr. Shivesh Kumar</div>
              <div style={{ fontSize: "0.82rem", color: "#64748b" }}>MD · PGDC · PGDE · HEMP (IIM Calcutta)</div>
              <div style={{ fontSize: "0.82rem", color: "#64748b" }}>Founder & CTO, EMC Digitals</div>
            </div>
          </div>
          <div style={{ marginTop: "20px", padding: "12px", borderRadius: "6px", background: "rgba(255,255,255,0.02)", fontSize: "0.75rem", color: "#64748b", fontStyle: "italic" }}>
            Confidential — prepared exclusively for {form.orgName || "the named client"}. Not for distribution without prior written consent of EMC Digitals.
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "32px" }}>
          <button style={S.btn("#0e7490")} onClick={() => window.print()}>🖨 Print / Save as PDF</button>
        </div>
      </div>
    );
  }

  const stepRenderers = [renderStep1, renderStep2, renderStep3, renderStep4, renderStep5, renderStep6, renderStep7, renderStep8, renderStep9];
  const isReport = step === 10;

  return (
    <div style={S.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus, select:focus, textarea:focus { border-color: rgba(56,189,248,0.5) !important; box-shadow: 0 0 0 2px rgba(56,189,248,0.08); }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
        button:hover { filter: brightness(1.1); }
        * { box-sizing: border-box; }
      `}</style>

      <div ref={topRef} />

      {/* HEADER */}
      <div style={S.header}>
        <div style={S.logo}>EMC <span style={S.logoSpan}>Digitals</span></div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {!isReport && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "120px", height: "3px", background: "rgba(255,255,255,0.06)", borderRadius: "2px" }}>
                <div style={S.progBar(pct, "#38bdf8")} />
              </div>
              <span style={{ fontSize: "0.7rem", fontFamily: "'DM Mono', monospace", color: "#64748b" }}>{pct}%</span>
            </div>
          )}
          <div style={S.badge}>AI Consultation Tool</div>
        </div>
      </div>

      {/* STEP BAR */}
      {!isReport && (
        <div style={S.stepBar}>
          {STEPS.map(s => (
            <div key={s.id} style={S.stepItem(step === s.id, completed.has(s.id), s.color)}
              onClick={() => setStep(s.id)}>
              <div style={S.stepIcon(step === s.id, completed.has(s.id), s.color)}>
                {completed.has(s.id) ? "✓" : s.icon}
              </div>
              <div style={S.stepLabel(step === s.id)}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", color: step === s.id ? s.color : "#475569" }}>{s.code}</div>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MAIN */}
      <div style={S.main}>
        <div style={S.card}>
          {isReport ? renderReport() : stepRenderers[step - 1]?.()}
        </div>

        {/* NAV BUTTONS */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
          <button style={S.btn("#334155", true)} onClick={isReport ? () => setStep(9) : goPrev} disabled={step === 1 && !isReport}>
            ← {isReport ? "Back to Form" : "Previous"}
          </button>

          <div style={{ display: "flex", gap: "12px" }}>
            {step === 9 && !isReport && (
              <button style={S.btn("#0f766e")} onClick={() => { generateFullReport(); setCompleted(c => new Set([...c, 9])); setStep(10); scrollTop(); }}>
                ✦ Generate Full Report
              </button>
            )}
            {!isReport && step < 9 && (
              <button style={S.btn(STEPS[step - 1]?.color || "#0e7490")} onClick={goNext} disabled={loading}>
                {loading ? "⟳ AI Analysing..." : "Next →"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
