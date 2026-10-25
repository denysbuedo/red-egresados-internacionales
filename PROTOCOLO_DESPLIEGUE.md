# Protocolo de Despliegue en Producción
## Red de Egresados Internacionales de la Educación Superior Cubana

> Documento histórico de abril de 2026. Para el estado actual y el procedimiento
> verificado, consultar [SINCRONIZACION_DESPLIEGUE.md](SINCRONIZACION_DESPLIEGUE.md).
> Los ejemplos siguientes de DATABASE_URL/prod.db, npm ci --production y PM2
> en cluster no describen la configuración reconciliada. No usarlos para actualizar
> la VM existente ni ejecutar scripts de creación de administradores de ejemplo.

---

## 1. Estimación de Recursos del Servidor

### Para 100,000 - 200,000 usuarios registrados

| Recurso | Mínimo | Recomendado | Alto Rendimiento |
|---------|--------|-------------|------------------|
| **RAM** | 8 GB | 16 GB | 32 GB |
| **CPU** | 4 cores | 8 cores | 16 cores |
| **Disco** | 100 GB SSD | 200 GB NVMe | 500 GB NVMe |
| **Ancho de banda** | 1 TB/mes | 3 TB/mes | 5 TB/mes |

### Configuración Recomendada (150k usuarios):
- **RAM:** 16 GB (la app usa ~2-3GB en producción, resto para caché)
- **CPU:** 8 cores (Next.js SSR requiere procesamiento por request)
- **Disco:** 200 GB NVMe (DB SQLite + uploads + logs)
- **OS:** Ubuntu 24.04 LTS

### Notas importantes:
- SQLite es adecuado hasta ~500k requests/día
- Para >200k usuarios considerar migrar a PostgreSQL
- PM2 con clustering usa todos los cores disponibles
- Nginx como reverse proxy reduce carga en Node.js

---

## 2. Preparación del Servidor

### 2.1 Actualizar sistema
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential
```

### 2.2 Instalar Node.js 20 LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Debe mostrar v20.x.x
npm --version
```

### 2.3 Instalar PM2 (process manager)
```bash
sudo npm install -g pm2
pm2 --version
```

### 2.4 Instalar Nginx
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
nginx -v
```

---

## 3. Despliegue de la Aplicación

### 3.1 Clonar repositorio
```bash
# Crear usuario para la app (opcional pero recomendado)
sudo useradd -m -s /bin/bash egresados
sudo su - egresados

