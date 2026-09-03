import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise SystemExit("OPENAI_API_KEY is not configured")

client = OpenAI(api_key=api_key)

print("Available models:")
for model in client.models.list().data:
    print(model.id)
