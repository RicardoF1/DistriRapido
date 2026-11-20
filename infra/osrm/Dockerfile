# Imagen de producción de OSRM con el grafo vial de Huancayo ya preparado (MLD, perfil car).
# Reproduce el procedimiento validado en infra/osrm/README.md, pero dentro de la construcción:
# descarga un extracto fechado de Perú de Geofabrik, verifica su SHA-256 fijado, recorta Huancayo con
# osmium y ejecuta osrm-extract, osrm-partition y osrm-customize. No usa la cobertura INEI.
# Datos © OpenStreetMap contributors, licencia ODbL 1.0 (https://www.openstreetmap.org/copyright).
ARG OSRM_IMAGE=ghcr.io/project-osrm/osrm-backend:v26.10.0-debian@sha256:55dbfd47d984c2cacd64e32901b4321c86b5ec761438e69aa053dc78698a786f

FROM debian:trixie-slim@sha256:a72b4433de1cf7d6bae0c4cee74d0547f58601a643b3375f070c51600d63b6b2 AS extract
# Extracto fechado (AAMMDD). Geofabrik sirve bytes distintos para el mismo archivo según el servidor
# que responda (su .md5 tampoco coincide), así que no se puede fijar un hash del PBF: se descarga por
# HTTPS, se valida que osmium pueda leerlo completo y se registra el SHA-256 real del PBF y del recorte
# en /data/PROVENANCE y /data/REVISION. Para actualizar el grafo: cambiar la fecha; cambia el hash de
# este Dockerfile y el workflow de despliegue reconstruye la imagen.
ARG PBF_DATE=261118
ARG BBOX=-75.40,-12.25,-74.80,-11.75
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl osmium-tool \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /data
RUN set -eu; \
    url="https://download.geofabrik.de/south-america/peru/peru-${PBF_DATE}.osm.pbf"; \
    curl -fsSL --retry 3 -o peru.osm.pbf "$url"; \
    pbf_sha="$(sha256sum peru.osm.pbf | cut -d' ' -f1)"; \
    osmium fileinfo --extended --no-progress peru.osm.pbf > /dev/null; \
    osmium extract -b "$BBOX" --strategy complete_ways --no-progress -o huancayo.osm.pbf peru.osm.pbf; \
    rm peru.osm.pbf; \
    sha="$(sha256sum huancayo.osm.pbf | cut -d' ' -f1)"; \
    short="$(echo "$sha" | cut -c1-12)"; \
    echo "geofabrik-peru-${PBF_DATE}-sha256:${short}-car-mld-osrm-v26.10.0" > REVISION; \
    printf 'pbf_url=%s\npbf_sha256=%s\nbbox=%s\nstrategy=complete_ways\nextract_sha256=%s\n' "$url" "$pbf_sha" "$BBOX" "$sha" > PROVENANCE; \
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
