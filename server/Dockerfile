FROM denoland/deno:alpine-2.9.6

# DENO_DIR is /deno-dir/ in the base image and owned by the deno user
WORKDIR /app

# no third-party dependencies: this pre-compiles the sources into the V8 code
# cache and typechecks them, so a broken build fails here rather than at boot
COPY deno.json .
COPY src ./src
RUN deno cache src/app.ts && deno check src/app.ts

# drop root; the base image ships an unprivileged deno user (uid 1000)
USER deno

ENV PORT=8080
EXPOSE 8080

# Deno.serve binds 0.0.0.0, so the port is reachable from outside the container.
# The entrypoint prepends `deno`, so CMD carries only its arguments.
CMD ["run", "--cached-only", "--allow-env=PORT", "--allow-net", "src/app.ts"]
