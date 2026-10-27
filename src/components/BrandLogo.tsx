import Image from "next/image";

export function BrandLogo({ inverse = false, className = "", priority = false }: { inverse?: boolean; className?: string; priority?: boolean }) {
  return <Image src={inverse ? "/brand/conecta-logo-fondo-oscuro.svg" : "/brand/conecta-logo-principal.svg"}
    alt="CONECTA" width={522} height={116} unoptimized priority={priority} className={`brand-logo ${className}`} />;
}
