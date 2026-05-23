import React, { useMemo, useState } from "react";

const USUARIO_ADMIN = "admin2026";

const PRIORIDAD = {
  "Viernes cena": 1,
  "Sábado comida": 2,
  "Sábado cena": 3,
  "Domingo comida": 4,
};

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

function fechaISO(date) {
  return date.toISOString().slice(0, 10);
}

function generarCalendarioRestante() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const year = hoy.getFullYear();
  const meses = [];

  for (let mes = hoy.getMonth(); mes < 12; mes++) {
    const primero = new Date(year, mes, 1);
    const ultimo = new Date(year, mes + 1, 0);
    const offset = (primero.getDay() + 6) % 7;
    const celdas = Array.from({ length: offset }, () => null);

    for (let dia = 1; dia <= ultimo.getDate(); dia++) {
      const fecha = new Date(year, mes, dia);
      fecha.setHours(0, 0, 0, 0);
      const pasado = fecha < hoy;
      const dow = fecha.getDay();
      const iso = fechaISO(fecha);
      const opciones = [];

      if (!pasado) {
        if (dow === 5) opciones.push({ id: `${iso}-vc`, turno: "Viernes cena", icono: "luna" });
        if (dow === 6) {
          opciones.push({ id: `${iso}-sc`, turno: "Sábado comida", icono: "sol" });
          opciones.push({ id: `${iso}-sn`, turno: "Sábado cena", icono: "luna" });
        }
        if (dow === 0) opciones.push({ id: `${iso}-dc`, turno: "Domingo comida", icono: "sol" });
      }

      celdas.push({ dia, iso, pasado, finde: dow === 0 || dow === 5 || dow === 6, opciones });
    }

    meses.push({ mes, nombre: MESES[mes], celdas });
  }

  return meses;
}

