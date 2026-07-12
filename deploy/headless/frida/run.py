#!/usr/bin/env python3
"""Attach Frida hook to RikkaHub and keep session alive until killed."""
import os
import signal
import time
import frida

FRIDA_HOST = os.environ.get("FRIDA_HOST", "rikkahub-redroid:27042")
PACKAGE = os.environ.get("PACKAGE", "me.rerere.rikkahub.debug")
SCRIPT_PATH = os.environ.get("HOOK_SCRIPT", "/opt/frida/rikkahub-headless.js")

session = None
script = None
running = True


def on_message(message, data):
    if message["type"] == "send":
        print(f"[frida] {message['payload']}", flush=True)
    elif message["type"] == "error":
        print(f"[frida] {message.get('description', message)}", flush=True)
        st = message.get("stack")
        if st:
            print(st, flush=True)


def cleanup():
    global session, script
    if script:
        try: script.unload()
        except Exception: pass
    if session:
        try: session.detach()
        except Exception: pass


def handle_signal(signum, frame):
    global running
    print(f"[run.py] signal {signum}, exiting", flush=True)
    running = False


def main():
    global session, script, running
    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)

    print(f"[run.py] connecting to {FRIDA_HOST}", flush=True)
    device = frida.get_device_manager().add_remote_device(FRIDA_HOST)
    print(f"[run.py] device: {device}", flush=True)

    with open(SCRIPT_PATH, "r") as f:
        code = f.read()

    print(f"[run.py] finding {PACKAGE} process", flush=True)
    target = None
    for _ in range(30):
        procs = device.enumerate_processes()
        target = next(
            (p for p in procs if PACKAGE in p.name or "rikkahub" in p.name.lower()),
            None,
        )
        if target:
            break
        time.sleep(2)
    if not target:
        print("[run.py] ERROR: could not find process", flush=True)
        return
    print(f"[run.py] attaching to pid={target.pid}", flush=True)

    session = device.attach(target.pid)
    script = session.create_script(code)
    script.on("message", on_message)
    script.load()
    print("[run.py] hook loaded", flush=True)

    while running:
        time.sleep(5)

    cleanup()
    print("[run.py] exited", flush=True)


if __name__ == "__main__":
    main()
