# Etap 1: Budowanie Vite
FROM node:18 AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etap 2: Serwowanie przez Nginx
FROM nginx:stable-alphabetical
COPY --from=build-stage /app/dist /usr/share/nginx/html
# Kopiujemy własną konfigurację Nginx (opcjonalnie, patrz niżej)
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]