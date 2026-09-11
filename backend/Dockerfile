# syntax=docker/dockerfile:1

# ---- build stage -----------------------------------------------------------
# The official Maven image ships a working `mvn`, deliberately used here instead of this
# project's own ./mvnw — the wrapper script self-downloads a full Maven distribution zip on
# first run (distributionType=only-script in .mvn/wrapper/maven-wrapper.properties, no
# vendored maven-wrapper.jar), and that download reliably corrupts inside a Docker build
# sandbox ("gzip: stdin has more than one entry" / "tar: Child returned status 2" — confirmed
# by actually building this image, not assumed).
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

# Cache Maven dependencies separately from source so a source-only change
# doesn't re-download the whole repository on every build.
COPY pom.xml ./
RUN mvn -q dependency:go-offline -B

COPY src src
# Not -o (offline): `go-offline` above doesn't reliably fetch every test-scope/plugin-resolved
# artifact `package` ends up needing (confirmed by actually building this image) — let this step
# fetch the handful it's still missing rather than failing outright.
RUN mvn -q -DskipTests package -B

# ---- runtime stage ----------------------------------------------------------
# A JRE, not a JDK — the built jar doesn't need a compiler at runtime.
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Run as a non-root user rather than the container default root.
RUN groupadd -r lims && useradd -r -g lims lims
COPY --from=build /app/target/*.jar app.jar
RUN chown lims:lims app.jar
USER lims

EXPOSE 8080
# Every setting this app reads is already externalised as an environment variable with a
# dev-friendly default in application.yml (DB_URL, JWT_SECRET, IRD_*, ESEWA_*, KHALTI_*,
# BACKUP_*, etc. — see docs/ENVIRONMENT.md) — no separate Spring "prod" profile file exists or
# is needed; override what you need via the container's environment.
#
# Flyway runs its migrations on startup (see FlywayMigrationInitializer in the app) — no
# separate migration step is needed before starting the container.
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
