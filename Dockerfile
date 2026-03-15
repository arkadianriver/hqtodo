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
COPY package.json package.json
RUN npm install
COPY ./ ./
RUN rm -rf ./client-react-carbon && mkdir ./client-react-carbon
COPY --from=build /app/build ./client-react-carbon/build
EXPOSE 3000
ENV NODE_ENV production
CMD ["npm", "start"]