export default function App() {
  const calendario = useMemo(() => generarCalendarioRestante(), []);
  const todasOpciones = useMemo(
    () => calendario.flatMap((m) => m.celdas.filter(Boolean).flatMap((d) => d.opciones)),
    [calendario]
  );

  const [grupo, setGrupo] = useState("Cena de amigos");
  const [nombre, setNombre] = useState("");
  const [usuarioActivo, setUsuarioActivo] = useState(null);
  const [disponibilidad, setDisponibilidad] = useState({});

  const esAdmin = usuarioActivo === USUARIO_ADMIN;

  const entrar = () => {
    const limpio = nombre.trim();
    if (!limpio) return;
    setUsuarioActivo(limpio);
    setDisponibilidad((prev) => ({ ...prev, [limpio]: prev[limpio] || [] }));
  };

  const alternarDia = (id) => {
    if (!usuarioActivo) {
      alert("Primero escribe tu nombre y pulsa Entrar");
      return;
    }

    setDisponibilidad((prev) => {
      const actuales = prev[usuarioActivo] || [];
      const nuevos = actuales.includes(id)
        ? actuales.filter((x) => x !== id)
        : [...actuales, id];

      return { ...prev, [usuarioActivo]: nuevos };
    });
  };

  const conteoPorId = useMemo(() => {
    const mapa = {};

    todasOpciones.forEach((op) => {
      const asistentes = Object.entries(disponibilidad)
        .filter(([, dias]) => dias.includes(op.id))
        .map(([persona]) => persona);

      mapa[op.id] = { ...op, asistentes, total: asistentes.length };
    });

    return mapa;
  }, [todasOpciones, disponibilidad]);

  const ranking = useMemo(() => {
    return Object.values(conteoPorId)
      .sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total;
        const fechaA = a.id.slice(0, 10);
        const fechaB = b.id.slice(0, 10);
        if (fechaA !== fechaB) return fechaA.localeCompare(fechaB);
        return PRIORIDAD[a.turno] - PRIORIDAD[b.turno];
      })
      .slice(0, 3);
  }, [conteoPorId]);

  const resetear = () => {
    if (!esAdmin) return;
    const confirmar = window.confirm("¿Seguro que quieres resetear todos los votos?");
    if (confirmar) setDisponibilidad({});
  };

  const botonEstilo = {
    border: "none",
    borderRadius: 10,
    padding: "8px 10px",
    cursor: "pointer",
    fontWeight: "bold",
  };

  return (
    <div style={{ minHeight: "100vh", padding: 16, fontFamily: "Arial, sans-serif", background: "#f1f5f9" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <section style={{ background: "#2563eb", color: "white", padding: 20, borderRadius: 22, marginBottom: 18 }}>
          <h2 style={{ marginTop: 0 }}>🏆 Ranking de días más votados</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
            {ranking.map((item, index) => {
              const fecha = new Date(item.id.slice(0, 10));
              return (
                <div key={item.id} style={{ background: "rgba(255,255,255,.16)", padding: 14, borderRadius: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: 24 }}>#{index + 1}</strong>
                    <span style={{ fontSize: 24 }}>{item.icono === "sol" ? "☀️" : "🌙"}</span>
                  </div>
                  <div style={{ textTransform: "capitalize", marginTop: 8 }}>
                    {fecha.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}
                  </div>
                  <div style={{ fontSize: 36, fontWeight: "bold" }}>{item.total}</div>
                  <div>{item.total === 1 ? "persona disponible" : "personas disponibles"}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section style={{ background: "white", padding: 20, borderRadius: 22, marginBottom: 18 }}>
          <input
            value={grupo}
            onChange={(e) => setGrupo(e.target.value)}
            style={{ width: "100%", fontSize: 28, fontWeight: "bold", border: "1px solid #cbd5e1", borderRadius: 14, padding: 10, marginBottom: 12 }}
          />

          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && entrar()}
              placeholder="Escribe tu nombre"
              style={{ flex: 1, padding: 12, borderRadius: 12, border: "1px solid #cbd5e1" }}
            />
            <button onClick={entrar} style={{ ...botonEstilo, background: "#111827", color: "white" }}>Entrar</button>
          </div>

          {usuarioActivo && (
            <p>
              Has entrado como <strong>{esAdmin ? "Administrador" : usuarioActivo}</strong>.
              {esAdmin ? " Tienes opciones de administrador." : " Ya puedes marcar y desmarcar días."}
            </p>
          )}

          {esAdmin && (
            <button onClick={resetear} style={{ ...botonEstilo, background: "#dc2626", color: "white", marginTop: 8 }}>
              Resetear contador
            </button>
          )}
        </section>

        {calendario.map((mes) => (
          <section key={mes.mes} style={{ background: "white", borderRadius: 22, padding: 16, marginBottom: 18 }}>
            <h2 style={{ textAlign: "center" }}>{mes.nombre}</h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5, textAlign: "center", fontWeight: "bold", color: "#64748b" }}>
              {DIAS_SEMANA.map((d) => <div key={d}>{d}</div>)}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5, marginTop: 8 }}>
              {mes.celdas.map((dia, idx) => {
                if (!dia) return <div key={`vacio-${idx}`} />;

                return (
                  <div
                    key={dia.iso}
                    style={{
                      minHeight: 88,
                      border: "1px solid #e2e8f0",
                      borderRadius: 12,
                      padding: 5,
                      background: dia.pasado ? "#e5e7eb" : dia.finde ? "#ffffff" : "#f8fafc",
                      color: dia.pasado ? "#94a3b8" : "#0f172a",
                    }}
                  >
                    <div style={{ fontWeight: "bold", marginBottom: 4 }}>{dia.dia}</div>

                    {dia.opciones.map((op) => {
                      const marcado = usuarioActivo && disponibilidad[usuarioActivo]?.includes(op.id);
                      const total = conteoPorId[op.id]?.total || 0;
                      const colorSeleccionado = op.icono === "sol" ? "#f59e0b" : "#4f46e5";

                      return (
                        <button
                          key={op.id}
                          title={op.turno}
                          onClick={() => alternarDia(op.id)}
                          style={{
                            width: "100%",
                            marginTop: 4,
                            borderRadius: 10,
                            border: "1px solid #cbd5e1",
                            padding: 6,
                            cursor: "pointer",
                            background: marcado ? colorSeleccionado : "#e2e8f0",
                            color: marcado ? "white" : "#111827",
                            fontWeight: "bold",
                          }}
                        >
                          <span style={{ fontSize: 18 }}>{op.icono === "sol" ? "☀️" : "🌙"}</span> {total}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
