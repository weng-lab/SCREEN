FROM openjdk:8-jdk-alpine as build
COPY . /src
RUN /src/scripts/build.sh

FROM openjdk:8-jre-alpine
COPY --from=build /src/build/screen-importer-*.jar /app/screen-importer.jar