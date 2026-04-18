import React, { useState } from "react";
import axios from "axios";
import { Button, Sheet } from "../../../../design-system";
import { $SERVER } from "../../../../_const/_const";

const Login = ({
  setOpenLoginModal,
  openLoginModal,
  setUser,
  setAppMessage,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onClose = () => {
    setOpenLoginModal(false);
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    axios
      .post(`${$SERVER}/auth/login`, { email, password })
      .then((response) => {
        setUser(response.data.role);
        setAppMessage({
          success: response.data.status === 200,
          message: response.data.message,
        });
        localStorage.setItem("token-1755", response.data.token);
        setOpenLoginModal(false);
      })
      .catch(() => {
        setError("Échec de la connexion. Vérifie tes identifiants.");
      })
      .finally(() => setLoading(false));
  };

  return (
    <Sheet
      open={openLoginModal}
      onClose={onClose}
      title={<h2 className="login-title">Connexion admin</h2>}
    >
      <form id="auth-form" onSubmit={handleSubmit} className="login-form">
        <label className="login-field">
          <span className="login-label">E-mail</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="login-field">
          <span className="login-label">Mot de passe</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="login-error" role="alert">{error}</p>}
        <div className="login-actions">
          <Button
            variant="primary"
            type="submit"
            disabled={email.length === 0 || password.length === 0 || loading}
            block
          >
            {loading ? "Connexion…" : "Se connecter"}
          </Button>
          <button type="button" className="login-cancel" onClick={onClose}>
            Annuler
          </button>
        </div>
      </form>
      <style>{`
        .login-title {
          font-family: var(--ds-font-serif, "DM Serif Display", Georgia, serif);
          font-size: var(--ds-size-h1, 22px);
          color: var(--ds-accent-gold, #D4A24C);
          margin: 0;
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: var(--ds-space-3, 12px);
        }
        .login-field { display: flex; flex-direction: column; gap: 4px; }
        .login-label {
          font-size: var(--ds-size-small, 13px);
          color: var(--ds-text-muted, #9A8B90);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .login-field input {
          background: var(--ds-bg-elevated, #241820);
          border: 1px solid var(--ds-border-subtle, #2C1E25);
          border-radius: var(--ds-radius-sm, 8px);
          color: var(--ds-text-primary, #F5EFE8);
          padding: 10px 12px;
          font-size: var(--ds-size-body, 15px);
        }
        .login-error {
          color: var(--ds-danger, #C0392B);
          font-size: var(--ds-size-small, 13px);
          margin: 0;
        }
        .login-actions {
          display: flex;
          flex-direction: column;
          gap: var(--ds-space-2, 8px);
        }
        .login-cancel {
          background: transparent;
          border: none;
          color: var(--ds-text-muted, #9A8B90);
          font-size: var(--ds-size-small, 13px);
          padding: 8px;
          cursor: pointer;
        }
      `}</style>
    </Sheet>
  );
};

export default Login;
