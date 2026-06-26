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
      query: `Nome: $$.name
Email: $$.contact.email
Telefone: $$.contact.phone
Cargo: $$.jobTitle`,
      output: `Nome: João Silva
Email: joao.silva@email.com
Telefone: +351 912 345 678
Cargo: Investigador Senior`
    },
    {
      name: "Listar Publicações",
      description: "Iterar sobre publicações com formatação",
      icon: BookOpen,
      query: `$($$.expprof.pubs/--.length>0--/){
Publicações ($$.expprof.pubs/--.length--/):

$$.expprof.pubs.$pub{
  "$pub.titleen" ($pub.year)
  Autores: $pub.authors.$author{
    first: {},
    common: { $author.surname, $author.name/--.charAt(0).toUpperCase()--/. },
    last: { $author.surname, $author.name/--.charAt(0).toUpperCase()--/. }
  }
  Área: $pub.area\n
}
}`,
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
      description: "Listar formação ordenada por ano",
      icon: GraduationCap,
      query: `Formação Académica:

$$.education.$edu/--.sort((a,b) => b.year - a.year)--/{
  • $edu.degree em $edu.institution ($edu.year)
  $($edu.description/--!==undefined--/){
    \ \ \ $edu.description\n
  }
}`,
      output: `Formação Académica:

• Doutoramento em Informática - Universidade de Lisboa (2020)
    Especialização em Inteligência Artificial

• Mestrado em Engenharia Informática - Universidade do Porto (2015)

• Licenciatura em Ciências da Computação - Universidade de Coimbra (2010)`
    },
    {
      name: "Experiência Profissional",
      description: "Experiência profissional com detalhes",
      icon: Briefcase,
      query: `Experiência Profissional:

$$.experience.$exp/--.sort((a,b) => b.startDate - a.startDate)--/{
$exp.position na $exp.company
\ Período: $exp.startDate - $($exp.endDate/--!==undefined--/){$exp.endDate}{Presente}
\ $($exp.responsibilities/--!==undefined--/){
\ Responsabilidades:
\ $exp.responsibilities.$resp{
\ \ • $resp\n
\ }
}
\n}`,
      output: `Investigador Sénior na TechLab
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
      name: "Condicionais",
      description: "Usar condições para mostrar conteúdo opcional",
      icon: Filter,
      query: `$($$.expprof.pubs/--.length>0--/){
$($$.expprof.pubs/--.length--/) publicação(ões) encontrada(s):
$$.expprof.pubs.$pub{
  • "$pub.titleen" ($pub.year)
}
}
$($$.expprof.pubs/--.length===0--/){
Nenhuma publicação registada.
}
$($$.orcid/--!==undefined--/){
ORCID: $$.orcid
}`,
      output: `2 publicação(ões) encontrada(s):
  • "Innovation of CV management" (2025)
  • "Latex converter" (2013)

ORCID: 0000-0000-0000-0000`
    },
    {
      name: "Filtros Avançados",
      description: "Filtrar publicações por ano",
      icon: Filter,
      query: `Publicações recentes (após 2020):

$$.expprof.pubs.$pub/--.filter(p => p.year > 2020)--/{
$pub.titleen ($pub.year)
}

Publicações mais antigas (2020 ou anterior):

$($$.expprof.pubs/--.filter(p => p.year <= 2020).length > 0--/){
$$.expprof.pubs.$pub/--.filter(p => p.year <= 2020)--/{
$pub.titleen ($pub.year)
}
}`,
      output: `Publicações recentes (após 2020):
"Innovation of CV management" (2025)

Publicações mais antigas (2020 ou anterior):
"Latex converter" (2013)`
    },
    {
      name: "Multi-idioma",
      description: "Suporte para múltiplos idiomas",
      icon: Globe,
      query: `$($$.expprof.pubs.$pub{
  $($$.lang/--==="pt"--/){
  Título: "$pub.titlept", $pub.year
  }
  $($$.lang/--==="en"--/){
  Title: "$pub.titleen", $pub.year
  }
  $($$.lang/--==="es"--/){
  Título: "$pub.titles", $pub.year
  }
}\n)`,
      output: `Título: "Inovação na gestão de CV", 2025
Título: "Converter LaTeX", 2013`
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
        <p style={{ fontSize: 16, color: "#6b7280" }}>Exemplos de queries CV Query Language para diferentes situações</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24 }}>
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
              <strong style={{ color: "#1f2937" }}>Query</strong>
            </div>
            <pre style={{ 
              margin: 0, 
              padding: 16, 
              background: "#1e1e1e", 
              color: "#d4d4d4",
              fontFamily: "monospace",
              fontSize: 13,
              lineHeight: 1.5,
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
              <strong style={{ color: "#1f2937" }}>Output</strong>
            </div>
            <pre style={{ 
              margin: 0, 
              padding: 16, 
              background: "#f9fafb", 
              color: "#1f2937",
              fontFamily: "monospace",
              fontSize: 13,
              lineHeight: 1.5,
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
              <strong>Dica:</strong> Pode copiar estas queries e adaptá-las ao seu próprio CV.
              Experimente no <Link href="/template-editor" style={{ color: "#3b82f6", textDecoration: "none" }}>Editor de Templates</Link>!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}