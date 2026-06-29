// lib/examples.js
export const INITIAL_EXAMPLES = [
    {
        name: "Cabeçalho simples",
        body: `Nome: /** $.name **/
Email: /** $.contact.email **/
Telefone: /** $.contact.phone **/`
    },
    {
        name: "Profissional (oficial)",
        body: `/** $.name **/

/** $.contact.email **/  /** $.contact.phone **/

/** $( $.experience/--!==undefined && $.experience.length > 0 --/ ){
  Experiência Profissional:
  /** ($.experience.$exp, [[startDate, DESC]]) => {
    $exp.position na $exp.company
    Período: $exp.startDate - $( $exp.endDate/--!==undefined--/ ){ $exp.endDate }{ Presente }
    $( $exp.responsibilities/--!==undefined--/ ){
      Responsabilidades:
      $exp.responsibilities.$resp{
        • $resp\\n
      }
    }
    \\n
  } **/
} **/

/** $( $.skills/--!==undefined && $.skills.length > 0 --/ ){
  Competências:
  /** ($.skills.$skill) => {
    • $skill\\n
  } **/
} **/`
    },
    {
        name: "Académico (oficial)",
        body: `/** $.name **/

/** $.contact.email **/  /** $.contact.phone **/
ORCID: /** $.orcid **/

/** $( $.publications/--!==undefined && $.publications.length > 0 --/ ){
  Publicações:
  /** ($.publications.$pub, [[year, DESC]]) => {
    • "$pub.title" ($pub.year) - $pub.journal\\n
  } **/
} **/

/** $( $.education/--!==undefined && $.education.length > 0 --/ ){
  Formação Académica:
  /** ($.education.$edu, [[year, DESC]]) => {
    • $edu.degree em $edu.institution ($edu.year)\\n
  } **/
} **/`
    },
    {
        name: "Completo (oficial)",
        body: `=== /** $.name **/ ===
Email: /** $.contact.email **/
Telefone: /** $.contact.phone **/

/** $( $.objective/--!==undefined --/ ){
  Objetivo:
  /** $.objective **/
} **/

/** $( $.experience/--!==undefined && $.experience.length > 0 --/ ){
  Experiência Profissional:
  /** ($.experience.$exp, [[startDate, DESC]]) => {
    $exp.position na $exp.company
    Período: $exp.startDate - $( $exp.endDate/--!==undefined--/ ){ $exp.endDate }{ Presente }
    $( $exp.responsibilities/--!==undefined--/ ){
      Responsabilidades:
      $exp.responsibilities.$resp{
        • $resp\\n
      }
    }
    \\n
  } **/
} **/

/** $( $.education/--!==undefined && $.education.length > 0 --/ ){
  Formação Académica:
  /** ($.education.$edu, [[year, DESC]]) => {
    • $edu.degree em $edu.institution ($edu.year)\\n
  } **/
} **/

/** $( $.publications/--!==undefined && $.publications.length > 0 --/ ){
  Publicações:
  /** ($.publications.$pub, [[year, DESC]]) => {
    • "$pub.title" ($pub.year) - $pub.journal\\n
  } **/
} **/

/** $( $.skills/--!==undefined && $.skills.length > 0 --/ ){
  Competências:
  /** ($.skills.$skill) => {
    • $skill\\n
  } **/
} **/

/** $( $.languages/--!==undefined && $.languages.length > 0 --/ ){
  Idiomas:
  /** ($.languages.$lang) => {
    • $lang.name - $lang.level\\n
  } **/
} **/

/** $( $.certifications/--!==undefined && $.certifications.length > 0 --/ ){
  Certificados:
  /** ($.certifications.$cert) => {
    • $cert.title - $cert.institution ($cert.date)\\n
  } **/
} **/`
    }
];