FROM python:3.11-slim-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends adb curl xz-utils procps ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ARG FRIDA_VERSION=16.7.19
RUN curl -fsSL "https://github.com/frida/frida/releases/download/${FRIDA_VERSION}/frida-server-${FRIDA_VERSION}-android-x86_64.xz" \
      -o "frida-server-${FRIDA_VERSION}-android-x86_64.xz" \
    && xz -d "frida-server-${FRIDA_VERSION}-android-x86_64.xz" \
    && mv "frida-server-${FRIDA_VERSION}-android-x86_64" /usr/local/bin/frida-server \
    && chmod +x /usr/local/bin/frida-server \
    && pip3 install --no-cache-dir "frida==${FRIDA_VERSION}"

COPY deploy/headless/apk/rikkahub.apk /opt/rikkahub.apk
COPY deploy/headless/apk/rikkahub-version /opt/rikkahub-version
COPY deploy/headless/apk/rikkahub.apk.sha256 /tmp/rikkahub.apk.sha256
COPY deploy/headless/manager/entrypoint.sh /entrypoint.sh
COPY deploy/headless/frida /opt/frida
RUN cd /opt && sha256sum -c /tmp/rikkahub.apk.sha256 \
    && test -s /opt/rikkahub-version \
    && chmod +x /entrypoint.sh \
    && rm /tmp/rikkahub.apk.sha256

ENTRYPOINT ["/entrypoint.sh"]