# Clonar proyecto
cd ~
git clone <url-del-repositorio> red-egresados
cd red-egresados
```

### 3.2 Instalar dependencias
```bash
npm ci --production
```

### 3.3 Variables de entorno
```bash
nano .env
```

Contenido del archivo `.env`:
```env
NODE_ENV=production
NEXTAUTH_SECRET=<generar-con-openssl-rand-base64-32>
DATABASE_URL=file:./prod.db
```

### 3.4 Compilar aplicación
```bash
npm run build
```

### 3.5 Ejecutar migraciones de base de datos
```bash
node scripts/migrate.cjs
```

### 3.6 Crear usuario administrador
```bash
node scripts/create-admin-fixed.cjs
```

---

## 4. Configuración de PM2

### 4.1 Crear archivo de configuración
```bash
nano ecosystem.config.js
```

Contenido:
```javascript
module.exports = {
  apps: [{
    name: 'red-egresados',
    script: 'npm',
    args: 'start',
    instances: 'max',           // Usa todos los cores
    exec_mode: 'cluster',       // Modo cluster para multi-core
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    max_memory_restart: '1G',   // Reinicia si usa más de 1GB
    error_file: '/var/log/pm2/egresados-error.log',
    out_file: '/var/log/pm2/egresados-out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
};
```

### 4.2 Crear directorio de logs
```bash
sudo mkdir -p /var/log/pm2
sudo chown egresados:egresados /var/log/pm2
```

### 4.3 Iniciar aplicación
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup systemd -u egresados --hp /home/egresados
```

### 4.4 Verificar estado
```bash
pm2 status
pm2 logs red-egresados --lines 50
```

---

## 5. Configuración de Nginx

### 5.1 Crear configuración del sitio
```bash
sudo nano /etc/nginx/sites-available/red-egresados
```

Contenido:
```nginx
upstream red_egresados {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name egresados.midominio.cu;

    # Redirigir a HTTPS (después de configurar certificado)
    # return 301 https://$server_name$request_uri;

    # Límites de subida
    client_max_body_size 10M;

    # Headers de seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy a Next.js
    location / {
        proxy_pass http://red_egresados;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Cache para archivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://red_egresados;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Logs
    access_log /var/log/nginx/egresados-access.log;
    error_log /var/log/nginx/egresados-error.log;
}
```

### 5.2 Habilitar sitio
```bash
sudo ln -s /etc/nginx/sites-available/red-egresados /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Quitar sitio por defecto
sudo nginx -t  # Verificar configuración
sudo systemctl reload nginx
```

### 5.3 Configurar HTTPS con Let's Encrypt
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d egresados.midominio.cu

# Renovación automática (ya configurada por certbot)
sudo certbot renew --dry-run
```

---

## 6. Optimización de Base de Datos SQLite

### 6.1 Configuración para producción
```bash
nano scripts/optimize-db.cjs
```

Contenido:
```javascript
const Database = require("better-sqlite3");
const db = new Database("prod.db");

// Optimizaciones para producción
db.pragma('journal_mode = WAL');        // Mejor concurrencia
db.pragma('synchronous = NORMAL');       // Balance velocidad/seguridad
db.pragma('cache_size = -64000');       // 64MB cache
db.pragma('foreign_keys = ON');          // Integridad referencial
db.pragma('temp_store = MEMORY');        // Temp en memoria
db.pragma('mmap_size = 268435456');     // 256MB mmap

console.log("✅ Base de datos optimizada para producción");
db.close();
```

Ejecutar:
```bash
node scripts/optimize-db.cjs
```

### 6.2 Backup automático
```bash
nano /home/egresados/scripts/backup-db.sh
```

Contenido:
```bash
#!/bin/bash
BACKUP_DIR="/home/egresados/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Copia de seguridad
cp /home/egresados/red-egresados/prod.db $BACKUP_DIR/prod_$DATE.db

# Comprimir
gzip $BACKUP_DIR/prod_$DATE.db

# Mantener solo últimos 30 días
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completado: prod_$DATE.db.gz"
```

```bash
chmod +x /home/egresados/scripts/backup-db.sh

# Agregar a cron (cada día a las 3 AM)
crontab -e
# Agregar línea:
0 3 * * * /home/egresados/scripts/backup-db.sh >> /home/egresados/logs/backup.log 2>&1
```

---

## 7. Monitoreo

### 7.1 Logs de PM2
```bash
pm2 logs red-egresados          # Ver logs en vivo
pm2 logs red-egresados --err    # Solo errores
pm2 monit                        # Monitor en tiempo real
```

### 7.2 Logs de Nginx
```bash
sudo tail -f /var/log/nginx/egresados-error.log
sudo tail -f /var/log/nginx/egresados-access.log
```

### 7.3 Verificar estado del servicio
```bash
pm2 status
sudo systemctl status nginx
sudo systemctl status pm2-egresados
```

---

## 8. Procedimiento de Actualización

### Para desplegar una nueva versión:
```bash
cd /home/egresados/red-egresados

# Actualizar código
git pull origin main

# Instalar dependencias
npm ci --production

# Compilar
npm run build

# Ejecutar migraciones (si hay)
node scripts/migrate.cjs

# Reiniciar sin downtime
pm2 reload red-egresados
```

---

## 9. Checklist Pre-Despliegue

### Antes de poner en producción:
- [ ] ✅ Todas las pruebas del protocolo pasan
- [ ] ✅ Base de datos optimizada (WAL mode)
- [ ] ✅ Backups automáticos configurados
- [ ] ✅ HTTPS activo y funcionando
- [ ] ✅ PM2 configurado con reinicio automático
- [ ] ✅ Logs rotados y monitoreados
- [ ] ✅ Usuario administrador creado
- [ ] ✅ Variables de entorno configuradas
- [ ] ✅ Firewall configurado (solo puertos 80, 443, SSH)

---

## 10. Configuración de Firewall

```bash
# UFW (Uncomplicated Firewall)
sudo apt install -y ufw

# Permitir SSH (puerto 22)
sudo ufw allow 22/tcp

# Permitir HTTP y HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Activar firewall
sudo ufw enable

# Verificar estado
sudo ufw status
```

---

## 11. Solución de Problemas Comunes

### La aplicación no responde
```bash
pm2 restart red-egresados
sudo systemctl restart nginx
```

### Error de base de datos
```bash
# Verificar permisos
chown egresados:egresados /home/egresados/red-egresados/prod.db
chmod 644 /home/egresados/red-egresados/prod.db
```

### Memoria insuficiente
```bash
pm2 describe red-egresados  # Ver uso de memoria
free -h                      # Memoria disponible
```

### Alto uso de CPU
```bash
pm2 monit                    # Ver procesos
htop                         # Uso general del sistema
```

---

## 12. Contacto y Soporte

| Rol | Contacto |
|-----|----------|
| **Admin sistema** | Administrador PM2 |
| **Base de datos** | SQLite (archivos locales) |
| **Aplicación** | Next.js + PM2 |
| **Web server** | Nginx |

---

**Documento version:** 1.0  
**Fecha:** Abril 2026  
**Preparado para:** Ministerio de Educación Superior - República de Cuba
