import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import CV from '@/models/CV';
import Template from '@/models/Template';
import { generatePDF } from '@/services/pdfGenerator';
import { generateHTML } from '@/services/htmlGenerator';
import { generateDocx } from '@/services/docxGenerator';

// Função auxiliar para aplicar filtros e tradução (igual à da página Exportar)
function applyTemplateRules(originalData, template) {
  if (!template) return originalData;
  const data = JSON.parse(JSON.stringify(originalData));

  // 1. Filtrar secções por tipo
  if (template.templateType && template.templateType !== 'all' && data.sections) {
    data.sections = data.sections.filter(
      section => section.category === template.templateType
    );
  }

  // 2. Traduzir para inglês se necessário
  if (template.language === 'en') {
    return translateObject(data);
  }

  return data;
}

function translateObject(obj) {
  const dict = {
    "Experiência Profissional": "Professional Experience",
    "Formação Académica": "Education",
    "Competências": "Skills",
    "Objetivo": "Objective",
    "Informações Pessoais": "Personal Information",
    "Nome": "Name",
    "Email": "Email",
    "Telefone": "Phone",
    "Localização": "Location",
    "Empresa": "Company",
    "Cargo": "Position",
    "Período": "Period",
    "Descrição": "Description",
    "Instituição": "Institution",
    "Curso": "Course",
    "Estado": "Status"
  };
  if (typeof obj === 'string') return dict[obj] || obj;
  if (Array.isArray(obj)) return obj.map(item => translateObject(item));
  if (obj && typeof obj === 'object') {
    const newObj = {};
    for (const [k, v] of Object.entries(obj)) {
      newObj[k] = translateObject(v);
    }
    return newObj;
  }
  return obj;
}

export async function POST(request) {
  try {
    await connectDB();
    const { cvId, templateId, format } = await request.json();

    if (!cvId || !templateId || !format) {
      return NextResponse.json(
        { error: 'Dados incompletos. Envie cvId, templateId e format.' },
        { status: 400 }
      );
    }

    const cv = await CV.findById(cvId);
    const template = await Template.findById(templateId);

    if (!cv) {
      return NextResponse.json({ error: 'CV não encontrado' }, { status: 404 });
    }
    if (!template) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 });
    }

    // Aplicar regras do template aos dados do CV
    const processedData = applyTemplateRules(cv.data || {}, template);

    // Gerar o ficheiro no formato solicitado (a implementação destas funções depende das bibliotecas que escolher)
    let fileBuffer, contentType, fileName;

    switch (format) {
      case 'pdf':
        fileBuffer = await generatePDF(processedData, template);
        contentType = 'application/pdf';
        fileName = `${cv.name || 'cv'}.pdf`;
        break;
      case 'html':
        fileBuffer = await generateHTML(processedData, template);
        contentType = 'text/html';
        fileName = `${cv.name || 'cv'}.html`;
        break;
      case 'docx':
        fileBuffer = await generateDocx(processedData, template);
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        fileName = `${cv.name || 'cv'}.docx`;
        break;
      default:
        return NextResponse.json({ error: 'Formato não suportado' }, { status: 400 });
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error('Erro na exportação:', error);
    return NextResponse.json(
      { error: 'Erro interno ao exportar o CV' },
      { status: 500 }
    );
  }
}