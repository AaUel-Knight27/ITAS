FROM eclipse-temurin:21-jre
WORKDIR /app
COPY target/itas-webinar-1.0.0.jar app.jar
EXPOSE 8084
ENTRYPOINT ["java", "-jar", "app.jar"]
