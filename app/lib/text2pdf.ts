import JsPDF from "jspdf";
import html2canvas from "html2canvas";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StructuredResumeToPdfResult {
  blob: Blob | null;
  file: File | null;
  error?: string;
}

// ─── Resume HTML Generator ──────────────────────────────────────────────────
// Renders a StructuredResume into styled HTML.
// Used in two places:
//   1. The optimization page right panel (live preview)
//   2. convertStructuredResumeToPdf (captures this exact HTML to PDF)
// So what the user sees is exactly what they download.

export function generateResumeHtml(resume: StructuredResume): string {
  // Sort blocks by order to ensure correct sequence
  const sortedBlocks = [...resume.blocks].sort((a, b) => a.order - b.order);
  
  const blocksHtml = sortedBlocks
    .map((block) => {
      switch (block.type) {
        case "header":
          return renderHeader(block.data);
        case "contact":
          return renderContact(block.data);
        case "summary":
          return renderSummary(block.name, block.data);
        case "skills":
          return renderSkills(block.name, block.data);
        case "experience":
          return renderExperience(block.name, block.data);
        case "education":
          return renderEducation(block.name, block.data);
        case "projects":
          return renderProjects(block.name, block.data);
        case "certification":
          return renderCertification(block.name, block.data);
        case "additional":
          return renderAdditional(block.name, block.data);
        default:
          return "";
      }
    })
    .join("");

  return `
    <div class="resume-container" id="resume-preview">
      ${blocksHtml}
    </div>
  `;
}

// ─── Block Renderers ─────────────────────────────────────────────────────────

function renderHeader(data: HeaderData): string {
  return `
    <div class="resume-header">
      <h1 class="resume-name">${escapeHtml(data.name)}</h1>
      <p class="resume-title">${escapeHtml(data.title)}</p>
    </div>
  `;
}

function renderContact(data: ContactData): string {
  const contactItems = data
    .map((link) => {
      const displayText = link.label || link.url || "";
      if (link.url) {
        return `<a href="${escapeHtml(link.url)}" class="contact-link">${escapeHtml(displayText)}</a>`;
      }
      return `<span class="contact-item">${escapeHtml(displayText)}</span>`;
    })
    .join('<span class="contact-divider"> | </span>');

  return `
    <div class="resume-contact">
      ${contactItems}
    </div>
  `;
}

function renderSummary(name: string, data: SummaryData): string {
  return `
    <div class="resume-section">
      <h2 class="section-heading">${escapeHtml(name)}</h2>
      <div class="section-divider"></div>
      <p class="summary-text">${escapeHtml(data.text)}</p>
    </div>
  `;
}

function renderSkills(name: string, data: SkillsData): string {
  const categoriesHtml = data
    .map(
      (cat) => `
      <div class="skill-category">
        <span class="skill-category-name">${escapeHtml(cat.category)}:</span>
        <span class="skill-list">${cat.skills.map(escapeHtml).join(", ")}</span>
      </div>
    `
    )
    .join("");

  return `
    <div class="resume-section">
      <h2 class="section-heading">${escapeHtml(name)}</h2>
      <div class="section-divider"></div>
      <div class="skills-content">
        ${categoriesHtml}
      </div>
    </div>
  `;
}

function renderExperience(name: string, data: ExperienceData): string {
  const entriesHtml = data
    .map(
      (entry) => `
      <div class="experience-entry">
        <div class="entry-header">
          ${
            entry.companyUrl
              ? `<a href="${escapeHtml(entry.companyUrl)}" class="company-link">${escapeHtml(entry.company)}</a>`
              : `<span class="company-name">${escapeHtml(entry.company)}</span>`
          }
          <span class="entry-dates">${escapeHtml(entry.dates)}</span>
        </div>
        <p class="entry-title">${escapeHtml(entry.title)}</p>
        <ul class="entry-bullets">
          ${entry.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}
        </ul>
      </div>
    `
    )
    .join("");

  return `
    <div class="resume-section">
      <h2 class="section-heading">${escapeHtml(name)}</h2>
      <div class="section-divider"></div>
      ${entriesHtml}
    </div>
  `;
}

function renderEducation(name: string, data: EducationData): string {
  const entriesHtml = data
    .map(
      (entry) => `
      <div class="education-entry">
        <div class="entry-header">
          <span class="institution-name">${escapeHtml(entry.institution)}</span>
          <span class="entry-dates">${escapeHtml(entry.dates)}</span>
        </div>
        <p class="entry-title">${escapeHtml(entry.degree)}</p>
        ${
          entry.bullets && entry.bullets.length > 0
            ? `<ul class="entry-bullets">
                ${entry.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}
              </ul>`
            : ""
        }
      </div>
    `
    )
    .join("");

  return `
    <div class="resume-section">
      <h2 class="section-heading">${escapeHtml(name)}</h2>
      <div class="section-divider"></div>
      ${entriesHtml}
    </div>
  `;
}

