import requests

def check_settings():
    try:
        response = requests.get("http://127.0.0.1:8000/system/check-settings")
        response.raise_for_status()  # Raise an exception for bad status codes
        print(response.json())
    except requests.exceptions.RequestException as e:
        print(f"Error making request: {e}")

if __name__ == "__main__":
    check_settings()
