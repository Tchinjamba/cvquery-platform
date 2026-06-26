"use client";
import { useState, useCallback } from "react";

function getType(v) {
    if (v === null) return "null";
    if (Array.isArray(v)) return "array";
    return typeof v;
}

function ValueEditor({ value, onSave, onCancel }) {
    const [val, setVal] = useState(String(value === null ? "null" : value));
    return (
        <input
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onBlur={() => {
                let v = val;
                if (!isNaN(v) && v !== "") v = Number(v);
                else if (v === "true") v = true;
                else if (v === "false") v = false;
                else if (v === "null") v = null;
                onSave(v);
            }}
            onKeyDown={(e) => {
                if (e.key === "Enter") e.target.blur();
                if (e.key === "Escape") onCancel();
            }}
            className="inline-input"
            style={{ width: Math.max(80, val.length * 8 + 16) + "px" }}
        />
    );
}

function KeyEditor({ keyName, onSave, onCancel }) {
    const [val, setVal] = useState(keyName);
    return (
        <input
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onBlur={() => onSave(val.trim() || keyName)}
            onKeyDown={(e) => {
                if (e.key === "Enter") e.target.blur();
                if (e.key === "Escape") onCancel();
            }}
            className="inline-input key-input"
            style={{ width: Math.max(60, val.length * 8 + 16) + "px" }}
        />
    );
}

function TreeNode({ nodeKey, value, path, onUpdate, onDelete, depth = 0 }) {
    const [collapsed, setCollapsed] = useState(depth > 2);
    const [editingVal, setEditingVal] = useState(false);
    const [editingKey, setEditingKey] = useState(false);
    const type = getType(value);
    const isComplex = type === "object" || type === "array";
    const pathStr = path.length
        ? path.map((p, i) => (typeof p === "number" ? `[${p}]` : (i === 0 ? p : `.${p}`))).join("")
        : "$";

    const handleValSave = (newVal) => {
        setEditingVal(false);
        onUpdate(path, newVal);
    };

    const handleKeySave = (newKey) => {
        setEditingKey(false);
        if (newKey !== nodeKey) onUpdate([...path.slice(0, -1), "__renameKey__"], { oldKey: nodeKey, newKey, path });
    };

    const handleAddField = () => {
        const key = prompt("Nome do novo campo:");
        if (key) onUpdate([...path, key], "");
    };

    const handleAddItem = () => {
        onUpdate([...path, value.length], "");
    };

    const valClass =
        type === "string" ? "val-str" :
            type === "number" ? "val-num" :
                type === "boolean" ? "val-bool" : "val-null";

    return (
        <div className="tree-node">
            <div
                className="node-row"
                onMouseEnter={(e) => {
                    const bar = document.getElementById("path-display");
                    if (bar) bar.textContent = "$ " + pathStr + "  ·  " + type;
                }}
            >
                <span
                    className={`toggle-btn ${!isComplex ? "invisible" : ""}`}
                    onClick={() => isComplex && setCollapsed(!collapsed)}
                >
                    {isComplex ? (collapsed ? "▶" : "▼") : ""}
                </span>

                {nodeKey !== undefined && (
                    <>
                        {editingKey ? (
                            <KeyEditor keyName={String(nodeKey)} onSave={handleKeySave} onCancel={() => setEditingKey(false)} />
                        ) : (
                            <span
                                className={`key-label ${typeof nodeKey === "number" ? "key-idx" : ""}`}
                                onClick={() => typeof nodeKey !== "number" && setEditingKey(true)}
                                title={typeof nodeKey !== "number" ? "Clica para renomear" : ""}
                            >
                                {typeof nodeKey === "number" ? `[${nodeKey}]` : `"${nodeKey}"`}
                            </span>
                        )}
                        <span className="colon">:</span>
                    </>
                )}

                {isComplex ? (
                    <span className="type-preview">
                        {type === "array" ? `[ ${value.length} items ]` : `{ ${Object.keys(value).length} keys }`}
                    </span>
                ) : editingVal ? (
                    <ValueEditor value={value} onSave={handleValSave} onCancel={() => setEditingVal(false)} />
                ) : (
                    <span className={valClass} onClick={() => setEditingVal(true)} title="Clica para editar">
                        {type === "string" ? `"${value}"` : String(value)}
                    </span>
                )}

                {onDelete && (
                    <button className="del-btn" onClick={() => onDelete(path)} title="Remover">
                        ×
                    </button>
                )}
            </div>

            {isComplex && !collapsed && (
                <div className="node-children">
                    {type === "array"
                        ? value.map((item, i) => (
                            <TreeNode
                                key={i}
                                nodeKey={i}
                                value={item}
                                path={[...path, i]}
                                onUpdate={onUpdate}
                                onDelete={onDelete}
                                depth={depth + 1}
                            />
                        ))
                        : Object.entries(value).map(([k, v]) => (
                            <TreeNode
                                key={k}
                                nodeKey={k}
                                value={v}
                                path={[...path, k]}
                                onUpdate={onUpdate}
                                onDelete={onDelete}
                                depth={depth + 1}
                            />
                        ))}
                    <button
                        className="add-field-btn"
                        onClick={type === "array" ? handleAddItem : handleAddField}
                    >
                        + {type === "array" ? "item" : "campo"}
                    </button>
                </div>
            )}
        </div>
    );
}

