from groq import Groq
from dotenv import load_dotenv
import os
import json

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


def extract_memory(user_message):

    response = client.chat.completions.create(

        model="openai/gpt-oss-120b",

        messages=[

            {
                "role": "system",
                "content": """
                    You are a memory extraction AI.

                    Extract useful long-term user information.

                    Save:
                    Possible categories:
                    - preference
                    - profession
                    - education
                    - goal
                    - hobby
                    - skill
                    - personal
                    - past_profession
                    - important personal facts

                    Important extraction rules:

                    - "I work as..." → profession
                    - "I am employed as..." → profession
                    - "My job is..." → profession

                    - "I am studying..." → education
                    - "I am learning..." → education
                    - "I am taking a course..." → education

                    - "I want to become..." → goal
                    - "My dream is..." → goal
                    - "I hope to become..." → goal

                    - "I used to work as..." → past_profession

                    - "I like..." or "My favorite..." → preference
                    
                    Do NOT save information when the user is:

                    - asking a question
                    - requesting an explanation
                    - asking for help
                    - requesting examples
                    - solving math
                    - asking for jokes
                    - asking for facts
                    - requesting tutorials
                    - asking definitions

                    Only save memories when the user reveals information ABOUT THEMSELVES.

                    Extract only what is explicitly stated.
                    Do not assume facts that the user did not say.

                    Do NOT assume information.

                        Examples:

                        "I am learning AI engineering."
                        → education

                        "I work as an AI engineer."
                        → profession

                        "I want to become an AI engineer."
                        → goal

                        "I used to work as an AI engineer."
                        → past_profession

                        "I like AI engineering."
                        → interest or hobby

                        Never convert one category into another.
                        Only extract what the user explicitly says.

                    Ignore:
                    - greetings
                    - temporary questions
                    - thank you messages
                    - small talk


                    Return ONLY valid JSON.

                    Format:

                    {
                        "memory": "actual value",
                        "category": "preference/personality/skill/personal",
                        "key": "short memory name",
                        "memory_type": "single_value or multi_value",
                        "confidence":0.0-1.0
                    }


                    If there is no useful memory return:

                    {
                        "memory": null
                    }
                    """
            },

            {
                "role":"user",
                "content":user_message
            }

        ],

        temperature=0

    )


    result = response.choices[0].message.content.strip()

    # Remove markdown code fences if present
    result = result.replace("```json", "")
    result = result.replace("```", "")
    result = result.strip()

    if not result:
        return {"memory":None}

    try:
        return json.loads(result)

    except json.JSONDecodeError:

        return {
        "memory": None
    }