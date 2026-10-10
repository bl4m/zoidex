import json
from groq import AsyncGroq
import base64
import os
from dotenv import load_dotenv

load_dotenv()

client = AsyncGroq(api_key=os.environ.get("GROQ_API_KEY"))
PROMPT = """
You are BioDex, an expert ecological classifier styled like a Pokédex.
Analyze the image provided and return ONLY valid JSON in the required format.
Xp reward is a number between 1 and 100, based on the rarity of the species.
"""


response_format={
    "type": "json_schema",
    "json_schema": {
        "name": "zoidex_response",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "species_name": {"type": "string"},
                "scientific_name": {"type": "string"},
                "category": {"type": "string"},
                "rarity": {"type": "string"},
                "toxicity_warning": {"type": "string"},
                "fun_fact": {"type": "string"},
                "xp_reward": {"type": "number"}
            },
            "required": [
                "species_name",
                "scientific_name",
                "category",
                "rarity",
                "toxicity_warning",
                "fun_fact",
                "xp_reward"
            ],
            "additionalProperties": False
        }
    }
}

async def analyse_image(image_bytes: bytes, content_type: str = "image/jpeg"):

    img = base64.b64encode(image_bytes).decode('utf-8')
    url = f"data:{content_type};base64,{img}"

    response = await client.chat.completions.create(
    messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": PROMPT},
                    {
                        "type": "image_url",
                        "image_url": {"url": url},
                    },
                ],
            }
        ],
        model="qwen/qwen3.8-27b",
        response_format=response_format,
    )

    result = json.loads(response.choices[0].message.content or "{}")
    return result
