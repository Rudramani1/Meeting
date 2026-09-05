import os
import tempfile
from dotenv import load_dotenv
import sounddevice as sd
from scipy.io.wavfile import write
from groq import Groq


load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise ValueError("GROQ_API_KEY not found in .env")

client = Groq(api_key=api_key)

print("Groq client connected successfully")


SAMPLE_RATE = 16000
SECONDS = 5

print("Speak now...")

audio = sd.rec(
    int(SECONDS * SAMPLE_RATE),
    samplerate=SAMPLE_RATE,
    channels=1,
    dtype="int16"
)

sd.wait()

print("Recording finished. Converting to text...")

with tempfile.NamedTemporaryFile(
    suffix=".wav",
    delete=False
) as temp:
    filename = temp.name

write(filename, SAMPLE_RATE, audio)

with open(filename, "rb") as audio_file:
    transcription = client.audio.transcriptions.create(
        file=(filename, audio_file.read()),
        model="whisper-large-v3-turbo"
    )

print("\nYou said:")
print(transcription.text)

os.remove(filename)