from backend import llm
import asyncio

async def main():
    print("Hello from zoidex!")
    with open("speak.jpg", "rb") as f:
        image_bytes = f.read()
        result = await llm.analyse_image(image_bytes)
        print(result)


if __name__ == "__main__":
    asyncio.run(main())
