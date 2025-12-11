// apps/web/src/Auth.tsx
import { useState } from 'react';
import { api } from './api';
import { setTokens } from './authStorage';
import './App.css';

export default function Auth({ onLogged }: { onLogged: () => void }) {
  const [email, setEmail] = useState('test@example.com');
  const [name, setName] = useState(''); // Cambiado a "name"
  const [password, setPassword] = useState('secret12');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const url = mode === 'login' ? '/auth/login' : '/auth/signup';
      const payload = mode === 'signup' 
        ? { email, name, password } // Enviar "name" al crear cuenta
        : { email, password };
      const { data } = await api.post(url, payload);
      setTokens(data.access_token, data.refresh_token);
      onLogged();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell app-shell--center">
      <section className="card auth-card">
        <header className="app-header" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h1 className="app-title">Reservas Horas Gimnasio</h1>
            <p className="app-subtitle">
              Autentícate para gestionar y visualizar tus reservas.
            </p>
          </div>
        </header>

        <form className="form" onSubmit={submit}>
          <div className="field">
            <label className="field-label">Correo Electrónico</label>
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              type="email"
            />
          </div>
          {mode === 'signup' && ( // Campo para nombre solo en modo signup
            <div className="field">
              <label className="field-label">Nombre</label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                type="text"
                required={mode === 'signup'} // Requerido solo en signup
              />
            </div>
          )}
          <div className="field">
            <label className="field-label">Contraseña</label>
            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              type="password"
            />
          </div>

          {err && <p className="error-text">{err}</p>}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '0.75rem',
              marginTop: '0.5rem',
            }}
          >
            <button className="btn btn-primary" disabled={loading} type="submit">
              {loading ? 'Enviando…' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            >
              {mode === 'login'
                ? '¿No tienes cuenta? Regístrate'
                : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}