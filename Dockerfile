# Stage 1: Build the React app
FROM node:24-alpine AS build
WORKDIR /app
COPY client-react-carbon/package.json package.json
RUN npm install
COPY client-react-carbon/ ./
RUN npm run build

# Stage 2: Serve the app with Express
FROM node:24-alpine
WORKDIR /app
COPY --from=build /app/build ./build
COPY package.json package.json
RUN npm install && rm -rf /app/client-react-carbon
COPY ./ ./
EXPOSE 3000
CMD ["npm", "run", "docker-start"]

