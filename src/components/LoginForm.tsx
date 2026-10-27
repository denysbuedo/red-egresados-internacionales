"use client";
import { useState } from "react";

export function LoginForm() {
  const [username,setUsername] = useState("");
  const [password,setPassword] = useState("");
  const [error,setError] = useState("");
  const [loading,setLoading] = useState(false);
  return <div className="conecta-form">
    <h1>Bienvenido a CONECTA</h1>
    <p className="conecta-form-subtitle">Accede al ecosistema de colaboración de la educación superior cubana.</p>
    {error && <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <form onSubmit={async(event)=>{
      event.preventDefault();setError("");setLoading(true);
      try {
        const response=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username,password})});
        const result=await response.json();
        if(!response.ok) throw new Error(result.error||"No pudimos iniciar tu sesión. Inténtalo de nuevo.");
        let destination="/";
        const requested=new URLSearchParams(window.location.search).get("redirect");
        if(requested?.startsWith("/") && !requested.startsWith("//") && !requested.includes("\\")) {
          const url=new URL(requested,window.location.origin);
          if(url.origin===window.location.origin) destination=url.pathname+url.search+url.hash;
        }
        window.location.assign(result.pending?"/pendiente":destination);
      } catch(reason) { setError(reason instanceof Error?reason.message:"Revisa tu conexión e inténtalo de nuevo."); }
      finally { setLoading(false); }
    }}>
      <label htmlFor="login-username" className="conecta-field">Correo electrónico o usuario
        <input id="login-username" name="username" type="text" autoComplete="username" placeholder="Tu correo o nombre de usuario" required value={username} onChange={(event)=>setUsername(event.target.value)} />
      </label>
      <label htmlFor="login-password" className="conecta-field">Contraseña
        <input id="login-password" name="password" type="password" autoComplete="current-password" placeholder="Tu contraseña" required value={password} onChange={(event)=>setPassword(event.target.value)} />
      </label>
      <button type="submit" className="conecta-form-submit" disabled={loading}>{loading?"Iniciando sesión...":"Iniciar sesión"}</button>
    </form>
  </div>;
}
