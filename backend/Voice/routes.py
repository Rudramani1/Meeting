import os
import tempfile

from fastapi import APIRouter, UploadFile, File, HTTPException

from Voice.transcription import transcribe_audio_file


router = APIRouter()


# =====================================================
# TRANSCRIBE AUDIO
# =====================================================

@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...)
):

    # -------------------------------------------------
    # CHECK FILE
    # -------------------------------------------------

    if not file:
        raise HTTPException(
            status_code=400,
            detail="Audio file is required"
        )

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Invalid audio file"
        )


    # -------------------------------------------------
    # GET FILE EXTENSION
    # -------------------------------------------------

    extension = os.path.splitext(
        file.filename
    )[1]

    if not extension:
        extension = ".webm"


    # -------------------------------------------------
    # SAVE TEMPORARY AUDIO FILE
    # -------------------------------------------------

    temp_path = None

    try:

        with tempfile.NamedTemporaryFile(
            suffix=extension,
            delete=False
        ) as temp_file:

            temp_path = temp_file.name

            audio_data = await file.read()

            if not audio_data:
                raise HTTPException(
                    status_code=400,
                    detail="Audio file is empty"
                )

            temp_file.write(audio_data)


        print(
            f"Transcribing audio: "
            f"{file.filename}"
        )


        # -------------------------------------------------
        # SEND TO GROQ
        # -------------------------------------------------

        text = transcribe_audio_file(
            temp_path
        )


        print(
            f"Transcription: {text}"
        )


        # -------------------------------------------------
        # RETURN RESULT
        # -------------------------------------------------

        return {
            "success": True,
            "text": text
        }


    except HTTPException:
        raise


    except Exception as error:

        print(
            "Transcription error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to transcribe audio"
        )


    finally:

        # -------------------------------------------------
        # DELETE TEMP FILE
        # -------------------------------------------------

        if temp_path and os.path.exists(temp_path):

            os.remove(temp_path)