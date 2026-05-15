"use client";
import React, { useEffect, useState } from "react";
import { themeManager, themes } from "../../components/themeManager";
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";

export default function ConfigPage() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    setTheme(themeManager.getTheme());
    const handler = (e) => setTheme(e.detail.theme);
    window.addEventListener("theme-changed", handler);
    return () => window.removeEventListener("theme-changed", handler);
  }, []);

  const handleThemeChange = (t) => {
    themeManager.applyTheme(t);
    setTheme(t);
  };

  const colors = themes[theme];

  return (
    <div className="px-6 py-6 sm:py-12 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Configuración</h1>
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Tema</h2>
        <div className="flex items-center mb-6">

          <button
            aria-label="Cambiar tema"
            className={`relative w-16 h-8 flex items-center rounded-full transition-colors duration-300 focus:outline-none ${theme === "dark" ? "bg-[#3a1859]" : "bg-gray-300"}`}
            onClick={() => handleThemeChange(theme === "light" ? "dark" : "light")}
          >
            <span
              className={`absolute left-1 top-1 w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${theme === "dark" ? "translate-x-8 bg-[#1a0933] text-white" : "translate-x-0 bg-white text-yellow-500"}`}
            >
              {theme === "dark" ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M6.343 17.657l-1.414 1.414M17.657 17.657l-1.414-1.414M6.343 6.343L4.929 7.757" /></svg>
              )}
            </span>
          </button>

        </div>
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded shadow" style={{ background: colors.bg, border: `2px solid ${colors.border}` }} />
            <span className="text-xs mt-1">Fondo</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded shadow" style={{ background: colors.cardBg, border: `2px solid ${colors.border}` }} />
            <span className="text-xs mt-1">Tarjeta</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded shadow" style={{ background: colors.accent, border: `2px solid ${colors.border}` }} />
            <span className="text-xs mt-1">Acento</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded shadow" style={{ background: colors.text, border: `2px solid ${colors.border}` }} />
            <span className="text-xs mt-1">Texto</span>
          </div>
        </div>
      </div>
      {/* Cambiar contraseña */}
      <div className="mt-12">
        <h2 className="text-lg font-semibold mb-2">Cambiar contraseña</h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}

// Componente para cambiar contraseña
function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage("Por favor completa todos los campos.");
      return;
    }
    if (newPassword.length < 6) {
      setMessage("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error("Usuario no autenticado");
      // Reautenticación
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      // Cambiar contraseña
      await updatePassword(user, newPassword);
      setMessage("Contraseña actualizada correctamente.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      setMessage("Error: " + (e.message || "No se pudo cambiar la contraseña"));
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Contraseña actual</label>
        <input
          type="password"
          className="w-full border rounded px-3 py-2"
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          disabled={loading}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Nueva contraseña</label>
        <input
          type="password"
          className="w-full border rounded px-3 py-2"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          disabled={loading}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Confirmar nueva contraseña</label>
        <input
          type="password"
          className="w-full border rounded px-3 py-2"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          disabled={loading}
        />
      </div>
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded font-semibold disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "Cambiando..." : "Cambiar contraseña"}
      </button>
      {message && (
        <div className={`mt-2 text-sm ${message.startsWith("Error") ? "text-red-600" : "text-green-600"}`}>{message}</div>
      )}
    </form>
  );
}

