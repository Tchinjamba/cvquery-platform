"use client";
import { useState } from "react";
import { BookOpen, Code2, GraduationCap, Briefcase, Filter, Globe, Download } from "lucide-react";
import Link from "next/link";

export default function ExamplesPage() {
  const [selectedExample, setSelectedExample] = useState(0);

  const examples = [
    { name: "Cabeçalho Básico", description: "Extrair informações pessoais básicas", icon: BookOpen, query: `Nome: /** $.name **/\nEmail: /** $.contact.email **/\nTelefone: /** $.contact.phone **/\nCargo: /** $.jobTitle **/`, output: `Nome: João Silva\nEmail: joao.silva@email.com\nTelefone: +351 912 345 678\nCargo: Investigador Senior` },
    /* ... mantive o resto igual para brevidade (usa o teu conteúdo original) ... */
  ];

  return (
    <>
      {/* HEADER */}
      <div style={{ background: "#003D8F", borderBottom: "1px solid #1E40AF", padding: "24px 32px 16px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: "#FFFFFF", marginBottom: 4 }}>Exemplos Práticos</h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>
          Exemplos de templates CVQuery com a sintaxe oficial — baseados em{' '}
          <a href="https://curriculox.org/tutorials" target="_blank" rel="noopener noreferrer" style={{ color: "#93C5FD", textDecoration: "underline" }}>
            curriculox.org/tutorials
          </a>
        </p>
      </div>

      <div style={{ padding: "32px", maxWidth: 1200, margin: "0 auto" }}>
        {/* Conteúdo introdutório (mantém o teu HTML/CSS original) */}
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24 }}>
          <div style={{ border: "1px solid #bfdbfe", borderRadius: 12, overflow: "hidden", height: "fit-content", background: "#ffffff" }}>
            <div style={{ padding: "12px 16px", background: "#eff6ff", borderBottom: "1px solid #bfdbfe", display: "flex", alignItems: "center", gap: 8 }}>
              <BookOpen size={16} color="#3b82f6" />
              <strong style={{ color: "#1f2937" }}>Exemplos disponíveis</strong>
            </div>

            {examples.map((example, idx) => {
              const IconExample = example.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedExample(idx)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    width: "100%",
                    textAlign: "left",
                    padding: "12px 16px",
                    border: "none",
                    background: selectedExample === idx ? "#dbeafe" : "transparent",
                    color: selectedExample === idx ? "#1d4ed8" : "#4b5563",
                    cursor: "pointer",
                    borderLeft: selectedExample === idx ? "3px solid #3b82f6" : "3px solid transparent",
                    transition: "all 0.15s"
                  }}
                >
                  <span style={{ color: selectedExample === idx ? "#3b82f6" : "#9ca3af" }}>
                    <IconExample size={18} strokeWidth={1.5} />
                  </span>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{example.name}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{example.description}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div>
            <div style={{ border: "1px solid #bfdbfe", borderRadius: 12, overflow: "hidden", marginBottom: 24, background: "#ffffff" }}>
              <div style={{ padding: "12px 16px", background: "#eff6ff", borderBottom: "1px solid #bfdbfe", display: "flex", alignItems: "center", gap: 8 }}>
                <Code2 size={16} color="#3b82f6" />
                <strong style={{ color: "#1f2937" }}>Template CVQuery</strong>
                <span style={{ marginLeft: "auto", fontSize: 12, color: "#6b7280" }}>
                  Use <code style={{ background: "#dbeafe", padding: "2px 6px", borderRadius: 4 }}>/** ... **/</code> para expressões
                </span>
              </div>
              <pre style={{ margin: 0, padding: 16, background: "#1e1e1e", color: "#d4d4d4", fontFamily: "monospace", fontSize: 13, lineHeight: 1.6, overflow: "auto" }}>
                {examples[selectedExample].query}
              </pre>
            </div>

            <div style={{ border: "1px solid #bfdbfe", borderRadius: 12, overflow: "hidden", background: "#ffffff" }}>
              <div style={{ padding: "12px 16px", background: "#eff6ff", borderBottom: "1px solid #bfdbfe", display: "flex", alignItems: "center", gap: 8 }}>
                <Download size={16} color="#3b82f6" />
                <strong style={{ color: "#1f2937" }}>Output Gerado</strong>
              </div>
              <pre style={{ margin: 0, padding: 16, background: "#f9fafb", color: "#1f2937", fontFamily: "monospace", fontSize: 13, lineHeight: 1.6, overflow: "auto" }}>
                {examples[selectedExample].output}
              </pre>
            </div>

            <div style={{ marginTop: 24, padding: 16, background: "#eff6ff", borderRadius: 8, fontSize: 13, color: "#4b5563", display: "flex", alignItems: "center", gap: 8 }}>
              <span>💡</span>
              <span>
                <strong>Dica:</strong> Pode copiar estes exemplos e adaptá-los ao seu próprio CV.
                Experimente no <Link href="/template-editor" style={{ color: "#3b82f6", textDecoration: "none" }}>Editor de Templates</Link>!
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}