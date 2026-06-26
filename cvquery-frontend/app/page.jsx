"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function LandingPage() {
  useEffect(() => {
    const handleAnchorClick = (e) => {
      const href = e.currentTarget.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', handleAnchorClick);
    });

    return () => {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.removeEventListener('click', handleAnchorClick);
      });
    };
  }, []);

  const showCreationInfo = () => {
    alert(`Informações sobre a Criação da Plataforma CVQuery:\n\n` +
      `A plataforma CVQuery foi desenvolvida sob a orientação do Professor Dr. Paulo Matos,\n` +
      `docente do Instituto Politécnico de Bragança (IPB).\n\n` +
      `Tecnologias Utilizadas:\n` +
      `• Frontend: Next.js, React, JavaScript\n` +
      `• Backend: Node.js, TypeScript\n` +
      `• Banco de Dados: MongoDB\n` +
      `• Documentação: LaTeX\n\n` +
      `Data de Lançamento: 2026\n` +
      `Versão Atual: 2.0.0`);
  };

  return (
    <>
      <style jsx global>{`
        :root {
          --bg-primary: #FFFFFF;
          --bg-secondary: #FFFFFF;
          --bg-hover: #003D8F;
          --text: #1A1A1A;
          --text-2: #4A4A4A;
          --text-3: #9CA3AF;
          --border: #E0E0E0;
          --accent: #003D8F;
          --accent-dark: #002B6B;
          --accent-light: #DBEAFE;
          --footer-bg: #2C2C2C;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Times New Roman', Times, serif;
          line-height: 1.6;
          color: var(--text);
          background: var(--bg-primary);
        }

        .navbar {
          background: #FFFFFF;
          box-shadow: 0 2px 20px rgba(0,0,0,0.05);
          position: fixed;
          top: 0;
          width: 100%;
          z-index: 1000;
          padding: 1rem 2rem;
          border-bottom: 1px solid #E0E0E0;
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          font-size: 1.5rem;
          font-weight: bold;
          color: #1A1A1A;
          text-decoration: none;
          font-family: 'Times New Roman', Times, serif;
        }

        .logo-sub {
          font-size: 0.7rem;
          color: #4A4A4A;
          display: block;
          font-family: 'Times New Roman', Times, serif;
        }

        .nav-links {
          display: flex;
          gap: 2rem;
          align-items: center;
        }

        .nav-links a {
          text-decoration: none;
          color: #1A1A1A;
          font-weight: 500;
          transition: color 0.3s;
          cursor: pointer;
          font-family: 'Times New Roman', Times, serif;
        }

        .nav-links a:hover {
          color: #003D8F;
        }

        .btn-nav {
          padding: 0.5rem 1.2rem;
          border-radius: 25px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s;
          text-decoration: none;
          display: inline-block;
          font-family: 'Times New Roman', Times, serif;
        }

        .btn-login {
          background: transparent;
          border: 2px solid #003D8F;
          color: #003D8F;
        }

        .btn-login:hover {
          background: #003D8F;
          color: #FFFFFF;
        }

        .btn-register {
          background: #003D8F;
          color: #FFFFFF;
        }

        .btn-register:hover {
          background: #002B6B;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 61, 143, 0.4);
        }

        .container {
          max-width: 1200px;
          margin: 80px auto 0;
          padding: 2rem;
        }

        .hero {
          background: var(--accent);
          border-radius: 20px;
          padding: 4rem;
          margin-bottom: 2rem;
          text-align: center;
          border: none;
        }

        .hero h1 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          color: #FFFFFF;
          font-family: 'Times New Roman', Times, serif;
        }

        .hero p {
          font-size: 1.2rem;
          color: rgba(255,255,255,0.9);
          margin-bottom: 2rem;
          font-family: 'Times New Roman', Times, serif;
        }

        .hero-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .card {
          background: var(--accent);
          border-radius: 15px;
          padding: 2rem;
          text-align: center;
          transition: transform 0.3s, box-shadow 0.3s;
          border: none;
        }

        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        .card-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          color: #FFFFFF;
        }

        .card h3 {
          margin-bottom: 1rem;
          color: #FFFFFF;
          font-family: 'Times New Roman', Times, serif;
        }

        .card p {
          color: rgba(255,255,255,0.85);
          font-family: 'Times New Roman', Times, serif;
        }

        .language-section {
          background: var(--accent);
          border-radius: 20px;
          padding: 3rem;
          margin-bottom: 2rem;
          border: none;
        }

        .language-section h2 {
          color: #FFFFFF;
          margin-bottom: 1rem;
          font-family: 'Times New Roman', Times, serif;
        }

        .language-section p {
          color: rgba(255,255,255,0.9);
          font-family: 'Times New Roman', Times, serif;
        }

        .tech-stack {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          margin: 2rem 0;
        }

        .tech-badge {
          background: rgba(255,255,255,0.2);
          color: #FFFFFF;
          padding: 0.5rem 1rem;
          border-radius: 25px;
          font-weight: 600;
          border: 1px solid rgba(255,255,255,0.2);
          font-family: 'Times New Roman', Times, serif;
        }

        .code-example {
          background: #1A1A1A;
          border-radius: 12px;
          padding: 1.5rem;
          margin: 2rem 0;
          overflow-x: auto;
        }

        .code-example pre {
          color: #FFFFFF;
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 14px;
          line-height: 1.5;
          margin: 0;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          margin-top: 2rem;
        }

        .btn {
          padding: 0.8rem 1.5rem;
          border: none;
          border-radius: 25px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s;
          font-size: 1rem;
          text-decoration: none;
          display: inline-block;
          text-align: center;
          font-family: 'Times New Roman', Times, serif;
        }

        .btn-primary {
          background: #FFFFFF;
          color: var(--accent);
        }

        .btn-primary:hover {
          background: rgba(255,255,255,0.85);
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }

        .btn-secondary {
          background: transparent;
          color: #FFFFFF;
          border: 2px solid #FFFFFF;
        }

        .btn-secondary:hover {
          background: rgba(255,255,255,0.15);
        }

        .footer-nav {
          background: #2C2C2C;
          color: rgba(255,255,255,0.7);
          padding: 2rem;
          margin-top: 3rem;
          border-radius: 20px;
        }

        .footer-links {
          display: flex;
          justify-content: center;
          gap: 2rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }

        .footer-links a {
          color: rgba(255,255,255,0.9);
          text-decoration: none;
          transition: color 0.3s;
          cursor: pointer;
          font-family: 'Times New Roman', Times, serif;
        }

        .footer-links a:hover {
          color: #FFFFFF;
        }

        .copyright {
          text-align: center;
          margin-top: 1rem;
          color: rgba(255,255,255,0.5);
          font-size: 0.9rem;
          font-family: 'Times New Roman', Times, serif;
        }

        @media (max-width: 768px) {
          .nav-container {
            flex-direction: column;
            gap: 1rem;
          }
          
          .nav-links {
            flex-wrap: wrap;
            justify-content: center;
          }
          
          .hero h1 {
            font-size: 1.8rem;
          }
          
          .hero {
            padding: 2rem;
          }
        }
      `}</style>

      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-container">
          <Link href="/" className="logo">
            CVQuery
            <span className="logo-sub">Academic Platform</span>
          </Link>
          <div className="nav-links">
            <a href="#home">Início</a>
            <a href="#sobre">Sobre</a>
            <a href="#linguagem">Linguagem</a>
            <a href="#exemplo">Exemplo</a>
            {/* ⭐ BOTÃO "Entrar" - abre com tab "login" ativa */}
            <Link href="/login?tab=login" className="btn-nav btn-login">Entrar</Link>
            {/* ⭐ BOTÃO "Criar conta" - abre com tab "register" ativa */}
            <Link href="/login?tab=register" className="btn-nav btn-register">Criar conta</Link>
          </div>
        </div>
      </nav>

      <div className="container" id="home">
        <div className="hero">
          <h1>Bem Vindo a plataforma CVQuery</h1>
          <p>A plataforma para gestão e exportação de CVs académicos</p>
          <div className="hero-buttons">
            {/* ⭐ BOTÃO "Começar Agora" - abre com tab "register" ativa */}
            <Link href="/login?tab=register" className="btn btn-primary">Começar Agora</Link>
            <a href="#sobre" className="btn btn-secondary">Saber Mais</a>
          </div>
        </div>

        <div className="features">
          <div className="card">
            <div className="card-icon">📊</div>
            <h3>Manipulação de Dados</h3>
            <p>Interaja facilmente com bases de dados usando nossa linguagem intuitiva</p>
          </div>
          <div className="card">
            <div className="card-icon">📄</div>
            <h3>Ficheiros Documentais</h3>
            <p>Crie e manipule documentos de forma simples e eficiente</p>
          </div>
          <div className="card">
            <div className="card-icon">🚀</div>
            <h3>Alta Performance</h3>
            <p>Processamento rápido e eficiente com tecnologias modernas</p>
          </div>
        </div>

        <div className="language-section" id="linguagem">
          <h2>Sobre a Linguagem CVQuery</h2>
          <p>A linguagem <strong>CVQuery</strong> foi criada pelo <strong>Professor Doutor Paulo Matos</strong>, docente do Instituto Politécnico de Bragança (IPB), com o objetivo de criar uma ponte entre JavaScript, LaTeX e TypeScript para manipulação avançada de dados.</p>

          <div className="tech-stack">
            <span className="tech-badge">JavaScript</span>
            <span className="tech-badge">TypeScript</span>
            <span className="tech-badge">LaTeX</span>
            <span className="tech-badge">Node.js</span>
            <span className="tech-badge">MongoDB</span>
          </div>

          <p>O CVQuery combina o melhor destas tecnologias para criar uma linguagem que torna fácil a interação do utilizador com a base de dados, permitindo a criação de ficheiros documentais manipuláveis de forma intuitiva e poderosa.</p>
        </div>

        <div className="language-section" id="exemplo">
          <h2>Exemplo de Código</h2>
          <p>Veja como é simples utilizar a CV Query Language:</p>

          <div className="code-example">
            <pre>{`
// Query para extrair dados do CV
$$.publications.$pub{
  "$pub.title" ("$pub.year")
}

// Saída:
"Innovation in CV Management" (2025)
"LaTeX for Academics" (2024)
            `}</pre>
          </div>
        </div>

        <div className="language-section" id="sobre">
          <h2>Sobre a Plataforma</h2>
          <p>O CVQuery é mais do que uma simples ferramenta - é um ecossistema completo para gestão documental. Nossa plataforma oferece:</p>
          <ul style={{ marginTop: "1rem", marginLeft: "2rem", color: "#FFFFFF", fontFamily: "'Times New Roman', Times, serif" }}>
            <li>Interface intuitiva e amigável</li>
            <li>Suporte a múltiplos formatos de exportação</li>
            <li>Integração com bases de dados modernas</li>
            <li>Processamento em tempo real</li>
            <li>API RESTful para integração com outras aplicações</li>
          </ul>
          <div className="action-buttons">
            {/* ⭐ BOTÃO "Aceder à Plataforma" - abre com tab "login" ativa */}
            <Link href="/login?tab=login" className="btn btn-primary">Aceder à Plataforma</Link>
          </div>
        </div>

        <div className="footer-nav">
          <div className="footer-links">
            <a href="#home">Início</a>
            <a href="#sobre">Sobre a Plataforma</a>
            <a href="#linguagem">Sobre CVQuery</a>
            <Link href="/login">Login</Link>
            <a onClick={showCreationInfo}>Criação da Plataforma</a>
          </div>
          <div className="copyright">
            <p>&copy; 2026 CVQuery - Plataforma criada por Emília Nunes  (IPB)</p>
            <p>Todos os direitos reservados</p>
          </div>
        </div>
      </div>
    </>
  );
}