export default function JsonEditor({ value, onChange }) {
    const [tab, setTab] = useState("tree");
    const [rawText, setRawText] = useState("");
    const [rawError, setRawError] = useState("");

    const handleUpdate = useCallback(
        (path, newVal) => {
            const clone = JSON.parse(JSON.stringify(value));

            if (path[path.length - 1] === "__renameKey__") {
                const { oldKey, newKey, path: fullPath } = newVal;
                let obj = clone;
                for (let i = 0; i < fullPath.length - 2; i++) obj = obj[fullPath[i]];
                const entries = Object.entries(obj);
                const rebuilt = {};
                entries.forEach(([k, v]) => { rebuilt[k === oldKey ? newKey : k] = v; });
                Object.keys(obj).forEach((k) => delete obj[k]);
                Object.assign(obj, rebuilt);
                onChange(clone);
                return;
            }

            let obj = clone;
            for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]];
            obj[path[path.length - 1]] = newVal;
            onChange(clone);
        },
        [value, onChange]
    );

    const handleDelete = useCallback(
        (path) => {
            const clone = JSON.parse(JSON.stringify(value));
            let obj = clone;
            for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]];
            const key = path[path.length - 1];
            if (Array.isArray(obj)) obj.splice(key, 1);
            else delete obj[key];
            onChange(clone);
        },
        [value, onChange]
    );

    const handleAddRoot = () => {
        const key = prompt("Nome do novo campo:");
        if (key) handleUpdate([key], "");
    };

    const handleApplyRaw = () => {
        try {
            const parsed = JSON.parse(rawText);
            onChange(parsed);
            setRawError("");
            setTab("tree");
        } catch (e) {
            setRawError("JSON inválido: " + e.message);
        }
    };

    const handleTabSwitch = (t) => {
        if (t === "raw") setRawText(JSON.stringify(value, null, 2));
        setRawError("");
        setTab(t);
    };

    return (
        <div className="json-editor">
            <style>{`
        .json-editor { 
            font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace; 
            font-size: 13px; 
            background: #FFFFFF;
            border: 1px solid #E0E0E0;
            border-radius: 8px;
            overflow: hidden;
        }
        .je-toolbar { 
            display:flex; 
            gap:8px; 
            align-items:center; 
            padding:10px 14px; 
            background: #F5F5F5; 
            border-bottom: 1px solid #E0E0E0; 
            flex-wrap:wrap; 
        }
        .je-tab-bar { 
            display:flex; 
            border-bottom: 1px solid #E0E0E0; 
            background: #F5F5F5; 
        }
        .je-tab { 
            padding:8px 20px; 
            font-size:12px; 
            cursor:pointer; 
            color: #4A4A4A; 
            border-bottom: 2px solid transparent; 
            font-weight: 500;
        }
        .je-tab.active { 
            color: #1A1A1A; 
            border-bottom-color: #2563EB; 
        }
        .path-bar { 
            padding:6px 14px; 
            background: #FFFFFF; 
            border-bottom: 1px solid #E0E0E0; 
            font-size:11px; 
            color: #4A4A4A; 
            min-height:28px; 
            font-family: monospace; 
        }
        .tree-wrap { 
            padding:12px 14px; 
            background: #FFFFFF; 
            min-height:200px; 
            overflow:auto; 
        }
        .tree-node { margin:1px 0; }
        .node-row { 
            display:flex; 
            align-items:center; 
            gap:5px; 
            padding:2px 4px; 
            border-radius:4px; 
            cursor:default; 
        }
        .node-row:hover { background: #F5F5F5; }
        .node-row:hover .del-btn { opacity:1; }
        .toggle-btn { 
            width:14px; 
            font-size:9px; 
            color: #4A4A4A; 
            cursor:pointer; 
            flex-shrink:0; 
            text-align:center; 
            user-select:none; 
        }
        .toggle-btn.invisible { visibility:hidden; }
        .key-label { 
            color: #2563EB; 
            cursor:pointer; 
        }
        .key-label:hover { text-decoration:underline; }
        .key-idx { color: #4A4A4A; cursor:default; }
        .colon { color: #4A4A4A; }
        .type-preview { color: #4A4A4A; font-size:11px; }
        .val-str { color: #1A1A1A; cursor:pointer; }
        .val-num { color: #2563EB; cursor:pointer; }
        .val-bool { color: #2563EB; cursor:pointer; }
        .val-null { color: #4A4A4A; cursor:pointer; }
        .val-str:hover, .val-num:hover, .val-bool:hover, .val-null:hover { text-decoration:underline; }
        .node-children { 
            margin-left:22px; 
            border-left: 1px solid #E0E0E0; 
            padding-left:10px; 
        }
        .del-btn { 
            opacity:0; 
            background:none; 
            border:none; 
            color: #DC2626; 
            cursor:pointer; 
            font-size:14px; 
            padding:0 4px; 
            line-height:1; 
            margin-left:auto; 
            flex-shrink:0; 
        }
        .del-btn:hover { color: #B91C1C; }
        .add-field-btn { 
            margin-top:4px; 
            font-size:11px; 
            padding:2px 8px; 
            background:none; 
            border: 1px dashed #D1D5DB; 
            border-radius:4px; 
            color: #4A4A4A; 
            cursor:pointer; 
            font-family:monospace; 
        }
        .add-field-btn:hover { 
            border-color: #2563EB; 
            color: #2563EB; 
        }
        .inline-input { 
            font-family:monospace; 
            font-size:13px; 
            padding:1px 6px; 
            background: #FFFFFF; 
            border: 1px solid #2563EB; 
            border-radius:4px; 
            color: #1A1A1A; 
            outline:none; 
        }
        .key-input { color: #2563EB; }
        .raw-area { 
            width:100%; 
            min-height:300px; 
            font-family:monospace; 
            font-size:13px; 
            padding:14px; 
            background: #FFFFFF; 
            color: #1A1A1A; 
            border:none; 
            outline:none; 
            resize:vertical; 
            border-bottom: 1px solid #E0E0E0; 
        }
        .raw-err { 
            color: #DC2626; 
            font-size:12px; 
            padding:8px 14px; 
            background: #FEF2F2; 
            border-bottom: 1px solid #E0E0E0; 
        }
        .je-btn { 
            font-size:12px; 
            padding:4px 12px; 
            background:none; 
            border: 1px solid #D1D5DB; 
            border-radius:6px; 
            color: #1A1A1A; 
            cursor:pointer; 
            font-family:monospace; 
            transition: all 0.2s;
        }
        .je-btn:hover { 
            border-color: #2563EB; 
            color: #2563EB; 
        }
        .je-btn.accent { 
            background: #2563EB; 
            border-color: #2563EB; 
            color: #FFFFFF; 
        }
        .je-btn.accent:hover { 
            background: #1E40AF; 
            border-color: #1E40AF; 
        }
      `}</style>

            <div className="je-toolbar">
                <button className="je-btn" onClick={handleAddRoot}>+ campo raiz</button>
                <button className="je-btn" onClick={() => navigator.clipboard?.writeText(JSON.stringify(value, null, 2))}>
                    copiar JSON
                </button>
                {tab === "raw" && (
                    <button className="je-btn accent" onClick={handleApplyRaw}>aplicar</button>
                )}
            </div>

            <div className="je-tab-bar">
                <div className={`je-tab ${tab === "tree" ? "active" : ""}`} onClick={() => handleTabSwitch("tree")}>Árvore</div>
                <div className={`je-tab ${tab === "raw" ? "active" : ""}`} onClick={() => handleTabSwitch("raw")}>JSON bruto</div>
            </div>

            <div className="path-bar" id="path-display">$</div>

            {tab === "tree" ? (
                <div className="tree-wrap">
                    {Object.entries(value || {}).map(([k, v]) => (
                        <TreeNode
                            key={k}
                            nodeKey={k}
                            value={v}
                            path={[k]}
                            onUpdate={handleUpdate}
                            onDelete={handleDelete}
                            depth={0}
                        />
                    ))}
                    {Object.keys(value || {}).length === 0 && (
                        <div style={{ color: "#4A4A4A", fontSize: "13px", padding: "8px 0" }}>
                            Objeto vazio — clica em "+ campo raiz" para começar.
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <textarea
                        className="raw-area"
                        value={rawText}
                        onChange={(e) => { setRawText(e.target.value); setRawError(""); }}
                        spellCheck={false}
                    />
                    {rawError && <div className="raw-err">{rawError}</div>}
                </>
            )}
        </div>
    );
}