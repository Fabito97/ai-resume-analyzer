
// ─── Shared Link Type ───────────────────────────────────────────────────────
// Reusable across contact items, project links, and certifications.
// At least one of label or url must be present.
//   - label only  → displays label, no hyperlink (e.g. phone number)
//   - url only    → displays the url as text, links to it
//   - both        → displays label, links to url

interface Link {
  label?: string;
  url?: string;
}

// ─── Resume Blocks ──────────────────────────────────────────────────────────
// A resume is made up of an ordered array of blocks.
// Each block has a type, a name (the display heading, fully customizable),
// an order (position in the resume), and a data object whose shape
// depends on the block type.
//
// Block types:
//   header        → name + job title at the top
//   contact       → array of Link items (phone, email, LinkedIn, etc.)
//   summary       → a text paragraph
//   skills        → grouped by category
//   experience    → array of job entries
//   education     → array of education entries
//   projects      → array of project entries (links are separate from name)
//   certification → array of Link items (label = cert name, url = cert link)
//   additional    → catch-all for anything that doesn't fit above

// ── Block Data Types ─────────────────────────────────────────────────────────

interface HeaderData {
  name: string;
  title: string;
}

// Contact is just an array of Links — reuses the shared Link type directly
type ContactData = Link[];

interface SummaryData {
  text: string;
}

interface SkillCategory {
  category: string;
  skills: string[];
}

type SkillsData = SkillCategory[];

interface ExperienceEntry {
  company: string;
  companyUrl?: string;  // optional link on the company name
  title: string;
  dates: string;
  bullets: string[];
}

type ExperienceData = ExperienceEntry[];

interface EducationEntry {
  institution: string;
  degree: string;
  dates: string;
  bullets?: string[];   // optional details like GPA, achievements
}

type EducationData = EducationEntry[];

interface ProjectEntry {
  name: string;
  description: string;
  technologies: string[];
  links: Link[];        // separate from name — can have GitHub, Live Demo, etc.
  bullets?: string[];
}

type ProjectsData = ProjectEntry[];

// Certifications are just Links — label is the cert name, url is the cert link
type CertificationData = Link[];

// Catch-all for non-standard sections like volunteering, awards, publications
interface AdditionalEntry {
  title?: string;
  subtitle?: string;
  dates?: string;
  bullets?: string[];
  links?: Link[];
}

type AdditionalData = AdditionalEntry[];

// ── Block Type Union ─────────────────────────────────────────────────────────
// Each block is typed so that data matches the block type.
// The `name` field is the display heading — fully customizable by the user.
// e.g. "Work Experience", "Professional Experience", "Career History" — all valid.

type ResumeBlock =
  | { type: "header";        name: string; order: number; data: HeaderData }
  | { type: "contact";       name: string; order: number; data: ContactData }
  | { type: "summary";       name: string; order: number; data: SummaryData }
  | { type: "skills";        name: string; order: number; data: SkillsData }
  | { type: "experience";    name: string; order: number; data: ExperienceData }
  | { type: "education";     name: string; order: number; data: EducationData }
  | { type: "projects";      name: string; order: number; data: ProjectsData }
  | { type: "certification"; name: string; order: number; data: CertificationData }
  | { type: "additional";    name: string; order: number; data: AdditionalData };

// ── Structured Resume ────────────────────────────────────────────────────────
// The full resume as returned by the AI during optimization.
// This is what gets stored as resumeText (serialized as JSON)
// and what generateResumeHtml() takes as input.

interface StructuredResume {
  blocks: ResumeBlock[];
}

// ─── Job Application ────────────────────────────────────────────────────────
// Represents a single job application. Holds the job context entered by the
// user. All resume versions for this application link back via jobId.
// KV key: jobApplication:{jobId}

interface JobApplication {
  jobId: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
  resumeVersionMeta?: ResumeVersionMeta[]
}
interface ResumeVersionMeta {
  version: number;
  source: "upload" | "optimized";
  createdAt: string;
  overallScore?: number;  // quick access to score without reading full resume
  resumePath: string;  // Add this if you need direct access to the file
  imagePath: string;   // Add this if you need the image
}
// ─── Resume ──────────────────────────────────────────────────────────────────
// A committed checkpoint of the resume for a given JobApplication.
// A new Resume is only created when the user explicitly confirms
// (e.g. "Reanalyze" or "Save version") — not on every chat message.
//
// - v1 is always the original uploaded resume (source: "upload")
// - subsequent versions come from optimization (source: "optimized")
// - resumeText is null on v1 (came from file upload),
//   populated on optimized versions as a serialized StructuredResume JSON
// - resumePath and imagePath always exist — optimized versions
//   get converted to PDF + image before being stored
//
// KV key: resume:{jobId}:v{version}

interface Resume {
  id: string;                // unique identifier, e.g. resume:{jobId}:v1
  jobId: string;             // links back to JobApplication
  version: number;
  resumePath: string;        // PDF file path in Puter FS
  imagePath: string;         // Image file path in Puter FS
  resumeText: StructuredResume | null; // structured resume (null for v1 uploads)
  source: "upload" | "optimized";
  feedback: Feedback | null; // null until analysis is run
  createdAt?: string;
  status: "pending" | "failed" | "complete"
}

interface FeedbackEntry {
  id: string;
  feedback: Feedback | null;
  status: "pending" | "failed" | "complete";
  createdAt: string;
}
// ─── Feedback ────────────────────────────────────────────────────────────────
// Structured analysis result returned by the AI after analyzing a resume.

interface FeedbackTip {
  type: "good" | "improve";
  tip: string;
  explanation: string;
}

interface Feedback {
  overallScore: number;
  ATS: {
    score: number;
    tips: FeedbackTip[];
  };
  toneAndStyle: {
    score: number;
    tips: FeedbackTip[];
  };
  content: {
    score: number;
    tips: FeedbackTip[];
  };
  structure: {
    score: number;
    tips: FeedbackTip[];
  };
  skills: {
    score: number;
    tips: FeedbackTip[];
  };
}

// ─── Chat / Optimization ────────────────────────────────────────────────────
// Message — a single message in the optimization chat.
// ChatSession — the live scratchpad for an optimization conversation.
//   - messages: the full chat history
//   - currentResume: the latest StructuredResume, updates freely
//     as the conversation goes on. Does NOT create a new Resume version.
//     A Resume version is only created when the user confirms.
//
// KV key: chatSession:{jobId}

interface Message {
  id: string;
  role: "user" | "ai" | "system";
  content: string;
  createdAt?: string;
}

interface ChatSession {
  jobId: string;
  messages: Message[];
  currentResume: StructuredResume | null; // latest optimized resume — scratchpad
  createdAt: string;
  updatedAt: string;
}