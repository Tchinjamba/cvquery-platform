"use client";
import { useState } from "react";
import { BookOpen, Code2, GraduationCap, Briefcase, Filter, Globe, Download } from "lucide-react";
import Link from "next/link";

export default function ExamplesPage() {
  const [selectedExample, setSelectedExample] = useState(0);

  const examples = [
    {
      name: "Cabeçalho Básico",
      description: "Extrair informações pessoais básicas",
      icon: BookOpen,
      query: `Nome: /** $.name **/
Email: /** $.contact.email **/
Telefone: /** $.contact.phone **/
Cargo: /** $.jobTitle **/`,
      output: `Nome: João Silva
Email: joao.silva@email.com
Telefone: +351 912 345 678
Cargo: Investigador Senior`
    },
    {
      name: "Listar Publicações (Iteração)",
      description: "Iterar sobre publicações com formatação e ordenação",
      icon: BookOpen,
      query: `Publicações (/** /-- $.expprof.pubs.pub.length --/ **/):

/** ($.expprof.pubs.$pub, [[year, DESC]]) => {
  "$pub.titleen" ($pub.year)
  Autores: $pub.authors.$author{
    first: {},
    common: { $author.surname, $author.name/--.charAt(0).toUpperCase()--/. },
    last: { $author.surname, $author.name/--.charAt(0).toUpperCase()--/. }
  }
  Área: $pub.area\\n
} **/`,
      output: `Publicações (2):

"Innovation of CV management" (2025)
Autores: Smith, J., Strange, P.
Área: curricular

"Latex converter" (2013)
Autores: Smith, J.
Área: technical`
    },
    {
      name: "Formação Académica",
      description: "Listar formação ordenada por ano com descrição opcional",
      icon: GraduationCap,
      query: `Formação Académica:

/** ($.education.$edu, [[year, DESC]]) => {
  • $edu.degree em $edu.institution ($edu.year)
  $( $edu.description/--!==undefined--/ ){
    \\ $edu.description\\n
  }
} **/`,
      output: `Formação Académica:

• Doutoramento em Informática - Universidade de Lisboa (2020)
    Especialização em Inteligência Artificial

• Mestrado em Engenharia Informática - Universidade do Porto (2015)

• Licenciatura em Ciências da Computação - Universidade de Coimbra (2010)`
    },
    {
      name: "Experiência Profissional",
      description: "Experiência profissional com responsabilidades",
      icon: Briefcase,
      query: `Experiência Profissional:

/** ($.experience.$exp, [[startDate, DESC]]) => {
  $exp.position na $exp.company
  \\ Período: $exp.startDate - $( $exp.endDate/--!==undefined--/ ){ $exp.endDate }{ Presente }
  $( $exp.responsibilities/--!==undefined--/ ){
    \\ Responsabilidades:
    \\ $exp.responsibilities.$resp{
      \\ \\ • $resp\\n
    }
  }
  \\n
} **/`,
      output: `Experiência Profissional:

Investigador Sénior na TechLab
  Período: 2021 - Presente
  Responsabilidades:
    • Liderar equipa de investigação
    • Publicar artigos científicos

Desenvolvedor Full-Stack na InnovateX
  Período: 2018 - 2021
  Responsabilidades:
    • Desenvolver aplicações web
    • Implementar APIs REST`
    },
    {
      name: "Condicionais e Verificações",
      description: "Usar condições para mostrar conteúdo apenas quando existem dados",
      icon: Filter,
      query: `/** $( $.expprof.pubs/--!==undefined && $.expprof.pubs.pub.length > 0 --/ ){
  /-- $.expprof.pubs.pub.length --/ publicação(ões) encontrada(s):
  /** ($.expprof.pubs.$pub, [[year, DESC]]) => {
    • "$pub.titleen" ($pub.year)\\n
  } **/
} **/
/** $( $.expprof.pubs/--.length===0--/ ){
  Nenhuma publicação registada.
} **/
/** $( $.orcid/--!==undefined--/ ){
  ORCID: /** $.orcid **/
} **/`,
      output: `2 publicação(ões) encontrada(s):
  • "Innovation of CV management" (2025)
  • "Latex converter" (2013)

ORCID: 0000-0000-0000-0000`
    },
    {
      name: "Filtros Avançados com JS",
      description: "Filtrar publicações por ano usando JavaScript embutido",
      icon: Filter,
      query: `Publicações recentes (após 2020):

/** ($.expprof.pubs.$pub/--.filter(p => p.year > 2020)--/, [[year, DESC]]) => {
  $pub.titleen ($pub.year)\\n
} **/

Publicações mais antigas (2020 ou anterior):

/** $( $.expprof.pubs/--.filter(p => p.year <= 2020).length > 0 --/ ){
  /** ($.expprof.pubs.$pub/--.filter(p => p.year <= 2020)--/, [[year, DESC]]) => {
    $pub.titleen ($pub.year)\\n
  } **/
} **/`,
      output: `Publicações recentes (após 2020):
"Innovation of CV management" (2025)

Publicações mais antigas (2020 ou anterior):
"Latex converter" (2013)`
    },
    {
      name: "Multi-idioma",
      description: "Suporte para múltiplos idiomas com base na variável 'lang'",
      icon: Globe,
      query: `/** ($.expprof.pubs.$pub, [[year, DESC]]) => {
  $( /-- $.lang === "pt" --/ ){
    Título: "$pub.titlept", $pub.year\\n
  }
  $( /-- $.lang === "en" --/ ){
    Title: "$pub.titleen", $pub.year\\n
  }
  $( /-- $.lang === "es" --/ ){
    Título: "$pub.titles", $pub.year\\n
  }
} **/`,
      output: `Título: "Inovação na gestão de CV", 2025
Título: "Converter LaTeX", 2013`
    },
    {
      name: "Blocos first/common/last",
      description: "Tratar o primeiro, os comuns e o último registo de forma diferente",
      icon: BookOpen,
      query: `Lista de publicações:

/** $.expprof.pubs.$pub{
  first: { "▶ $pub.titleen ($pub.year)\\n" }
  common: { "  $pub.titleen ($pub.year)\\n" }
  last: { "  $pub.titleen ($pub.year) ◀\\n" }
} **/`,
      output: `Lista de publicações:
▶ "Innovation of CV management" (2025)
  "Latex converter" (2013) ◀`
    },
    {
      name: "Espaços e Quebras Literais",
      description: "Controlo preciso de espaços e novas linhas usando \\ e \\n",
      icon: Code2,
      query: `/** "\\"$pub.title\\":\\ $pub.year\\n" **/`,
      output: `"Innovation of CV management": 2025`
    }
  ];

  const getIcon = (iconComponent) => {
    const Icon = iconComponent;
    return <Icon size={18} strokeWidth={1.5} />;
  };

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, color: "#1f2937" }}>Exemplos Práticos</h1>
        <p style={{ fontSize: 16, color: "#6b7280" }}>
          Exemplos de templates CVQuery com a sintaxe oficial — baseados em{' '}
          <a href="https://curriculox.org/tutorials" target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6", textDecoration: "none" }}>
            curriculox.org/tutorials
          </a>
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24 }}>
        {/* Sidebar de exemplos */}
        <div style={{ 
          border: "1px solid #bfdbfe", 
          borderRadius: 12, 
          overflow: "hidden",
          height: "fit-content",
          background: "#ffffff"
        }}>
          <div style={{ padding: "12px 16px", background: "#eff6ff", borderBottom: "1px solid #bfdbfe", display: "flex", alignItems: "center", gap: 8 }}>
            <BookOpen size={16} color="#3b82f6" />
            <strong style={{ color: "#1f2937" }}>Exemplos disponíveis</strong>
          </div>
          {examples.map((example, idx) => {
            const IconExample = example.icon;
            return (
              <button
                key={idx}
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

        {/* Conteúdo do exemplo */}
        <div>
          <div style={{ 
            border: "1px solid #bfdbfe", 
            borderRadius: 12, 
            overflow: "hidden",
            marginBottom: 24,
            background: "#ffffff"
          }}>
            <div style={{ padding: "12px 16px", background: "#eff6ff", borderBottom: "1px solid #bfdbfe", display: "flex", alignItems: "center", gap: 8 }}>
              <Code2 size={16} color="#3b82f6" />
              <strong style={{ color: "#1f2937" }}>Template CVQuery</strong>
              <span style={{ marginLeft: "auto", fontSize: 12, color: "#6b7280" }}>
                Use <code style={{ background: "#dbeafe", padding: "2px 6px", borderRadius: 4 }}>/** ... **/</code> para expressões
              </span>
            </div>
            <pre style={{ 
              margin: 0, 
              padding: 16, 
              background: "#1e1e1e", 
              color: "#d4d4d4",
              fontFamily: "monospace",
              fontSize: 13,
              lineHeight: 1.6,
              overflow: "auto"
            }}>
              {examples[selectedExample].query}
            </pre>
          </div>

          <div style={{ 
            border: "1px solid #bfdbfe", 
            borderRadius: 12, 
            overflow: "hidden",
            background: "#ffffff"
          }}>
            <div style={{ padding: "12px 16px", background: "#eff6ff", borderBottom: "1px solid #bfdbfe", display: "flex", alignItems: "center", gap: 8 }}>
              <Download size={16} color="#3b82f6" />
              <strong style={{ color: "#1f2937" }}>Output Gerado</strong>
            </div>
            <pre style={{ 
              margin: 0, 
              padding: 16, 
              background: "#f9fafb", 
              color: "#1f2937",
              fontFamily: "monospace",
              fontSize: 13,
              lineHeight: 1.6,
              overflow: "auto"
            }}>
              {examples[selectedExample].output}
            </pre>
          </div>

          <div style={{ 
            marginTop: 24, 
            padding: 16, 
            background: "#eff6ff", 
            borderRadius: 8,
            fontSize: 13,
            color: "#4b5563",
            display: "flex",
            alignItems: "center",
            gap: 8
          }}>
            <span>💡</span>
            <span>
              <strong>Dica:</strong> Pode copiar estes exemplos e adaptá-los ao seu próprio CV.
              Experimente no <Link href="/template-editor" style={{ color: "#3b82f6", textDecoration: "none" }}>Editor de Templates</Link>!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}