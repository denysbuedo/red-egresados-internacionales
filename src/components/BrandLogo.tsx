import Image from "next/image";

export function BrandLogo({ inverse = false, className = "", priority = false, header = false }: { inverse?: boolean; className?: string; priority?: boolean; header?: boolean }) {
  return <Image src={inverse ? "/brand/conecta-logo-fondo-oscuro.svg" : header ? "/brand/conecta-logo-cabecera.svg" : "/brand/conecta-logo-principal.svg"}
    alt="CONECTA" width={header && !inverse ? 468.75 : 522} height={header && !inverse ? 79.75 : 116} unoptimized priority={priority} className={`brand-logo ${className}`} />;
}