function renderProjects(name: string, data: ProjectsData): string {
  const entriesHtml = data
    .map(
      (entry) => `
      <div class="project-entry">
        <div class="project-header">
          <span class="project-name">${escapeHtml(entry.name)}</span>
          ${
            entry.links.length > 0
              ? `<span class="project-links">
                  ${entry.links
                    .map((link) => {
                      const text = link.label || link.url || "";
                      return `<a href="${escapeHtml(link.url || "#")}" class="project-link">${escapeHtml(text)}</a>`;
                    })
                    .join(" | ")}
                </span>`
              : ""
          }
        </div>
        <p class="project-description">${escapeHtml(entry.description)}</p>
        <p class="project-technologies"><strong>Technologies:</strong> ${entry.technologies.map(escapeHtml).join(", ")}</p>
        ${
          entry.bullets && entry.bullets.length > 0
            ? `<ul class="entry-bullets">
                ${entry.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}
              </ul>`
            : ""
        }
      </div>
    `
    )
    .join("");

  return `
    <div class="resume-section">
      <h2 class="section-heading">${escapeHtml(name)}</h2>
      <div class="section-divider"></div>
      ${entriesHtml}
    </div>
  `;
}

function renderCertification(name: string, data: CertificationData): string {
  const itemsHtml = data
    .map((link) => {
      const text = link.label || link.url || "";
      if (link.url) {
        return `<li><a href="${escapeHtml(link.url)}" class="cert-link">${escapeHtml(text)}</a></li>`;
      }
      return `<li>${escapeHtml(text)}</li>`;
    })
    .join("");

  return `
    <div class="resume-section">
      <h2 class="section-heading">${escapeHtml(name)}</h2>
      <div class="section-divider"></div>
      <ul class="cert-list">
        ${itemsHtml}
      </ul>
    </div>
  `;
}

function renderAdditional(name: string, data: AdditionalData): string {
  const entriesHtml = data
    .map(
      (entry) => `
      <div class="additional-entry">
        ${entry.title ? `<p class="entry-title">${escapeHtml(entry.title)}</p>` : ""}
        ${entry.subtitle ? `<p class="entry-subtitle">${escapeHtml(entry.subtitle)}</p>` : ""}
        ${entry.dates ? `<p class="entry-dates">${escapeHtml(entry.dates)}</p>` : ""}
        ${
          entry.bullets && entry.bullets.length > 0
            ? `<ul class="entry-bullets">
                ${entry.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}
              </ul>`
            : ""
        }
        ${
          entry.links && entry.links.length > 0
            ? `<div class="entry-links">
                ${entry.links
                  .map((link) => {
                    const text = link.label || link.url || "";
                    return `<a href="${escapeHtml(link.url || "#")}" class="entry-link">${escapeHtml(text)}</a>`;
                  })
                  .join(" | ")}
              </div>`
            : ""
        }
      </div>
    `
    )
    .join("");

  return `
    <div class="resume-section">
      <h2 class="section-heading">${escapeHtml(name)}</h2>
      <div class="section-divider"></div>
      ${entriesHtml}
    </div>
  `;
}

// ─── Styles ──────────────────────────────────────────────────────────────────
// Inline styles for html2canvas. These are injected into a hidden container
// when converting to PDF, and also exported so the optimization page preview
// can use them. Same HTML, same styles, consistent preview and download.

