FROM alpine:3.20

RUN apk add --no-cache python3 py3-pip android-tools curl bash

ARG FRIDA_VERSION=16.7.19
RUN wget -q "https://github.com/frida/frida/releases/download/${FRIDA_VERSION}/frida-server-${FRIDA_VERSION}-android-x86_64.xz" \
    && xz -d "frida-server-${FRIDA_VERSION}-android-x86_64.xz" \
    && mv "frida-server-${FRIDA_VERSION}-android-x86_64" /usr/local/bin/frida-server \
    && chmod +x /usr/local/bin/frida-server

RUN pip3 install --break-system-packages "frida-tools==${FRIDA_VERSION}"

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
