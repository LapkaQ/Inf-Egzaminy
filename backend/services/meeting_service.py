"""
Serwis integracji z Zoom API (Server-to-Server OAuth).
Odpowiada za generowanie tokenów, tworzenie i usuwanie spotkań.
"""
import time
import base64
import logging
import requests
from datetime import datetime
from core.config import settings

logger = logging.getLogger(__name__)

# ── Token cache ──────────────────────────────────────────
_token_cache: dict = {"access_token": None, "expires_at": 0}

ZOOM_TOKEN_URL = "https://zoom.us/oauth/token"
ZOOM_API_BASE = "https://api.zoom.us/v2"


def _get_access_token() -> str:
    """
    Pobiera access token z Zoom OAuth (Server-to-Server).
    Token jest cache'owany w pamięci – nowy request dopiero gdy stary wygaśnie.
    """
    now = time.time()
    if _token_cache["access_token"] and _token_cache["expires_at"] > now + 60:
        return _token_cache["access_token"]

    auth_str = f"{settings.ZOOM_CLIENT_ID}:{settings.ZOOM_CLIENT_SECRET}"
    encoded_auth = base64.b64encode(auth_str.encode()).decode()

    response = requests.post(
        ZOOM_TOKEN_URL,
        params={
            "grant_type": "account_credentials",
            "account_id": settings.ZOOM_ACCOUNT_ID,
        },
        headers={
            "Authorization": f"Basic {encoded_auth}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout=10,
    )

    if response.status_code != 200:
        logger.error("Zoom token error: %s %s", response.status_code, response.text)
        raise Exception(f"Nie udało się pobrać tokenu Zoom: {response.status_code}")

    data = response.json()
    _token_cache["access_token"] = data["access_token"]
    _token_cache["expires_at"] = now + data.get("expires_in", 3600)

    logger.info("Zoom access token odświeżony, wygasa za %ds", data.get("expires_in", 3600))
    return _token_cache["access_token"]


def create_zoom_meeting(
    topic: str,
    start_time: datetime,
    duration_minutes: int,
) -> dict:
    """
    Tworzy zaplanowane spotkanie na Zoom.

    Returns:
        dict z kluczami:
          - join_url: link dla uczestników
          - start_url: link dla hosta
          - meeting_id: id spotkania w Zoom
          - password: hasło spotkania
    """
    token = _get_access_token()

    # Zoom wymaga formatu ISO 8601 bez "Z" na końcu, w UTC
    start_iso = start_time.strftime("%Y-%m-%dT%H:%M:%SZ")

    payload = {
        "topic": topic,
        "type": 2,  # 2 = Scheduled meeting
        "start_time": start_iso,
        "duration": duration_minutes,
        "timezone": "Europe/Warsaw",
        "settings": {
            "host_video": True,
            "participant_video": True,
            "join_before_host": True,
            "jbh_time": 5,  # uczestnicy mogą wejść 5 min wcześniej
            "mute_upon_entry": False,
            "waiting_room": False,
            "auto_recording": "none",
        },
    }

    response = requests.post(
        f"{ZOOM_API_BASE}/users/me/meetings",
        json=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        timeout=15,
    )

    if response.status_code not in (200, 201):
        logger.error("Zoom create meeting error: %s %s", response.status_code, response.text)
        raise Exception(f"Nie udało się utworzyć spotkania Zoom: {response.status_code}")

    data = response.json()
    logger.info("Zoom meeting created: id=%s", data.get("id"))

    return {
        "join_url": data["join_url"],
        "start_url": data["start_url"],
        "meeting_id": str(data["id"]),
        "password": data.get("password", ""),
    }


def delete_zoom_meeting(meeting_id: str) -> bool:
    """
    Usuwa spotkanie z Zoom (np. przy anulowaniu rezerwacji).
    Zwraca True jeśli usunięto, False jeśli nie udało się.
    """
    if not meeting_id:
        return False

    try:
        token = _get_access_token()
        response = requests.delete(
            f"{ZOOM_API_BASE}/meetings/{meeting_id}",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        if response.status_code == 204:
            logger.info("Zoom meeting %s deleted", meeting_id)
            return True
        else:
            logger.warning("Zoom delete meeting %s: %s", meeting_id, response.status_code)
            return False
    except Exception as e:
        logger.error("Zoom delete meeting error: %s", e)
        return False