export const RESUME_STYLES = `
  .resume-container {
    font-family: 'Georgia', serif;
    max-width: 800px;
    width: 100%;
    margin: 0 auto;
    padding: 48px 56px;
    background: #ffffff;
    color: #1a1a1a;
    line-height: 1.5;
  }

  .resume-header {
    text-align: center;
    margin-bottom: 16px;
  }

  .resume-name {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin: 0 0 4px 0;
    color: #1a1a1a;
  }

  .resume-title {
    font-size: 14px;
    font-weight: 400;
    margin: 0 0 10px 0;
    color: #555555;
  }

  .resume-contact {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px;
    margin-bottom: 24px;
    font-size: 13px;
    color: #555555;
  }

  .contact-item,
  .contact-link {
    color: #555555;
    text-decoration: none;
  }

  .contact-link:hover {
    text-decoration: underline;
  }

  .contact-divider {
    color: #aaaaaa;
  }

  .resume-section {
    margin-bottom: 20px;
  }

  .section-heading {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #1a1a1a;
    margin: 0 0 4px 0;
  }

  .section-divider {
    width: 100%;
    height: 1.5px;
    background-color: #1a1a1a;
    margin-bottom: 10px;
  }

  .summary-text {
    font-size: 13px;
    margin: 0;
  }

  .skills-content {
    font-size: 13px;
  }

  .skill-category {
    margin: 4px 0;
  }

  .skill-category-name {
    font-weight: 700;
  }

  .skill-list {
    font-weight: 400;
  }

  .experience-entry,
  .education-entry,
  .project-entry,
  .additional-entry {
    margin-bottom: 14px;
  }

  .entry-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 2px;
  }

  .company-name,
  .company-link,
  .institution-name {
    font-weight: 700;
    font-size: 13px;
  }

  .company-link {
    color: #1a1a1a;
    text-decoration: none;
  }

  .company-link:hover {
    text-decoration: underline;
  }

  .entry-dates {
    font-style: italic;
    color: #666666;
    font-size: 12px;
  }

  .entry-title {
    font-size: 13px;
    font-weight: 600;
    margin: 0 0 4px 0;
  }

  .entry-subtitle {
    font-size: 12px;
    color: #666666;
    margin: 0 0 4px 0;
  }

  .entry-bullets {
    list-style: none;
    padding: 0;
    margin: 4px 0;
    font-size: 13px;
  }

  .entry-bullets li {
    padding-left: 16px;
    position: relative;
    margin: 3px 0;
  }

  .entry-bullets li::before {
    content: '•';
    position: absolute;
    left: 0;
    color: #1a1a1a;
  }

  .project-header {
    display: flex;
    gap: 8px;
    align-items: baseline;
    margin-bottom: 4px;
  }

  .project-name {
    font-weight: 700;
    font-size: 13px;
  }

  .project-links {
    font-size: 12px;
  }

  .project-link {
    color: #555555;
    text-decoration: none;
  }

  .project-link:hover {
    text-decoration: underline;
  }

  .project-description {
    font-size: 13px;
    margin: 2px 0;
  }

  .project-technologies {
    font-size: 12px;
    margin: 2px 0;
  }

  .cert-list {
    list-style: none;
    padding: 0;
    margin: 0;
    font-size: 13px;
  }

  .cert-list li {
    margin: 4px 0;
  }

  .cert-link {
    color: #1a1a1a;
    text-decoration: none;
  }

  .cert-link:hover {
    text-decoration: underline;
  }

  .entry-links {
    font-size: 12px;
    margin-top: 4px;
  }

  .entry-link {
    color: #555555;
    text-decoration: none;
  }

  .entry-link:hover {
    text-decoration: underline;
  }
`;

// ─── Structured Resume To PDF Converter ─────────────────────────────────────
// Renders the StructuredResume HTML into a hidden container, captures it with
// html2canvas, then writes the canvas into a PDF using jsPDF.
// Returns a Blob (for upload to Puter FS) and a File (for download).

export async function convertStructuredResumeToPdf(
  resume: StructuredResume,
  fileName: string = "optimized-resume"
): Promise<StructuredResumeToPdfResult> {
  try {
    // ── Create a hidden container with the resume HTML + styles ──
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "-9999px";
    container.style.left = "-9999px";
    container.style.width = "800px";
    container.style.background = "#ffffff";
    container.style.zIndex = "-1";

    // Inject styles via a <style> tag inside the container
    const styleEl = document.createElement("style");
    styleEl.textContent = RESUME_STYLES;
    container.appendChild(styleEl);

    // Inject the resume HTML
    const resumeHtml = generateResumeHtml(resume);
    const resumeEl = document.createElement("div");
    resumeEl.innerHTML = resumeHtml;
    container.appendChild(resumeEl);

    document.body.appendChild(container);

    // ── Capture with html2canvas ──
    const resumePreview = container.querySelector("#resume-preview") as HTMLElement;
    const canvas = await html2canvas(resumePreview, {
      scale: 2,              // 2x for sharpness
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    // ── Clean up the hidden container ──
    document.body.removeChild(container);

    // ── Write canvas into PDF with multi-page support ──
    const imgData = canvas.toDataURL("image/png");
    const pdf = new JsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",         // standard A4: 210 x 297 mm
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Scale the image to fit A4 width with proportional height
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    // Handle multi-page resumes
    if (imgHeight > pdfHeight) {
      // Image needs to be split across multiple pages
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Add subsequent pages
      while (heightLeft > 0) {
        position = heightLeft - imgHeight; // negative offset to show next chunk
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
    } else {
      // Single page resume
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    }

    // ── Generate Blob and File ──
    const pdfBlob = pdf.output("blob");
    const pdfFile = new File([pdfBlob], `${fileName}.pdf`, {
      type: "application/pdf",
    });

    return { blob: pdfBlob, file: pdfFile };
  } catch (err) {
    return {
      blob: null,
      file: null,
      error: `Failed to convert resume to PDF: ${err}`,
    };
  }
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}