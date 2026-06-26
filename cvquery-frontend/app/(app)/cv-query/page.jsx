"use client";
import { useState } from "react";

const SECTIONS = [
  {
  id: "intro",
  title: "O que é o CVQuery?",
  content: `O CVQuery é uma linguagem de templates para gerar CVs académicos a partir de dados JSON. 
Defines os teus dados uma vez e podes gerar o CV em múltiplos formatos (texto, HTML, LaTeX, Markdown) 
usando templates reutilizáveis.`,
  extendedContent: `
A linguagem CVQuery foi desenvolvida pelo Professor Doutor Paulo Matos, docente do Instituto Politécnico de Bragança (IPB), com o objetivo de criar uma ponte entre JavaScript, LaTeX e TypeScript para manipulação avançada de dados.

### Propósito da Linguagem
O principal propósito da linguagem CVQuery é permitir a extração e formatação de dados de um currículo armazenado em JSON, de forma flexível e intuitiva.

### Como funciona a linguagem?
A linguagem CVQuery utiliza uma sintaxe simples mas poderosa que permite:
- Aceder a dados através de expressões de ponto ($.campo)
- Iterar sobre listas usando blocos de iteração com ordenação
- Inserir JavaScript para cálculos e lógica condicional
- Aplicar condicionais para incluir ou excluir conteúdo
- Formatara saída com controlo sobre espaços e quebras de linha

### Sintaxe Base
A linguagem baseia-se em três componentes principais:
- $ - Representa a raiz dos dados do CV
- /-- --/ - Delimitadores para expressões JavaScript
- &#123; &#125; - Delimitadores para blocos de iteração e condicionais

### Casos de Uso da Linguagem
- Extração de dados: Obter campos específicos do JSON do CV
- Transformação de dados: Aplicar filtros, ordenações e cálculos
- Geração de texto: Criar texto formatado para currículos
- Exportação multi-formato: Gerar HTML, LaTeX, Markdown e texto simples`
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
    { key: "json", label: "JSON", desc: "Dados estruturados para integração com outras ferramentas." },
    { key: "pdf", label: "PDF", desc: "Documento profissional pronta a imprimir e partilhar." }
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

  // ⭐ Função para renderizar conteúdo com markdown simples
  function renderContent(text) {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('### ')) {
        return <h3 key={i} style={{ fontSize: 16, fontWeight: 600, marginTop: 20, marginBottom: 8, color: "#1A1A1A", fontFamily: "'Times New Roman', Times, serif" }}>{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('- ')) {
        return <li key={i} style={{ marginBottom: 4, color: "#4A4A4A", fontFamily: "'Times New Roman', Times, serif" }}>{line.replace('- ', '')}</li>;
      }
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} style={{ marginBottom: 8, color: "#4A4A4A", lineHeight: 1.7, fontFamily: "'Times New Roman', Times, serif" }}>{line}</p>;
    });
  }

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

      {/* ⭐ Layout assimétrico com margens diferentes */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "240px 1fr", 
        gap: "0px",
        minHeight: "calc(100vh - 130px)",
        background: "#FAFAFA"
      }}>
        {/* Sidebar docs */}
        <div style={{ 
          borderRight: "1px solid #E0E0E0", 
          padding: "24px 16px", 
          background: "#FFFFFF",
          boxShadow: "2px 0 8px rgba(0,0,0,0.02)"
        }}>
          <div style={{ 
            fontSize: "10px", 
            fontWeight: 600, 
            textTransform: "uppercase", 
            letterSpacing: "0.08em", 
            color: "#9CA3AF",
            padding: "0 12px 12px 12px",
            borderBottom: "1px solid #F0F0F0",
            marginBottom: "12px"
          }}>
            Navegação
          </div>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActive(s.id)}
              style={{ 
                display: "block", 
                width: "100%", 
                textAlign: "left", 
                padding: "10px 14px", 
                borderRadius: "6px", 
                border: "none", 
                background: active === s.id ? "#EBF5FF" : "transparent", 
                color: active === s.id ? "#003D8F" : "#4B5563", 
                fontSize: 13, 
                fontWeight: active === s.id ? 600 : 400, 
                cursor: "pointer", 
                marginBottom: "2px", 
                transition: "all 0.15s",
                borderLeft: active === s.id ? "3px solid #003D8F" : "3px solid transparent",
                fontFamily: "'Times New Roman', Times, serif"
              }}
            >
              {s.title}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ 
          padding: "40px 48px 60px 40px", 
          maxWidth: 820,
          background: "#FFFFFF"
        }}>
          {SECTIONS.filter(s => s.id === active).map(s => {
            if (s.id === "intro") {
              return (
                <div key={s.id}>
                  <h2 style={{ 
                    fontFamily: "'Times New Roman', Times, serif", 
                    fontSize: 22, 
                    fontWeight: 600, 
                    marginBottom: 16, 
                    color: "#1A1A1A",
                    paddingBottom: 12,
                    borderBottom: "2px solid #003D8F",
                    display: "inline-block"
                  }}>
                    {s.title}
                  </h2>
                  <p style={{ 
                    fontSize: 14.5, 
                    color: "#4A4A4A", 
                    lineHeight: 1.8, 
                    marginBottom: 16,
                    fontFamily: "'Times New Roman', Times, serif",
                    paddingTop: 8
                  }}>
                    {s.content}
                  </p>
                  {/* ⭐ Conteúdo estendido com mais informações */}
                  <div style={{ 
                    padding: "20px 24px",
                    background: "#F8FAFC",
                    borderRadius: "12px",
                    border: "1px solid #E8EDF2",
                    marginTop: "8px"
                  }}>
                    {renderContent(s.extendedContent)}
                  </div>
                </div>
              );
            }
            // Resto das secções...
            return (
              <div key={s.id}>
                <h2 style={{ 
                  fontFamily: "'Times New Roman', Times, serif", 
                  fontSize: 22, 
                  fontWeight: 600, 
                  marginBottom: 16, 
                  color: "#1A1A1A",
                  paddingBottom: 12,
                  borderBottom: "2px solid #003D8F",
                  display: "inline-block"
                }}>
                  {s.title}
                </h2>

                {s.content && !s.extendedContent && (
                  <p style={{ 
                    fontSize: 14.5, 
                    color: "#4A4A4A", 
                    lineHeight: 1.8, 
                    marginBottom: 28,
                    fontFamily: "'Times New Roman', Times, serif",
                    paddingTop: 8
                  }}>
                    {s.content}
                  </p>
                )}

                {s.examples && (
                  <div style={{ marginBottom: 28 }}>
                    {s.examples.map((ex, i) => (
                      <div key={i} style={{ 
                        marginBottom: 12, 
                        padding: "16px 20px", 
                        background: "#F8FAFC", 
                        borderRadius: "8px", 
                        border: "1px solid #E8EDF2"
                      }}>
                        <div style={{ 
                          fontSize: 11, 
                          fontWeight: 500, 
                          color: "#6B7280", 
                          marginBottom: 6,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em"
                        }}>
                          {ex.label}
                        </div>
                        <code style={{ 
                          fontFamily: "'Courier New', monospace", 
                          fontSize: 13, 
                          color: "#003D8F", 
                          whiteSpace: "pre",
                          display: "block",
                          background: "#FFFFFF",
                          padding: "8px 12px",
                          borderRadius: "4px",
                          border: "1px solid #E5E7EB"
                        }}>
                          {ex.code}
                        </code>
                        <div style={{ 
                          fontSize: 12.5, 
                          color: "#6B7280", 
                          marginTop: 8,
                          fontFamily: "'Times New Roman', Times, serif"
                        }}>
                          {ex.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {s.formats && (
                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "1fr 1fr", 
                    gap: 16, 
                    marginBottom: 28 
                  }}>
                    {s.formats.map((f, idx) => (
                      <div key={f.key} style={{ 
                        padding: "18px 20px", 
                        background: "#F8FAFC", 
                        border: "1px solid #E8EDF2", 
                        borderRadius: "8px",
                        borderTop: idx % 2 === 0 ? "3px solid #003D8F" : "3px solid #DBEAFE"
                      }}>
                        <div style={{ 
                          fontSize: 14, 
                          fontWeight: 600, 
                          marginBottom: 6, 
                          color: "#1A1A1A",
                          fontFamily: "'Times New Roman', Times, serif"
                        }}>
                          {f.label}
                        </div>
                        <div style={{ 
                          fontSize: 12.5, 
                          color: "#6B7280",
                          fontFamily: "'Times New Roman', Times, serif"
                        }}>
                          {f.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {s.demo && (
                  <div style={{ marginTop: 20 }}>
                    <div style={{ 
                      display: "grid", 
                      gridTemplateColumns: "1fr 1fr", 
                      gap: 16, 
                      marginBottom: 16 
                    }}>
                      <div>
                        <div style={{ 
                          fontSize: 10, 
                          fontWeight: 600, 
                          color: "#6B7280", 
                          textTransform: "uppercase", 
                          letterSpacing: "0.08em", 
                          marginBottom: 8,
                          fontFamily: "'Times New Roman', Times, serif"
                        }}>
                          Dados JSON
                        </div>
                        <pre style={{ 
                          fontFamily: "'Courier New', monospace", 
                          fontSize: 12, 
                          padding: 16, 
                          background: "#F8FAFC", 
                          border: "1px solid #E8EDF2", 
                          borderRadius: "8px", 
                          whiteSpace: "pre-wrap", 
                          color: "#4A4A4A", 
                          margin: 0,
                          lineHeight: 1.6
                        }}>
                          {s.demo.data}
                        </pre>
                      </div>
                      <div>
                        <div style={{ 
                          fontSize: 10, 
                          fontWeight: 600, 
                          color: "#6B7280", 
                          textTransform: "uppercase", 
                          letterSpacing: "0.08em", 
                          marginBottom: 8,
                          fontFamily: "'Times New Roman', Times, serif"
                        }}>
                          Template
                        </div>
                        <pre style={{ 
                          fontFamily: "'Courier New', monospace", 
                          fontSize: 12, 
                          padding: 16, 
                          background: "#F8FAFC", 
                          border: "1px solid #E8EDF2", 
                          borderRadius: "8px", 
                          whiteSpace: "pre-wrap", 
                          color: "#003D8F", 
                          margin: 0,
                          lineHeight: 1.6
                        }}>
                          {s.demo.template}
                        </pre>
                      </div>
                    </div>
                    <div>
                      <div style={{ 
                        fontSize: 10, 
                        fontWeight: 600, 
                        color: "#6B7280", 
                        textTransform: "uppercase", 
                        letterSpacing: "0.08em", 
                        marginBottom: 8,
                        fontFamily: "'Times New Roman', Times, serif"
                      }}>
                        Output
                      </div>
                      <pre style={{ 
                        fontFamily: "'Courier New', monospace", 
                        fontSize: 12, 
                        padding: 16, 
                        background: "#F0FDF4", 
                        border: "1px solid #BBF7D0", 
                        borderRadius: "8px", 
                        whiteSpace: "pre-wrap", 
                        color: "#166534", 
                        margin: 0,
                        lineHeight: 1.6
                      }}>
                        {s.demo.output}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}