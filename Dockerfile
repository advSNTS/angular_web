# =========================
# Etapa 1: build de Angular
# =========================
FROM node:20-alpine AS build

WORKDIR /app

# Copiar dependencias primero para aprovechar caché
COPY package*.json ./
RUN npm ci

# Copiar el resto del proyecto
COPY . .

# Compilar Angular en modo producción
RUN npm run build -- --configuration production

# =========================
# Etapa 2: runtime con Nginx
# =========================
FROM nginx:1.27-alpine

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar build generado de Angular
# Ajusta la ruta según el nombre real del proyecto
COPY --from=build /app/dist/angular_web/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
