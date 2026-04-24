"""
MTRX-TriAxis | Stage 6: Weather Context
Fetches weather data from OpenWeatherMap and provides context-aware
teaching suggestions.
"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

# Configuration
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
DEFAULT_CITY = os.getenv("WEATHER_CITY", "Mumbai")
BASE_URL = "https://api.openweathermap.org/data/2.5/weather"


def get_weather(city: str = None) -> dict:
    """
    Fetch current weather data for a given city.

    Args:
        city: City name (e.g., "Mumbai", "London"). Defaults to env config.

    Returns:
        Dict with weather info:
            - temp: temperature in Celsius
            - feels_like: feels-like temperature
            - humidity: humidity percentage
            - description: weather description (e.g., "light rain")
            - main: main weather category (e.g., "Rain", "Clear")
            - wind_speed: wind speed in m/s
            - city: city name
        Returns None if API call fails.
    """
    city = city or DEFAULT_CITY

    if not OPENWEATHER_API_KEY or OPENWEATHER_API_KEY == "your_api_key_here":
        print("[WARN] OpenWeatherMap API key not configured")
        return None

    params = {
        "q": city,
        "appid": OPENWEATHER_API_KEY,
        "units": "metric",  # Celsius
    }

    try:
        response = requests.get(BASE_URL, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        return {
            "temp": data["main"]["temp"],
            "feels_like": data["main"]["feels_like"],
            "humidity": data["main"]["humidity"],
            "description": data["weather"][0]["description"],
            "main": data["weather"][0]["main"],
            "wind_speed": data["wind"].get("speed", 0),
            "city": data.get("name", city),
        }

    except requests.exceptions.HTTPError as e:
        print(f"[WARN] Weather API HTTP error: {e}")
        return None
    except requests.exceptions.ConnectionError:
        print("[WARN] Could not connect to weather API")
        return None
    except Exception as e:
        print(f"[WARN] Weather API error: {e}")
        return None


def is_bad_weather(weather_data: dict) -> bool:
    """
    Determine if the weather is considered "bad" for teaching.

    Bad weather conditions include:
        - Rain, thunderstorm, snow
        - Extreme temperatures (below 5°C or above 40°C)
        - Very high humidity (above 90%)

    Args:
        weather_data: Dict from get_weather().

    Returns:
        True if conditions are unfavorable.
    """
    if weather_data is None:
        return False

    main = weather_data.get("main", "").lower()
    temp = weather_data.get("temp", 25)
    humidity = weather_data.get("humidity", 50)

    # Check weather type
    bad_conditions = ["rain", "thunderstorm", "snow", "drizzle", "squall", "tornado"]
    if main in bad_conditions:
        return True

    # Check extreme temperatures
    if temp < 5 or temp > 40:
        return True

    # Check very high humidity
    if humidity > 90:
        return True

    return False


def get_context_suggestion(weather_data: dict, class_topics: list[str] = None) -> str:
    """
    Generate a context-aware teaching suggestion based on weather.

    This is a rule-based suggestion (no LLM call needed) for quick advice.
    For full AI-generated suggestions, use teacher_insights.generate_teaching_suggestions().

    Args:
        weather_data: Dict from get_weather().
        class_topics: Optional list of topics being covered.

    Returns:
        Suggestion string based on current conditions.
    """
    if weather_data is None:
        return "Weather data unavailable. Proceed with normal teaching schedule."

    main = weather_data.get("main", "").lower()
    temp = weather_data.get("temp", 25)
    description = weather_data.get("description", "")

    suggestions = []

    # Weather-based suggestions
    if main in ["rain", "drizzle"]:
        suggestions.append(
            "🌧️ Rainy conditions detected. Students may arrive late or feel drowsy. "
            "Consider starting with an engaging activity or interactive discussion "
            "rather than heavy lecture content."
        )
    elif main == "thunderstorm":
        suggestions.append(
            "⛈️ Thunderstorm alert! Students may be anxious or distracted. "
            "Plan indoor group activities and avoid assignments requiring "
            "outdoor work. Keep the session lighter."
        )
    elif main == "snow":
        suggestions.append(
            "❄️ Snowy conditions. Expect lower attendance. "
            "Consider recording today's session. Focus on revision "
            "or fun group activities for students who attend."
        )
    elif temp > 35:
        suggestions.append(
            f"🌡️ High temperature ({temp}°C). Students may be fatigued. "
            "Include short breaks, keep sessions interactive, "
            "and avoid lengthy lectures."
        )
    elif temp < 10:
        suggestions.append(
            f"🥶 Cold weather ({temp}°C). Ensure classroom is comfortable. "
            "Start with a warm-up activity to get students energized."
        )
    else:
        suggestions.append(
            f"☀️ Weather is pleasant ({description}, {temp}°C). "
            "Great conditions for focused learning!"
        )

    return " ".join(suggestions)


def get_weather_summary(city: str = None) -> str:
    """
    Get a formatted weather summary string for display.

    Args:
        city: City name.

    Returns:
        Formatted weather string for the UI.
    """
    weather = get_weather(city)

    if weather is None:
        return "Weather: Unable to fetch data (check API key configuration)"

    emoji_map = {
        "clear": "☀️",
        "clouds": "☁️",
        "rain": "🌧️",
        "drizzle": "🌦️",
        "thunderstorm": "⛈️",
        "snow": "❄️",
        "mist": "🌫️",
        "fog": "🌫️",
        "haze": "🌫️",
    }

    main_lower = weather["main"].lower()
    emoji = emoji_map.get(main_lower, "🌡️")

    return (
        f"{emoji} {weather['city']}: {weather['description'].title()}, "
        f"{weather['temp']}°C (feels like {weather['feels_like']}°C), "
        f"Humidity: {weather['humidity']}%"
    )
