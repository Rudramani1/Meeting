import sounddevice as sd
from scipy.io.wavfile import write

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

write(
    "test.wav",
    SAMPLE_RATE,
    audio
)

print("Recording saved as test.wav")