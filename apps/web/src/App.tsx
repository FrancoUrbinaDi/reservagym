// apps/web/src/App.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { useState, useEffect } from 'react';
import { clearTokens, getRefreshToken } from './authStorage';
import './App.css';

type Reserva = {
  id: string;
  nombreUsuario: string;
  descripcion?: string | null;
  estado: 'ACTIVA' | 'CANCELADA' | 'COMPLETADA';
  dueDate?: string | null;
  userId: string;
};

type AdminReserva = Reserva & {
  userId: string;
};

type Me = {
  sub: string;
  email: string;
  name?: string;
  role?: 'USER' | 'ADMIN';
};

export default function App({ onLogout }: { onLogout: () => void }) {
  const qc = useQueryClient();

  // --- QUIÉN SOY (JWT /auth/me) ---
  const { data: me, isLoading: meLoading, error: meError } = useQuery<Me>({
    queryKey: ['me'],
    queryFn: async () => (await api.get('/auth/me')).data,
  });

  // --- reservas DEL USUARIO LOGUEADO ---
  const {
    data: reservas,
    isLoading: reservasLoading,
    error: reservasError,
  } = useQuery<Reserva[]>({
    queryKey: ['reservas'],
    queryFn: async () => (await api.get('/reservas')).data,
    enabled: !!me,
  });

  // --- TODAS LAS reservas (SOLO ADMIN) ---
  const {
    data: adminReservas,
    isLoading: adminLoading,
    error: adminError,
  } = useQuery<AdminReserva[]>({
    queryKey: ['reservas-admin'],
    queryFn: async () => (await api.get('/reservas/admin/all')).data,
    enabled: !!me && me.role === 'ADMIN',
  });

  // Estado para CREAR reservas
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [estado, setEstado] = useState<'ACTIVA' | 'CANCELADA' | 'COMPLETADA'>('ACTIVA');
  const [dueDate, setDueDate] = useState('');

// Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<'TODAS' | 'ACTIVA' | 'CANCELADA' | 'COMPLETADA'>('TODAS');
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [adminFilterEstado, setAdminFilterEstado] = useState<'TODAS' | 'ACTIVA' | 'CANCELADA' | 'COMPLETADA'>('TODAS');


  // Estado para EDITAR reservas
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNombreUsuario, setEditingNombreUsuario] = useState('');
  const [editingDescripcion, setEditingDescripcion] = useState('');
  const [editingEstado, setEditingEstado] = useState<'ACTIVA' | 'CANCELADA' | 'COMPLETADA'>('ACTIVA');
  const [editingDueDate, setEditingDueDate] = useState('');

  //  Autocompletar nombre del usuario logueado
  useEffect(() => {
    if (me?.name) {
      setNombreUsuario(me.name);
    } else if (me?.email) {
      // Si no hay name, usa el email
      setNombreUsuario(me.email.split('@')[0]); // Toma la parte antes del @
    }
  }, [me]);

  // --- FUNCIONES AUXILIARES ---
  const getEstadoBadge = (estado: string) => {
    const badges = {
      ACTIVA: '🟢 Activa',
      CANCELADA: '🔴 Cancelada',
      COMPLETADA: '✅ Completada',
    };
    return badges[estado as keyof typeof badges] || estado;
  };

  const getEstadoClass = (estado: string) => {
    const classes = {
      ACTIVA: 'badge-activa',
      CANCELADA: 'badge-cancelada',
      COMPLETADA: 'badge-completada',
    };
    return classes[estado as keyof typeof classes] || '';
  };

 // --- FUNCIONES DE FILTRADO ---
  const filteredReservas = reservas?.filter(r => {
    const matchesSearch = r.nombreUsuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (r.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesEstado = filterEstado === 'TODAS' || r.estado === filterEstado;
    return matchesSearch && matchesEstado;
  });

  const filteredAdminReservas = adminReservas?.filter(r => {
    const matchesSearch = r.nombreUsuario.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
                         (r.descripcion?.toLowerCase().includes(adminSearchTerm.toLowerCase()) ?? false);
    const matchesEstado = adminFilterEstado === 'TODAS' || r.estado === adminFilterEstado;
    return matchesSearch && matchesEstado;
  });

  // Estadísticas para reservas del usuario
  const myStats = {
    total: reservas?.length || 0,
    activas: reservas?.filter(r => r.estado === 'ACTIVA').length || 0,
    canceladas: reservas?.filter(r => r.estado === 'CANCELADA').length || 0,
    completadas: reservas?.filter(r => r.estado === 'COMPLETADA').length || 0,
  };
    // Estadísticas para admin
  const adminStats = {
    total: adminReservas?.length || 0,
    activas: adminReservas?.filter(r => r.estado === 'ACTIVA').length || 0,
    canceladas: adminReservas?.filter(r => r.estado === 'CANCELADA').length || 0,
    completadas: adminReservas?.filter(r => r.estado === 'COMPLETADA').length || 0,
  };


  const create = useMutation({
    mutationFn: async () => {
      const dueDateIso = dueDate ? new Date(dueDate + 'T00:00:00').toISOString() : null;
      return api.post('/reservas', {
        nombreUsuario: nombreUsuario.trim(),
        descripcion: descripcion.trim() || undefined,
        estado,
        dueDate: dueDateIso,
      });
    },
    onSuccess: () => {
      // setNombreUsuario('');
      setDescripcion('');
      setEstado('ACTIVA');
      setDueDate('');
      qc.invalidateQueries({ queryKey: ['reservas'] });
      qc.invalidateQueries({ queryKey: ['reservas-admin'] });
    },
  });

  const update = useMutation({
    mutationFn: async (input: {
      id: string;
      nombreUsuario: string;
      descripcion?: string;
      estado: 'ACTIVA' | 'CANCELADA' | 'COMPLETADA';
      dueDate?: string;
    }) => {
      const dueDateIso = input.dueDate ? new Date(input.dueDate + 'T00:00:00').toISOString() : null;
      return api.patch(`/reservas/${input.id}`, {
        nombreUsuario: input.nombreUsuario,
        descripcion: input.descripcion,
        estado: input.estado,
        dueDate: dueDateIso,
      });
    },
    onSuccess: () => {
      setEditingId(null);
      setEditingNombreUsuario('');
      setEditingDescripcion('');
      setEditingEstado('ACTIVA');
      setEditingDueDate('');
      qc.invalidateQueries({ queryKey: ['reservas'] });
      qc.invalidateQueries({ queryKey: ['reservas-admin'] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/reservas/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservas'] });
      qc.invalidateQueries({ queryKey: ['reservas-admin'] });
    },
  });

  const handleLogoutClick = async () => {
    try {
      const refreshToken = getRefreshToken();
      await api.post('/auth/logout', { refresh_token: refreshToken ?? '' });
    } catch {
      // ignoramos errores de logout
    } finally {
      clearTokens();
      onLogout();
    }
  };

  const startEdit = (reserva: Reserva) => {
    setEditingId(reserva.id);
    setEditingNombreUsuario(reserva.nombreUsuario);
    setEditingDescripcion(reserva.descripcion ?? '');
    setEditingEstado(reserva.estado);
    setEditingDueDate(reserva.dueDate ? reserva.dueDate.split('T')[0] : '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingNombreUsuario('');
    setEditingDescripcion('');
    setEditingEstado('ACTIVA');
    setEditingDueDate('');
  };

  const saveEdit = (id: string) => {
    if (!editingNombreUsuario.trim()) return;
    update.mutate({
      id,
      nombreUsuario: editingNombreUsuario.trim(),
      descripcion: editingDescripcion.trim() || undefined,
      estado: editingEstado,
      dueDate: editingDueDate,
    });
  };

  const handleDelete = (id: string, nombre: string) => {
    if (confirm(`¿Estás seguro de eliminar la reserva de ${nombre}?`)) {
      remove.mutate(id);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreUsuario.trim()) return;
    create.mutate();
  };

  function formatDate(iso?: string | null) {
    if (!iso) return 'Sin fecha';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'Fecha inválida';
    return d.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  // --- ESTADOS GLOBALES BÁSICOS ---
  if (meLoading) return <p>Cargando sesión...</p>;
  if (meError) return <p>Error cargando usuario. Vuelve a iniciar sesión.</p>;

  if (reservasLoading) return <p>Cargando reservas...</p>;
  if (reservasError) return <p>Error cargando reservas.</p>;

  return (
    <div className="app-shell app-shell--dashboard">
      <div className="dashboard-layout">
        {/* HEADER */}
        <section className="card">
          <header className="app-header">
            <div>
              <h1 className="app-title">Reserva Horas Gimnasio</h1>
              <p className="app-subtitle">
                Organiza tus reservas y practica consumo de APIs protegidas.
              </p>
              {me && (
                <p className="user-info">
                  Sesión: <strong>{me.email}</strong>
                  {me.role && (
                    <span
                      className={
                        me.role === 'ADMIN' ? 'badge-role admin' : 'badge-role'
                      }
                    >
                      {me.role}
                    </span>
                  )}
                </p>
              )}
            </div>
            <button className="btn btn-secondary" onClick={handleLogoutClick}>
              Cerrar sesión
            </button>
          </header>
        </section>

        {/* MAIN: 2 COLUMNAS */}
        <div className="dashboard-main">
          {/* PANEL IZQUIERDO: NUEVA RESERVA */}
          <section className="card form-card">
            <h2 className="section-title">
              <span className="title-icon">➕</span>
              Nueva reserva
            </h2>
            <form className="form" onSubmit={handleCreateSubmit}>
              <div className="field">
                <label className="field-label">
                  👤 Nombre de usuario
                </label>
                <input
                  className="input input-readonly"
                  placeholder="Tu nombre de usuario"
                  value={nombreUsuario}
                  readOnly
                  disabled
                  title="Este es tu nombre de usuario registrado"
                />
              </div>

              <div className="field">
                <label className="field-label">📝 Descripción</label>
                <textarea
                  className="textarea"
                  placeholder="Detalle de la reserva (ej: pesas, cardio, yoga)…"
                  value={descripcion}
                  rows={3}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>

              <div className="field">
                <label className="field-label">📊 Estado</label>
                <select
                  className="input"
                  value={estado}
                  onChange={(e) =>
                    setEstado(e.target.value as 'ACTIVA' | 'CANCELADA' | 'COMPLETADA')
                  }
                >
                  <option value="ACTIVA">🟢 Activa</option>
                  <option value="CANCELADA">🔴 Cancelada</option>
                  <option value="COMPLETADA">✅ Completada</option>
                </select>
              </div>

              <div className="field">
                <label className="field-label">📅 Fecha (opcional)</label>
                <input
                  type="date"
                  className="input"
                  value={dueDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!nombreUsuario.trim() || create.isPending}
                >
                  {create.isPending ? '⏳ Creando…' : '➕ Crear reserva'}
                </button>
              </div>
            </form>
          </section>

          {/* PANEL DERECHO: TUS reservas */}
          <section className="card list-card">
            <div className="section-header">
              <h2 className="section-title">
                <span className="title-icon">📋</span>
                Tus reservas
              </h2>
              {reservas && reservas.length > 0 && (
                <span className="badge-count">{filteredReservas?.length || 0} de {reservas.length}</span>
              )}
            </div>

            {/* ✅ PASO 3: Barra de filtros y búsqueda */}
            {reservas && reservas.length > 0 && (
              <>
                {/* Estadísticas */}
                <div className="stats-grid">
                  <div className="stat-card">
                    <span className="stat-icon">📊</span>
                    <div className="stat-content">
                      <p className="stat-value">{myStats.total}</p>
                      <p className="stat-label">Total</p>
                    </div>
                  </div>
                  <div className="stat-card activas">
                    <span className="stat-icon">🟢</span>
                    <div className="stat-content">
                      <p className="stat-value">{myStats.activas}</p>
                      <p className="stat-label">Activas</p>
                    </div>
                  </div>
                  <div className="stat-card canceladas">
                    <span className="stat-icon">🔴</span>
                    <div className="stat-content">
                      <p className="stat-value">{myStats.canceladas}</p>
                      <p className="stat-label">Canceladas</p>
                    </div>
                  </div>
                  <div className="stat-card completadas">
                    <span className="stat-icon">✅</span>
                    <div className="stat-content">
                      <p className="stat-value">{myStats.completadas}</p>
                      <p className="stat-label">Completadas</p>
                    </div>
                  </div>
                </div>

                {/* Filtros */}
                <div className="filters-bar">
                  <div className="filter-group">
                    <label className="filter-label">🔍 Buscar</label>
                    <input
                      className="input filter-input"
                      placeholder="Nombre o descripción..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="filter-group">
                    <label className="filter-label">📊 Estado</label>
                    <select
                      className="input filter-select"
                      value={filterEstado}
                      onChange={(e) => setFilterEstado(e.target.value as any)}
                    >
                      <option value="TODAS">Todas</option>
                      <option value="ACTIVA">🟢 Activas</option>
                      <option value="CANCELADA">🔴 Canceladas</option>
                      <option value="COMPLETADA">✅ Completadas</option>
                    </select>
                  </div>
                  {(searchTerm || filterEstado !== 'TODAS') && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setSearchTerm('');
                        setFilterEstado('TODAS');
                      }}
                    >
                      ❌ Limpiar
                    </button>
                  )}
                </div>
              </>
            )}
            
            {reservas && reservas.length === 0 ? (
              <div className="empty-state">
                <p className="empty-icon">📭</p>
                <p className="empty-text">No tienes reservas aún</p>
                <p className="empty-hint">Crea tu primera reserva usando el formulario</p>
              </div>
            ) : filteredReservas && filteredReservas.length === 0 ? (
              <div className="empty-state">
                <p className="empty-icon">🔍</p>
                <p className="empty-text">No se encontraron reservas</p>
                <p className="empty-hint">Intenta con otros filtros de búsqueda</p>
              </div>
            ) : (
              <ul className="reservas-list">
                {filteredReservas?.map((r) => {
                  const isEditing = editingId === r.id;

                  return (
                    <li key={r.id} className={`reserva-item ${isEditing ? 'editing' : ''}`}>
                      <div className="reserva-main">
                        {isEditing ? (
                          <div className="reserva-edit">
                            <div className="field">
                              <label className="field-label">👤 Nombre de usuario</label>
                              <input
                                className="input input-readonly"
                                value={editingNombreUsuario}
                                readOnly
                                disabled
                                title="No puedes cambiar el nombre de usuario"
                              />
                            </div>

                            <div className="field">
                              <label className="field-label">📝 Descripción</label>
                              <textarea
                                className="textarea"
                                rows={2}
                                value={editingDescripcion}
                                onChange={(e) =>
                                  setEditingDescripcion(e.target.value)
                                }
                              />
                            </div>

                            <div className="field">
                              <label className="field-label">📊 Estado</label>
                              <select
                                className="input"
                                value={editingEstado}
                                onChange={(e) =>
                                  setEditingEstado(
                                    e.target.value as 'ACTIVA' | 'CANCELADA' | 'COMPLETADA',
                                  )
                                }
                              >
                                <option value="ACTIVA">🟢 Activa</option>
                                <option value="CANCELADA">🔴 Cancelada</option>
                                <option value="COMPLETADA">✅ Completada</option>
                              </select>
                            </div>

                            <div className="field">
                              <label className="field-label">📅 Fecha</label>
                              <input
                                type="date"
                                className="input"
                                value={editingDueDate}
                                onChange={(e) => setEditingDueDate(e.target.value)}
                              />
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="reserva-header">
                              <p className="reserva-title">👤 {r.nombreUsuario}</p>
                              <span className={`badge-estado ${getEstadoClass(r.estado)}`}>
                                {getEstadoBadge(r.estado)}
                              </span>
                            </div>
                            {r.descripcion && (
                              <p className="reserva-description">📝 {r.descripcion}</p>
                            )}
                            <p className="reserva-meta">
                              📅 {formatDate(r.dueDate)}
                            </p>
                          </>
                        )}
                      </div>

                      <div className="reserva-actions">
                        {isEditing ? (
                          <>
                            <button
                              className="btn btn-primary btn-sm"
                              type="button"
                              disabled={update.isPending}
                              onClick={() => saveEdit(r.id)}
                            >
                              {update.isPending ? '⏳' : '💾 Guardar'}
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              type="button"
                              onClick={cancelEdit}
                              disabled={update.isPending}
                            >
                              ❌ Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn btn-secondary btn-sm"
                              type="button"
                              onClick={() => startEdit(r)}
                            >
                              ✏️ Editar
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              type="button"
                              disabled={remove.isPending}
                              onClick={() => handleDelete(r.id, r.nombreUsuario)}
                            >
                              {remove.isPending ? '⏳' : '🗑️ Eliminar'}
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* PANEL EXTRA: TODAS LAS reservas (SOLO ADMIN, SOLO LECTURA) */}
        {me?.role === 'ADMIN' && (
          <section className="card admin-card">
            <div className="section-header">
              <h2 className="section-title">
                <span className="title-icon">👑</span>
                Todas las reservas (ADMIN)
              </h2>
              {adminReservas && adminReservas.length > 0 && (
                <span className="badge-count admin-count">
                  {filteredAdminReservas?.length || 0} de {adminReservas.length}
                </span>
              )}
            </div>
            <p className="app-subtitle" style={{ marginTop: 0, marginBottom: 16 }}>
              Vista global de reservas de todos los usuarios (solo lectura).
            </p>

            {adminLoading && (
              <div className="loading-state">
                <p className="loading-icon">⏳</p>
                <p className="loading-text">Cargando reservas globales…</p>
              </div>
            )}
            
            {adminError && (
              <div className="error-state">
                <p className="error-icon">❌</p>
                <p className="error-text">Error cargando reservas globales.</p>
              </div>
            )}

            {!adminLoading && !adminError && adminReservas && adminReservas.length === 0 && (
              <div className="empty-state">
                <p className="empty-icon">📭</p>
                <p className="empty-text">No hay reservas en el sistema</p>
                <p className="empty-hint">Las reservas aparecerán aquí cuando los usuarios las creen</p>
              </div>
            )}

            {!adminLoading && !adminError && adminReservas && adminReservas.length > 0 && (
              <>
                {/* ✅ Estadísticas Admin */}
                <div className="stats-grid admin-stats">
                  <div className="stat-card">
                    <span className="stat-icon">📊</span>
                    <div className="stat-content">
                      <p className="stat-value">{adminStats.total}</p>
                      <p className="stat-label">Total Global</p>
                    </div>
                  </div>
                  <div className="stat-card activas">
                    <span className="stat-icon">🟢</span>
                    <div className="stat-content">
                      <p className="stat-value">{adminStats.activas}</p>
                      <p className="stat-label">Activas</p>
                    </div>
                  </div>
                  <div className="stat-card canceladas">
                    <span className="stat-icon">🔴</span>
                    <div className="stat-content">
                      <p className="stat-value">{adminStats.canceladas}</p>
                      <p className="stat-label">Canceladas</p>
                    </div>
                  </div>
                  <div className="stat-card completadas">
                    <span className="stat-icon">✅</span>
                    <div className="stat-content">
                      <p className="stat-value">{adminStats.completadas}</p>
                      <p className="stat-label">Completadas</p>
                    </div>
                  </div>
                </div>

                {/* ✅ Filtros Admin */}
                <div className="filters-bar admin-filters">
                  <div className="filter-group">
                    <label className="filter-label">🔍 Buscar</label>
                    <input
                      className="input filter-input"
                      placeholder="Nombre o descripción..."
                      value={adminSearchTerm}
                      onChange={(e) => setAdminSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="filter-group">
                    <label className="filter-label">📊 Estado</label>
                    <select
                      className="input filter-select"
                      value={adminFilterEstado}
                      onChange={(e) => setAdminFilterEstado(e.target.value as any)}
                    >
                      <option value="TODAS">Todas</option>
                      <option value="ACTIVA">🟢 Activas</option>
                      <option value="CANCELADA">🔴 Canceladas</option>
                      <option value="COMPLETADA">✅ Completadas</option>
                    </select>
                  </div>
                  {(adminSearchTerm || adminFilterEstado !== 'TODAS') && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setAdminSearchTerm('');
                        setAdminFilterEstado('TODAS');
                      }}
                    >
                      ❌ Limpiar
                    </button>
                  )}
                </div>

                {filteredAdminReservas && filteredAdminReservas.length === 0 ? (
                  <div className="empty-state">
                    <p className="empty-icon">🔍</p>
                    <p className="empty-text">No se encontraron reservas</p>
                    <p className="empty-hint">Intenta con otros filtros de búsqueda</p>
                  </div>
                ) : (
                  <ul className="reservas-list admin-list">
                    {filteredAdminReservas?.map((r) => (
                      <li key={r.id} className="reserva-item admin-item">
                        <div className="reserva-main">
                          <div className="reserva-header">
                            <p className="reserva-title">👤 {r.nombreUsuario}</p>
                            <span className={`badge-estado ${getEstadoClass(r.estado)}`}>
                              {getEstadoBadge(r.estado)}
                            </span>
                          </div>
                          {r.descripcion && (
                            <p className="reserva-description">📝 {r.descripcion}</p>
                          )}
                          <p className="reserva-meta">
                            🆔 Usuario: {r.userId.slice(0, 12)}... · 📅 {formatDate(r.dueDate)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
