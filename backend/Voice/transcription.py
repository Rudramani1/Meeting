import os

from dotenv import load_dotenv
from groq import Groq


load_dotenv()


api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise ValueError(
        "GROQ_API_KEY not found in .env"
    )


groq_client = Groq(
    api_key=api_key
)


# =====================================================
# TRANSCRIBE AUDIO
# =====================================================

def transcribe_audio_file(
    file_path: str,
    language: str | None = None
):

    with open(file_path, "rb") as audio_file:

        transcription = (
            groq_client
            .audio
            .transcriptions
            .create(
                file=audio_file,
                model="whisper-large-v3-turbo",
                response_format="json",
                language=language,
                temperature=0.0
            )
        )

    return transcription.text.strip()