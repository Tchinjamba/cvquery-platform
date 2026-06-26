"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FilePlus, FileEdit, BookOpen, Code2, GraduationCap, Upload, Download, LogOut } from "lucide-react";

const NAV = [
  {
    label: "Managing Sections",
    items: [
      // ⭐ Alterado: Criar Nova Secção em primeiro
      { href: "/cvs/novo", icon: FilePlus, label: "Criar Nova Secção" },
      { href: "/dashboard", icon: LayoutDashboard, label: "Os meus CVs" },
    ]
  },
  {
    label: "Template Editor",
    items: [
      { href: "/template-editor", icon: FileEdit, label: "Editor de Templates" },
    ]
  },
  {
    label: "CV Query Language",
    items: [
      { href: "/cv-query", icon: BookOpen, label: "Documentação" },
      { href: "/examples", icon: Code2, label: "Exemplos" },
    ]
  },
  {
    label: "Importing from ORCID",
    items: [
      { href: "/import/orcid", icon: GraduationCap, label: "Import ORCID" },
    ]
  },
  {
    label: "Exporting your CV",
    items: [
      { href: "/export", icon: Download, label: "Exportar" },
    ]
  },
];

export default function Sidebar({ user, onLogout }) {
  const path = usePathname();
  const initials = user?.email ? user.email[0].toUpperCase() : "?";

  return (
    <>
      <style jsx>{`
        .sidebar {
          width: 260px;
          height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
          background: #FFFFFF;
          border-right: 1px solid #E0E0E0;
          display: flex;
          flex-direction: column;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif;
        }

        .sidebar-logo {
          padding: 24px 20px;
          border-bottom: 1px solid #E0E0E0;
          margin-bottom: 8px;
        }

        .logo-text {
          font-size: 20px;
          font-weight: 600;
          color: #1A1A1A;
          letter-spacing: -0.3px;
        }

        .logo-sub {
          font-size: 11px;
          color: #4A4A4A;
          margin-top: 4px;
          letter-spacing: 0.3px;
        }

        .sidebar-nav {
          flex: 1;
          padding: 0 12px;
          overflow-y: auto;
        }

        .nav-section-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #1A1A1A;
          padding: 16px 12px 6px 12px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          margin: 2px 0;
          border-radius: 8px;
          color: #1A1A1A;
          text-decoration: none;
          font-size: 14px;
          font-weight: 400;
          transition: all 0.15s ease;
        }

        .nav-item:hover {
          background: #DBEAFE;
          color: #1A1A1A;
        }

        .nav-item.active {
          background: #DBEAFE;
          color: #1A1A1A;
          font-weight: 500;
        }

        .nav-icon {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2563EB;
        }

        .nav-item.active .nav-icon {
          color: #2563EB;
        }

        .sidebar-footer {
          padding: 16px;
          border-top: 1px solid #E0E0E0;
        }

        .user-chip {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          background: #F5F5F5;
          border-radius: 10px;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #2563EB;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          font-size: 14px;
          font-weight: 500;
        }

        .user-email {
          font-size: 12px;
          font-weight: 500;
          color: #1A1A1A;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .logout-btn {
          background: none;
          border: 1px solid #E0E0E0;
          border-radius: 6px;
          color: #1A1A1A;
          font-size: 11px;
          cursor: pointer;
          padding: 4px 10px;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .logout-btn:hover {
          background: #FEE2E2;
          color: #DC2626;
          border-color: #FECACA;
        }

        .sidebar-nav::-webkit-scrollbar {
          width: 4px;
        }

        .sidebar-nav::-webkit-scrollbar-track {
          background: #F5F5F5;
          border-radius: 4px;
        }

        .sidebar-nav::-webkit-scrollbar-thumb {
          background: #E0E0E0;
          border-radius: 4px;
        }

        .sidebar-nav::-webkit-scrollbar-thumb:hover {
          background: #D1D5DB;
        }
      `}</style>

      <aside className="sidebar">
        <div className="sidebar-logo">
          <Link href="/">
            <div className="logo-text">CVQuery</div>
            <div className="logo-sub">Academic CV Platform</div>
          </Link>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((section) => (
            <div key={section.label}>
              <div className="nav-section-label">{section.label}</div>
              {section.items.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-item ${path.startsWith(item.href) ? "active" : ""}`}
                  >
                    <span className="nav-icon">
                      <IconComponent size={18} strokeWidth={1.5} />
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="user-email">{user?.email || "utilizador"}</div>
            </div>
            <button onClick={onLogout} className="logout-btn" title="Terminar sessão">
              <LogOut size={12} />
              Sair
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}