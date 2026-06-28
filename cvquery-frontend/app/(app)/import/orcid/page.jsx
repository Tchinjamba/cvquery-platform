"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams, useRouter } from "next/navigation";

export default function ImportOrcid() {
  const { api } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orcidId, setOrcidId] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [cvData, setCvData] = useState(null);
  const [cvName, setCvName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const success = searchParams.get('success');
    const errorParam = searchParams.get('error');
    if (success === 'true') {
      setMessage("✅ Conta ORCID ligada com sucesso!");
      setIsConnected(true);
    }
    if (errorParam === 'true') setError("❌ Erro ao ligar conta ORCID");
  }, [searchParams]);

  // ⭐ Função para ligar ao ORCID
  const connectOrcid = async () => {
    setError("");
    setMessage("");
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const token = localStorage.getItem("cvquery_token");
      
      const response = await fetch(`${API_URL}/api/orcid/auth`, {
        method: "GET",
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao ligar ORCID");
      }
      
      const data = await response.json();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error("URL de autorização não recebida");
      }
    } catch (err) {
      console.error("Erro ao ligar ORCID:", err);
      setError(err.message);
    }
  };

  // ⭐ Função para buscar dados do ORCID
  const fetchOrcidData = async () => {
    if (!orcidId) {
      setError("Por favor, insira o seu ORCID ID");
      return;
    }
    
    setFetching(true);
    setError("");
    
    try {
      const res = await api("/api/orcid/fetch", {
        method: "POST",
        body: JSON.stringify({ orcidId })
      });
      
      if (!res.ok) throw new Error("Erro ao buscar dados");
      
      const data = await res.json();
      setCvData(data);
      setCvName(`CV ORCID ${data.name || orcidId}`);
      setMessage("Dados importados com sucesso! Revise antes de criar o CV.");
    } catch (err) {
      setError(err.message);
    } finally {
      setFetching(false);
    }
  };

  // ⭐ Função para criar CV
  const createCV = async () => {
    setLoading(true);
    
    try {
      const res = await api("/api/orcid/create-cv", {
        method: "POST",
        body: JSON.stringify({ orcidId, cvData, cvName })
      });
      
      if (!res.ok) throw new Error("Erro ao criar CV");
      
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
          }}>Importar ORCID</h1>
          <p className="page-subtitle" style={{ 
            fontSize: "14px", 
            color: "rgba(255,255,255,0.8)" 
          }}>Importe automaticamente os seus dados académicos do ORCID</p>
        </div>
      </div>

      <div style={{ padding: "24px 32px", maxWidth: 800, margin: "0 auto" }}>
        {message && <div style={{ background: "#d1fae5", color: "#065f46", padding: 12, borderRadius: 8, marginBottom: 16 }}>{message}</div>}
        {error && <div style={{ background: "#fee2e2", color: "#dc2626", padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}

        {/* Passo 1: Ligar ORCID */}
        <div style={{ 
          background: "#F5F5F5", 
          borderRadius: 12, 
          padding: 24, 
          marginBottom: 24,
          border: "1px solid #E0E0E0"
        }}>
          <h3 style={{ fontWeight: 600, marginBottom: 12, color: "#1A1A1A" }}>1. Ligar conta ORCID</h3>
          <p style={{ color: "#4A4A4A", marginBottom: 16 }}>
            {isConnected ? "✅ Conta ORCID ligada!" : "Autorize a plataforma a aceder aos seus dados ORCID"}
          </p>
          <button 
            onClick={connectOrcid} 
            disabled={isConnected}
            style={{ 
              padding: "10px 20px", 
              background: isConnected ? "#16A34A" : "#003D8F", 
              color: "white", 
              border: "none", 
              borderRadius: 6, 
              cursor: isConnected ? "default" : "pointer",
              fontWeight: 500,
              opacity: isConnected ? 0.8 : 1
            }}
          >
            {isConnected ? "✅ Ligado" : "🔗 Ligar com ORCID"}
          </button>
        </div>

        {/* Passo 2: Inserir ORCID ID */}
        <div style={{ 
          background: "#F5F5F5", 
          borderRadius: 12, 
          padding: 24, 
          marginBottom: 24,
          border: "1px solid #E0E0E0"
        }}>
          <h3 style={{ fontWeight: 600, marginBottom: 12, color: "#1A1A1A" }}>2. Inserir ORCID ID</h3>
          <div style={{ display: "flex", gap: 12 }}>
            <input 
              type="text" 
              placeholder="0000-0000-0000-0000" 
              value={orcidId} 
              onChange={(e) => setOrcidId(e.target.value)} 
              style={{ 
                flex: 1, 
                padding: 10, 
                border: "1px solid #D1D5DB", 
                borderRadius: 6,
                background: "#FFFFFF",
                color: "#1A1A1A",
                fontSize: 14
              }} 
            />
            <button 
              onClick={fetchOrcidData} 
              disabled={fetching} 
              style={{ 
                padding: "10px 20px", 
                background: "#003D8F", 
                color: "white", 
                border: "none", 
                borderRadius: 6, 
                cursor: fetching ? "not-allowed" : "pointer",
                opacity: fetching ? 0.6 : 1,
                fontWeight: 500
              }}
            >
              {fetching ? "A buscar..." : "Buscar dados"}
            </button>
          </div>
        </div>

        {/* Passo 3: Dados importados */}
        {cvData && (
          <div style={{ 
            background: "#F5F5F5", 
            borderRadius: 12, 
            padding: 24,
            border: "1px solid #E0E0E0"
          }}>
            <h3 style={{ fontWeight: 600, marginBottom: 12, color: "#1A1A1A" }}>3. Dados importados</h3>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500, color: "#1A1A1A" }}>Nome do CV</label>
              <input 
                type="text" 
                value={cvName} 
                onChange={(e) => setCvName(e.target.value)} 
                style={{ 
                  width: "100%", 
                  padding: 10, 
                  border: "1px solid #D1D5DB", 
                  borderRadius: 6,
                  background: "#FFFFFF",
                  color: "#1A1A1A",
                  fontSize: 14
                }} 
              />
            </div>
            
            <div style={{ 
              marginBottom: 16, 
              padding: 16,
              background: "#FFFFFF",
              borderRadius: 8,
              border: "1px solid #E0E0E0",
              fontSize: 14,
              lineHeight: 1.8,
              color: "#1A1A1A"
            }}>
              <div><strong>Nome:</strong> {cvData.name} {cvData.surname}</div>
              <div><strong>Email:</strong> {cvData.email}</div>
              <div><strong>ORCID:</strong> {cvData.orcid}</div>
              <div><strong>Educação:</strong> {cvData.education?.length || 0} registos</div>
              <div><strong>Experiência:</strong> {cvData.experience?.length || 0} registos</div>
              <div><strong>Publicações:</strong> {cvData.publications?.length || 0} registos</div>
            </div>
            
            <button 
              onClick={createCV} 
              disabled={loading} 
              style={{ 
                width: "100%", 
                padding: 12, 
                background: "#003D8F", 
                color: "white", 
                border: "none", 
                borderRadius: 6, 
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                fontWeight: 500,
                fontSize: 15
              }}
            >
              {loading ? "A criar CV..." : "Criar CV a partir do ORCID"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}