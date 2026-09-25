import time
import requests
import psutil
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

API_URL = "http://localhost:3000/api/telemetry/circuit-status"
POLL_INTERVAL_SECONDS = 5
TARGET_PROCESS_NAME = "terminal64.exe"

def kill_terminal():
    killed = False
    for proc in psutil.process_iter(['pid', 'name']):
        try:
            if proc.info['name'] and TARGET_PROCESS_NAME in proc.info['name'].lower():
                proc.kill()
                logging.warning(f"CIRCUIT BREAKER ACTIVE: Terminated {TARGET_PROCESS_NAME} (PID: {proc.info['pid']})")
                killed = True
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    return killed

def poll_status():
    while True:
        try:
            response = requests.get(API_URL, timeout=3)
            if response.status_code == 200:
                data = response.json()
                if data.get("circuit_breaker_active") is True:
                    kill_terminal()
            else:
                logging.error(f"API Error: HTTP {response.status_code}")
        except requests.exceptions.RequestException as e:
            logging.debug(f"Connection failed (is the Next.js server running?): {e}")
        
        time.sleep(POLL_INTERVAL_SECONDS)

if __name__ == "__main__":
    logging.info("Aegis Ledger Containment Daemon started.")
    logging.info(f"Polling {API_URL} every {POLL_INTERVAL_SECONDS} seconds...")
    poll_status()