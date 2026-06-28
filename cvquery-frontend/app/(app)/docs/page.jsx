"use client";
import { useState } from "react";

const SECTIONS = [
  {
    id: "intro",
    title: "O que é o CVQuery?",
    content: `O CVQuery é uma linguagem criada para **interrogar bases de dados NoSQL (MongoDB)** no sentido de extrair dados e gerar texto para geração de currículos. A sua filosofia assenta num pressuposto fundamental: **a informação de um currículo não deve estar em formato documental (Word/LaTeX/…)**, mas sim como **dados estruturados** que possam ser facilmente utilizados para produzir currículos em diferentes formatos — documental (Word/LaTeX), HTML, Markdown, ou outros.

A linguagem CVQuery foi desenvolvida pelo **Professor Doutor Paulo Matos**, docente do Instituto Politécnico de Bragança (IPB), com o objetivo de criar uma ponte entre JavaScript, LaTeX e TypeScript para manipulação avançada de dados.

**Conceito chave:** Dados em JSON → Query → Documento gerado em qualquer formato.

A plataforma **CurriculumX** é a implementação prática desta linguagem, disponibilizando o CVQuery como uma ferramenta aberta à comunidade global.`
  },
  {
    id: "delimiters",
    title: "Delimitadores — /** ... **/",
    content: `Tudo dentro de /** e **/ é processado pela linguagem CVQuery. Tudo o que está fora é texto literal.`,
    examples: [
      { 
        label: "Expressão simples", 
        code: `/** $.name **/`, 
        desc: "Processa o campo 'name' do JSON" 
      },
      { 
        label: "Texto misto", 
        code: `Nome: /** $.name **/`,
        desc: "Texto literal + expressão processada" 
      },
      { 
        label: "Expressão de iteração", 
        code: `/** ($.pubs.pub, [[year, DESC]]) => { $item.title } **/`,
        desc: "Itera sobre publicações ordenadas por ano" 
      }
    ]
  },
  {
    id: "fields",
    title: "Aceder a campos — $",
    content: `O símbolo **$** representa a raiz da estrutura de dados do CV. Acede-se a qualquer campo por pontos (dot notation).`,
    examples: [
      { label: "Campo simples", code: "$.name", desc: "Devolve o valor do campo 'name'" },
      { label: "Campo aninhado", code: "$.contact.email", desc: "Acede a objetos dentro de objetos" },
      { label: "Campo profundo", code: "$.expprof.pubs.labelen", desc: "Navega por múltiplos níveis (ex: secções)" },
      { label: "Label multilíngue", code: "$.expprof.pubs.labelpt", desc: "Acede ao label em português" },
    ],
    demo: {
      data: `{
  "name": "Ana Silva",
  "contact": {
    "email": "ana@example.com"
  },
  "expprof": {
    "pubs": {
      "labelen": "Publications"
    }
  }
}`,
      template: `Nome: /** $.name **/
Email: /** $.contact.email **/
Label: /** $.expprof.pubs.labelen **/`,
      output: `Nome: Ana Silva
Email: ana@example.com
Label: Publications`
    }
  },
  {
    id: "iteration",
    title: "Iterar registos — $record{}",
    content: `Para iterar sobre uma lista de registos, usa-se a notação **$record{}** onde "record" é o nome que se dá a cada elemento da iteração.

**Sintaxe:** \`$$.secção.registos.$nome{ ... }\`

**Blocos especiais:** \`first:\`, \`common:\` e \`last:\` permitem tratar o primeiro, os comuns e o último registo de forma diferente.`,
    examples: [
      { 
        label: "Iteração simples", 
        code: `/** $.expprof.pubs.$pub{ $pub.title } **/`,
        desc: "Itera sobre publicações e mostra os títulos" 
      },
      { 
        label: "Com formatação", 
        code: `/** $.expprof.pubs.$pub{ $pub.title, $pub.year } **/`,
        desc: "Mostra título e ano com vírgula" 
      },
      { 
        label: "Com first/common/last", 
        code: `/** $.expprof.pubs.$pub{
  first: { "Primeiro: $pub.title\\n" }
  common: { "$pub.title\\n" }
  last: { "Último: $pub.title\\n" }
} **/`,
        desc: "Trata o primeiro, os comuns e o último de forma diferente" 
      },
      { 
        label: "Com ordenação", 
        code: `/** ($.expprof.pubs.$pub, [[year, DESC]]) => { $pub.title, $pub.year } **/`,
        desc: "Itera ordenando por ano descendente" 
      },
    ],
    demo: {
      data: `{
  "expprof": {
    "pubs": {
      "pub": [
        { "title": "Deep Learning em NLP", "year": 2022 },
        { "title": "Transformers", "year": 2024 },
        { "title": "LLM em Português", "year": 2023 }
      ]
    }
  }
}`,
      template: `/** ($.expprof.pubs.$pub, [[year, DESC]]) => {
  $pub.year — $pub.title
} **/`,
      output: `2024 — Transformers
2023 — LLM em Português
2022 — Deep Learning em NLP`
    }
  },
  {
    id: "dynamic",
    title: "JavaScript embutido — /-- --/",
    content: `Pode-se usar JavaScript diretamente dentro da expressão, delimitado por **/-- e --/**.

**Permite:** cálculos, filtros, condicionais, e qualquer operação JavaScript.`,
    examples: [
      { 
        label: "Expressão simples", 
        code: `/** /-- $pub.year --/ **/`,
        desc: "Avalia e insere o valor do campo year" 
      },
      { 
        label: "Cálculo", 
        code: `/** /-- new Date().getFullYear() - $pub.year --/ **/`,
        desc: "Calcula anos desde a publicação" 
      },
      { 
        label: "Condicional", 
        code: `/** /-- $pub.year > 2020 ? 'Recente' : 'Antigo' --/ **/`,
        desc: "Lógica condicional inline" 
      },
      { 
        label: "Filtro", 
        code: `/** ($.expprof.pubs.$pub/--.filter(p => p.year > 2020)--/) => { $pub.title } **/`,
        desc: "Filtra publicações posteriores a 2020 antes de iterar" 
      },
      { 
        label: "Ordenação combinada", 
        code: `/** ($.expprof.pubs.$pub/--.sort((a,b) => a.year - b.year)--/) => { $pub.title } **/`,
        desc: "Ordena por ano antes de iterar" 
      },
    ],
    demo: {
      data: `{
  "year_start": 2018,
  "expprof": {
    "pubs": {
      "pub": [
        { "title": "Paper A", "year": 2022 },
        { "title": "Paper B", "year": 2024 }
      ]
    }
  }
}`,
      template: `Anos de experiência: /** /-- new Date().getFullYear() - $.year_start --/ **/

Publicações recentes:
/** ($.expprof.pubs.$pub/--.filter(p => p.year > 2020)--/) => {
  - $pub.title ($pub.year)
} **/`,
      output: `Anos de experiência: 8

Publicações recentes:
- Paper A (2022)
- Paper B (2024)`
    }
  },
  {
    id: "conditionals",
    title: "Condicionais — $(condição){ ... }",
    content: `Para verificar condições, usa-se **$(condição){ ... }**. A condição pode ser um placeholder ou uma expressão JavaScript com **/-- --/**.

**Sintaxe:** \\\$(\\\${condição}){ conteúdo }`,
    examples: [
      { 
        label: "Verificar se a secção existe", 
        code: `/** $( $.expprof.pubs/--!==undefined--/ ){ "Tem publicações" } **/`,
        desc: "Mostra 'Tem publicações' se a secção existir" 
      },
      { 
        label: "Verificar se há registos", 
        code: `/** $( $.expprof.pubs/--.length>0--/ ){ "\\nPublicações:\\n" } **/`,
        desc: "Mostra 'Publicações:' se houver pelo menos um registo" 
      },
      { 
        label: "Verificar campo específico", 
        code: `/** $( $.expprof.pubs.pub/--.some(p => p.year > 2020)--/ ){ "Tem publicações recentes" } **/`,
        desc: "Verifica se há alguma publicação depois de 2020" 
      },
    ],
    demo: {
      data: `{
  "expprof": {
    "pubs": {
      "pub": [
        { "title": "Paper A", "year": 2022 },
        { "title": "Paper B", "year": 2024 }
      ]
    }
  }
}`,
      template: `/** $( $.expprof.pubs/--!==undefined--/ ){
  ${"Secção de Publicações encontrada!\\n"}
  $( $.expprof.pubs/--.length>0--/ ){
    ${"Tem " + "/-- $.expprof.pubs.pub.length --/" + " publicações.\\n"}
  }
} **/`,
      output: `Secção de Publicações encontrada!
Tem 2 publicações.`
    }
  },
  {
    id: "spaces",
    title: "Espaços e quebras de linha",
    content: `A linguagem remove espaços por omissão. Para inserir explicitamente espaços e novas linhas, usa-se:

- **\\\\** (backslash + espaço) → insere um espaço
- **\\\\n** (backslash + n) → insere uma nova linha

**Nota:** Para escrever o símbolo \ (backslash) como texto, usa-se **\\\\\\\**.`,
    examples: [
      { 
        label: "Inserir espaço", 
        code: `/** $pub.title,\\ $pub.year **/`,
        desc: "Adiciona uma vírgula e um espaço entre título e ano" 
      },
      { 
        label: "Inserir nova linha", 
        code: `/** $pub.title\\n **/`,
        desc: "Adiciona uma nova linha após o título" 
      },
      { 
        label: "Combinado", 
        code: `/** \\"$pub.title\\" ($pub.year)\\n **/`,
        desc: "Título entre aspas, ano entre parênteses, nova linha no final" 
      },
    ],
    demo: {
      data: `{
  "expprof": {
    "pubs": {
      "pub": [
        { "title": "Deep Learning", "year": 2022 }
      ]
    }
  }
}`,
      template: `/** "\\"$pub.title\\", $pub.year\\n" **/`,
      output: `"Deep Learning", 2022`
    }
  },
  {
    id: "example",
    title: "Exemplo completo",
    content: `Aqui está um exemplo completo de um template CVQuery que gera um currículo estruturado a partir de dados JSON.`,
    demo: {
      data: `{
  "name": "Ana Silva",
  "contact": {
    "email": "ana@example.com",
    "phone": "+351 910 000 000"
  },
  "expprof": {
    "pubs": {
      "pub": [
        { "title": "Deep Learning em NLP", "year": 2022, "venue": "EPIA" },
        { "title": "Transformers para Português", "year": 2024, "venue": "PROPOR" }
      ]
    }
  },
  "education": [
    { "degree": "Mestrado em Informática", "year": 2020, "institution": "Universidade de Lisboa" }
  ]
}`,
      template: `=== /** $.name **/ ===
Email: /** $.contact.email **/
Tel: /** $.contact.phone **/

--- Educação ---
/** ($.education, [[year, DESC]]) => {
  $item.year — $item.degree ($item.institution)\\n
} **/

--- Publicações ---
/** $( $.expprof.pubs/--!==undefined && $.expprof.pubs.pub.length>0--/ ){
  ($.expprof.pubs.$pub, [[year, DESC]]) => {
    $pub.year — $pub.title. $pub.venue.\\n
  }
} **/`,
      output: `=== Ana Silva ===
Email: ana@example.com
Tel: +351 910 000 000

--- Educação ---
2020 — Mestrado em Informática (Universidade de Lisboa)

--- Publicações ---
2024 — Transformers para Português. PROPOR.
2022 — Deep Learning em NLP. EPIA.`
    }
  },
  {
    id: "formats",
    title: "Formatos de output",
    content: `O CVQuery pode gerar o resultado em múltiplos formatos, dependendo do renderizador utilizado:`,
    formats: [
      { key: "text", label: "📝 Texto", desc: "Output limpo em .txt, ideal para copiar." },
      { key: "html", label: "🌐 HTML", desc: "Página web pronta a publicar." },
      { key: "latex", label: "📄 LaTeX", desc: "Para compilar com pdflatex em artigos académicos." },
      { key: "markdown", label: "📊 Markdown", desc: "Para GitHub, Notion, ou qualquer editor Markdown." },
    ]
  },
  {
    id: "summary",
    title: "Resumo da Sintaxe",
    content: `**Resumo rápido da sintaxe CVQuery:**

| Elemento | Sintaxe | Exemplo |
|----------|---------|---------|
| **Delimitador** | \`/** ... **/\` | \`/** $.name **/\` |
| **Acesso à raiz** | \`$\` | \`$.contact.email\` |
| **Iteração** | \`$$.secção.registos.$nome{ ... }\` | \`$$.expprof.pubs.$pub{ $pub.title }\` |
| **Blocos especiais** | \`first:\`, \`common:\`, \`last:\` | \`first: { ... } common: { ... } last: { ... }\` |
| **Condicional** | \`$(condição){ ... }\` | \`$( $.expprof.pubs/--!==undefined--/ ){ ... }\` |
| **JavaScript embutido** | \`/-- código --/\` | \`/-- $pub.year > 2020 --/\` |
| **Espaço** | \`\\\\ \` (backslash + espaço) | \`$pub.title,\\ $pub.year\` |
| **Nova linha** | \`\\\\n\` | \`$pub.title\\n\` |
| **Ordenação** | \`[[campo, DIR]]\` | \`[[year, DESC]]\` |
| **Filtro** | \`/-- .filter(...) --/\` | \`/-- .filter(p => p.year > 2020) --/\` |
`
  }
];

export default function DocsPage() {
  const [active, setActive] = useState("intro");

  return (
    <>
      {/* Navbar */}
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
          }}>Referência completa da linguagem de templates — Baseado em https://curriculox.org/tutorials</p>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"240px 1fr", minHeight:"calc(100vh - 130px)" }}>
        {/* Sidebar */}
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

              {s.content && (
                <div style={{ fontSize: 14, color: "#4A4A4A", lineHeight: 1.8, marginBottom: 24, whiteSpace: "pre-wrap" }}>
                  {s.content}
                </div>
              )}

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