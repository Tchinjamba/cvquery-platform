"use client";
import { useState } from "react";

const SECTIONS = [
  {
    id: "intro",
    title: "O que é o CVQuery?",
    content: `O CVQuery é uma linguagem de templates para gerar CVs académicos a partir de dados JSON. 
Defines os teus dados uma vez e podes gerar o CV em múltiplos formatos (texto, HTML, LaTeX, Markdown) 
usando templates reutilizáveis.`
  },
  {
    id: "fields",
    title: "Aceder a campos — $.campo",
    examples: [
      { label: "Campo simples", code: "$.name", desc: "Devolve o valor do campo 'name'" },
      { label: "Campo aninhado", code: "$.contact.email", desc: "Acede a objetos dentro de objetos" },
      { label: "Campo profundo", code: "$.expprof.pubs.pub", desc: "Navega por múltiplos níveis" },
    ],
    demo: {
      data: `{\n  "name": "Ana Silva",\n  "contact": {\n    "email": "ana@example.com"\n  }\n}`,
      template: `Nome: $.name\nEmail: $.contact.email`,
      output: `Nome: Ana Silva\nEmail: ana@example.com`
    }
  },
  {
    id: "iteration",
    title: "Iterar arrays — ($.array, [[campo, DIR]]) => { }",
    examples: [
      { label: "Iterar e ordenar DESC", code: "($.pubs.pub, [[year, DESC]]) => {\n  $item.title ($item.year)\n}", desc: "Itera o array ordenado por ano descendente" },
      { label: "Ordenar ASC", code: "($.education, [[year, ASC]]) => {\n  $item.degree — $item.institution\n}", desc: "Ordena por ano ascendente" },
    ],
    demo: {
      data: `{\n  "pubs": {\n    "pub": [\n      { "title": "Paper A", "year": 2022 },\n      { "title": "Paper B", "year": 2024 },\n      { "title": "Paper C", "year": 2023 }\n    ]\n  }\n}`,
      template: `($.pubs.pub, [[year, DESC]]) => {\n  $item.year — $item.title\n}`,
      output: `2024 — Paper B\n2023 — Paper C\n2022 — Paper A`
    }
  },
  {
    id: "dynamic",
    title: "JavaScript dinâmico — /-- expressão --/",
    examples: [
      { label: "Expressão simples", code: "/-- $item.year --/", desc: "Avalia e insere o valor" },
      { label: "Cálculo", code: "/-- new Date().getFullYear() - $item.year --/", desc: "Calcula anos desde publicação" },
      { label: "Condicional", code: "/-- $item.year > 2020 ? 'Recente' : 'Antigo' --/", desc: "Lógica condicional" },
    ],
    demo: {
      data: `{\n  "year_start": 2018\n}`,
      template: `Anos de experiência: /-- new Date().getFullYear() - $.year_start --/`,
      output: `Anos de experiência: 8`
    }
  },
  {
    id: "formats",
    title: "Formatos de output",
    formats: [
      { key: "text", label: "Texto simples", desc: "Output limpo em .txt, ideal para copiar." },
      { key: "html", label: "HTML", desc: "Página web pronta a publicar." },
      { key: "latex", label: "LaTeX", desc: "Para compilar com pdflatex em artigos académicos." },
      { key: "markdown", label: "Markdown", desc: "Para GitHub, Notion, ou qualquer editor Markdown." },
    ]
  },
  {
    id: "example",
    title: "Exemplo completo",
    demo: {
      data: `{
  "name": "Ana Silva",
  "contact": { "email": "ana@example.com", "phone": "+351 910 000 000" },
  "education": [
    { "degree": "Mestrado em Informática", "year": 2020, "institution": "Universidade de Lisboa" },
    { "degree": "Licenciatura", "year": 2018, "institution": "IST" }
  ],
  "pubs": {
    "pub": [
      { "title": "Deep Learning em NLP", "year": 2022, "venue": "EPIA" },
      { "title": "Transformers", "year": 2024, "venue": "CVPR" }
    ]
  }
}`,
      template: `=== $.name ===
Email: $.contact.email
Tel: $.contact.phone

--- Educação ---
($.education, [[year, DESC]]) => {
  /-- $item.year --/ — $item.degree ($item.institution)
}

--- Publicações ---
($.pubs.pub, [[year, DESC]]) => {
  /-- $item.year --/ — $item.title. $item.venue.
}`,
      output: `=== Ana Silva ===
Email: ana@example.com
Tel: +351 910 000 000

--- Educação ---
2020 — Mestrado em Informática (Universidade de Lisboa)
2018 — Licenciatura (IST)

--- Publicações ---
2024 — Transformers. CVPR.
2022 — Deep Learning em NLP. EPIA.`
    }
  }
];

