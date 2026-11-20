# Imagen de producción de OSRM con el grafo vial de Huancayo ya preparado (MLD, perfil car).
# Reproduce el procedimiento validado en infra/osrm/README.md, pero dentro de la construcción:
# descarga un extracto fechado de Perú de Geofabrik, verifica su SHA-256 fijado, recorta Huancayo con
# osmium y ejecuta osrm-extract, osrm-partition y osrm-customize. No usa la cobertura INEI.
# Datos © OpenStreetMap contributors, licencia ODbL 1.0 (https://www.openstreetmap.org/copyright).
ARG OSRM_IMAGE=ghcr.io/project-osrm/osrm-backend:v26.10.0-debian@sha256:55dbfd47d984c2cacd64e32901b4321c86b5ec761438e69aa053dc78698a786f

FROM debian:trixie-slim@sha256:a72b4433de1cf7d6bae0c4cee74d0547f58601a643b3375f070c51600d63b6b2 AS extract
# Extracto fechado (AAMMDD) y su SHA-256, calculado el 2026-11-19 sobre dos descargas idénticas.
# El .md5 que publica Geofabrik para este archivo no coincidía con el contenido servido, por eso se fija
# el SHA-256. Para actualizar el grafo: cambiar fecha y hash; cambia el hash de este Dockerfile y el
# workflow de despliegue reconstruye la imagen.
ARG PBF_DATE=261118
ARG PBF_SHA256=85a4f3844dde21e77ffdf4d2a0d1a3e2058484b1e8b9c1455571656f1c141d9d
ARG BBOX=-75.40,-12.25,-74.80,-11.75
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl osmium-tool \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /data
RUN set -eu; \
    url="https://download.geofabrik.de/south-america/peru/peru-${PBF_DATE}.osm.pbf"; \
    curl -fsSL --retry 3 -o peru.osm.pbf "$url"; \
    echo "${PBF_SHA256}  peru.osm.pbf" | sha256sum -c -; \
    osmium extract -b "$BBOX" --strategy complete_ways --no-progress -o huancayo.osm.pbf peru.osm.pbf; \
    rm peru.osm.pbf; \
    sha="$(sha256sum huancayo.osm.pbf | cut -d' ' -f1)"; \
    short="$(echo "$sha" | cut -c1-12)"; \
    echo "geofabrik-peru-${PBF_DATE}-sha256:${short}-car-mld-osrm-v26.10.0" > REVISION; \
    printf 'pbf_url=%s\npbf_sha256=%s\nbbox=%s\nstrategy=complete_ways\nextract_sha256=%s\n' "$url" "$PBF_SHA256" "$BBOX" "$sha" > PROVENANCE; \
    cat PROVENANCE REVISION

FROM ${OSRM_IMAGE} AS graph
COPY --from=extract /data/ /data/
RUN osrm-extract -p /opt/car.lua /data/huancayo.osm.pbf \
 && osrm-partition /data/huancayo \
 && osrm-customize /data/huancayo \
 && rm /data/huancayo.osm.pbf \
 && chmod -R a+rX /data

FROM ${OSRM_IMAGE}
COPY --from=graph /data/ /data/
# Render asigna PORT; en local se puede publicar el 5000.
ENV PORT=5000
EXPOSE 5000
USER 65534:65534
CMD ["sh", "-c", "exec osrm-routed --algorithm mld --port \"$PORT\" --max-viaroute-size 32 /data/huancayo.osrm"]
