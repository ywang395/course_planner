# 1. Build the React frontend
FROM node:22-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# 2. Build the Spring Boot jar with the frontend bundled as static resources
FROM eclipse-temurin:21-jdk AS backend
WORKDIR /app
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw -q -B dependency:go-offline
COPY src/ src/
COPY --from=frontend /app/frontend/dist/ src/main/resources/static/
# Tests need a live PostgreSQL database, so run them locally before pushing.
RUN ./mvnw -q -B package -DskipTests

# 3. Run
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=backend /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