export default function DocsPage() {
  const [active, setActive] = useState("intro");

  return (
    <>
      {/* ⭐ NAVBAR #003D8F */}
      <div className="page-header" style={{ 
        background: "#003D8F", 
        borderBottom: "1px solid #1E40AF", 
        padding: "24px 32px 16px 32px" 
      }}>
        <div>
          <h1 className="page-title" style={{ 
            fontSize: "24px", 
            fontWeight: 600, 
            color: "#FFFFFF", 
            marginBottom: 4 
          }}>Documentação CVQuery</h1>
          <p className="page-subtitle" style={{ 
            fontSize: "14px", 
            color: "rgba(255,255,255,0.8)" 
          }}>Referência completa da linguagem de templates</p>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"220px 1fr", minHeight:"calc(100vh - 130px)" }}>
        {/* Sidebar docs - sem ícones */}
        <div style={{ borderRight:"1px solid #E0E0E0", padding:"20px 12px", background:"#F8F8F8" }}>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActive(s.id)}
              style={{ 
                display:"block", 
                width:"100%", 
                textAlign:"left", 
                padding:"8px 12px", 
                borderRadius:"8px", 
                border:"none", 
                background: active === s.id ? "#DBEAFE" : "transparent", 
                color: active === s.id ? "#003D8F" : "#4A4A4A", 
                fontSize: 13, 
                fontWeight: active === s.id ? 600 : 400, 
                cursor: "pointer", 
                marginBottom: 2, 
                transition: "all 0.15s" 
              }}
            >
              {s.title}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding:"32px 40px", maxWidth:780 }}>
          {SECTIONS.filter(s => s.id === active).map(s => (
            <div key={s.id}>
              <h2 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 20, fontWeight: 600, marginBottom: 12, color: "#1A1A1A" }}>{s.title}</h2>

              {s.content && <p style={{ fontSize: 14, color: "#4A4A4A", lineHeight: 1.8, marginBottom: 24 }}>{s.content}</p>}

              {s.examples && (
                <div style={{ marginBottom: 24 }}>
                  {s.examples.map((ex, i) => (
                    <div key={i} style={{ marginBottom: 12, padding: 16, background: "#F5F5F5", borderRadius: "8px", border: "1px solid #E0E0E0" }}>
                      <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 6 }}>{ex.label}</div>
                      <code style={{ fontFamily: "monospace", fontSize: 13, color: "#003D8F", whiteSpace: "pre" }}>{ex.code}</code>
                      <div style={{ fontSize: 12, color: "#4A4A4A", marginTop: 6 }}>{ex.desc}</div>
                    </div>
                  ))}
                </div>
              )}

              {s.formats && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                  {s.formats.map(f => (
                    <div key={f.key} style={{ padding: 16, background: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: "8px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: "#1A1A1A" }}>{f.label}</div>
                      <div style={{ fontSize: 12, color: "#4A4A4A" }}>{f.desc}</div>
                    </div>
                  ))}
                </div>
              )}

              {s.demo && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#4A4A4A", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Dados JSON</div>
                      <pre style={{ fontFamily: "monospace", fontSize: 12, padding: 14, background: "#F5F5F5", border: "1px solid #E0E0E0", borderRadius: "8px", whiteSpace: "pre-wrap", color: "#4A4A4A", margin: 0 }}>{s.demo.data}</pre>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#4A4A4A", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Template</div>
                      <pre style={{ fontFamily: "monospace", fontSize: 12, padding: 14, background: "#F5F5F5", border: "1px solid #E0E0E0", borderRadius: "8px", whiteSpace: "pre-wrap", color: "#003D8F", margin: 0 }}>{s.demo.template}</pre>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#4A4A4A", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Output</div>
                    <pre style={{ fontFamily: "monospace", fontSize: 12, padding: 14, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "8px", whiteSpace: "pre-wrap", color: "#166534", margin: 0 }}>{s.demo.output}</pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}