"use client";

import Link from "next/link";
import { BrandLogo } from "./BrandLogo";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
  id: number;
  username: string;
  email: string;
  role: "user" | "admin" | "institution" | "editor";
  status: string;
  graduateId: number | null;
  institutionName: string | null;
}

interface Notification {
  id: number;
  type: string;
  message: string;
  link: string | null;
  read: number;
  createdAt: Date | null;
}

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pendingSequence = useRef(0);
  const notificationSequence = useRef(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  async function fetchUser() {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        // Redirigir usuarios pendientes
        if (data.user?.status === "pending" && !["/pendiente", "/completar-perfil"].includes(window.location.pathname)) {
          window.location.href = "/pendiente";
        }
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPendingCount() {
    const version = ++pendingSequence.current;
    try {
      const response = await fetch("/api/connections");
      if (response.ok) {
        const data = await response.json();
        if (version === pendingSequence.current) setPendingCount(data.pendingCount || 0);
      }
    } catch (error) {
      console.error("Error fetching pending count:", error);
    }
  }

  async function fetchNotifications() {
    const version = ++notificationSequence.current;
    try {
      // Get all notifications, not just unread
      const response = await fetch("/api/notifications");
      if (response.ok) {
        const data = await response.json();
        if (version !== notificationSequence.current) return;
        setNotifications(data);
        setNotifCount(data.filter((n: Notification) => n.read === 0).length);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }

  const markAsRead = async (notificationId: number) => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: 1 } : n)
      );
      setNotifCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification read:", error);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifCount(0);
      // Keep notifications visible, just mark as read
      setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
    } catch (error) {
      console.error("Error marking notifications read:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setUserMenuOpen(false);
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchPendingCount();
    fetchNotifications();

    const refresh = () => { void fetchPendingCount(); void fetchNotifications(); };
    const interval = setInterval(refresh, 30000);
    window.addEventListener("conecta:connections-changed", refresh);
    window.addEventListener("focus", refresh);
    return () => { clearInterval(interval); window.removeEventListener("conecta:connections-changed", refresh); window.removeEventListener("focus", refresh); };
  }, []);


  if (pathname === "/" && !user) return null;

  return (
    <nav className="reduniv-header sticky top-0 z-50">
      <div className="reduniv-header-container">
        <div className="reduniv-header-row">
          <Link href="/" className="flex items-center gap-3">
            <BrandLogo header priority />
          </Link>

          <div className="hidden xl:flex items-center gap-1">
            {!user && <NavLink href="/">Inicio</NavLink>}
            {user && <NavLink href="/comunidades">Comunidades</NavLink>}
            {user && <NavLink href="/eventos">Eventos</NavLink>}
            {user && <NavLink href="/directorio">Directorio</NavLink>}
            {user && <NavLink href="/conexiones"><span className="flex items-center gap-1.5">Conexiones{pendingCount > 0 && <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">{pendingCount}</span>}</span></NavLink>}
            {user && <NavLink href="/noticias">Noticias</NavLink>}
            {user?.role === "institution" && <NavLink href="/institucion">Mi institución</NavLink>}

            {user && (
              <div className="relative">
                <button
                  aria-label="Notificaciones"
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notifCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {notifCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                      {notifications.length > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Marcar todas leídas
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              if (notif.read === 0) {
                                markAsRead(notif.id);
                              }
                              if (notif.link) {
                                window.location.href = notif.link;
                              }
                            }}
                            className={`px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors ${
                              notif.read === 0
                                ? "bg-blue-50 hover:bg-blue-100"
                                : "bg-white hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <div className="flex-1">
                                <p className={`text-sm ${notif.read === 0 ? "text-gray-900 font-medium" : "text-gray-600"}`}>
                                  {notif.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {notif.createdAt
                                    ? new Date(notif.createdAt).toLocaleDateString("es-ES", {
                                        day: "numeric",
                                        month: "short",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                  })
                                : ""}
                                </p>
                              </div>
                              {notif.read === 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notif.id);
                                  }}
                                  className="text-xs text-gray-400 hover:text-gray-600 p-1"
                                  title="Marcar como leída"
                                >
                                  ✓
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-gray-500 text-sm">
                          No tienes notificaciones
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {user ? (
              <div className="relative ml-3">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-24 truncate text-gray-700" title={user.username}>{user.username}</span>
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-gray-800 font-medium text-sm">{user.username}</p>
                      <p className="text-gray-500 text-xs truncate">{user.email}</p>
                    </div>
                    {["admin", "editor"].includes(user.role) && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50 text-sm transition-colors font-medium"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        🛡️ Panel Admin
                      </Link>
                    )}
                    {user.graduateId && (
                      <Link
                        href={`/miembros/${user.graduateId}`}
                        className="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-sm transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Mi Perfil
                      </Link>
                    )}
                    <Link href="/preferencias" className="block px-4 py-2 text-sm text-gray-700" onClick={()=>setUserMenuOpen(false)}>Preferencias y seguridad</Link><Link href="/completar-perfil" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Vínculo laboral</Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:text-red-700 hover:bg-gray-50 text-sm transition-colors"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="ml-3 flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Solicitar acceso
                </Link>
              </div>
            )}
          </div>

          <button
            aria-label="Menú de navegación" aria-expanded={isOpen}
            onClick={() => setIsOpen(!isOpen)}
            className="xl:hidden p-2 text-gray-500 hover:text-gray-700"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {isOpen && (
          <div className="xl:hidden pb-4 border-t border-gray-200 pt-2">
            <div className="flex flex-col gap-1">
              {!user && <MobileNavLink href="/" onClick={() => setIsOpen(false)}>Inicio</MobileNavLink>}
              {user && <><MobileNavLink href="/comunidades" onClick={() => setIsOpen(false)}>Comunidades</MobileNavLink><MobileNavLink href="/eventos" onClick={() => setIsOpen(false)}>Eventos</MobileNavLink><MobileNavLink href="/directorio" onClick={() => setIsOpen(false)}>Directorio</MobileNavLink><MobileNavLink href="/conexiones" onClick={() => setIsOpen(false)}>Conexiones{pendingCount > 0 ? ` (${pendingCount})` : ""}</MobileNavLink><MobileNavLink href="/noticias" onClick={() => setIsOpen(false)}>Noticias</MobileNavLink></>}
              {user && <MobileNavLink href="/preferencias" onClick={()=>setIsOpen(false)}>Preferencias y seguridad</MobileNavLink>}
              {user?.role === "institution" && <MobileNavLink href="/institucion" onClick={() => setIsOpen(false)}>Mi institución</MobileNavLink>}

              {user ? (
                <>
                  {["admin", "editor"].includes(user.role) && (
                    <MobileNavLink
                      href="/admin"
                      onClick={() => setIsOpen(false)}
                    >
                      🛡️ Panel Admin
                    </MobileNavLink>
                  )}
                  {user.graduateId && (
                    <MobileNavLink
                      href={`/miembros/${user.graduateId}`}
                      onClick={() => setIsOpen(false)}
                    >
                      Mi Perfil
                    </MobileNavLink>
                  )}
                  <MobileNavLink href="/completar-perfil" onClick={() => setIsOpen(false)}>Vínculo laboral</MobileNavLink>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="text-left px-3 py-2 text-red-600 hover:text-red-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors w-full"
                  >
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <>
                  <MobileNavLink
                    href="/login"
                    onClick={() => setIsOpen(false)}
                  >
                    Iniciar sesión
                  </MobileNavLink>
                  <MobileNavLink
                    href="/register"
                    onClick={() => setIsOpen(false)}
                  >
                    Solicitar acceso
                  </MobileNavLink>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = !href.includes("?") && (href === "/" ? pathname === href : pathname === href || pathname.startsWith(href + "/"));
  return (
    <Link
      aria-current={active ? "page" : undefined}
      href={href}
      className="px-2 py-2 whitespace-nowrap text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  const pathname = usePathname();
  const active = !href.includes("?") && (href === "/" ? pathname === href : pathname === href || pathname.startsWith(href + "/"));
  return (
    <Link
      aria-current={active ? "page" : undefined}
      href={href}
      onClick={onClick}
      className="px-2 py-2 whitespace-nowrap text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
    >
      {children}
    </Link>
  );
}
