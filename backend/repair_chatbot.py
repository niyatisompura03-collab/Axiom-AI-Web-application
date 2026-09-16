import os
import re

file_path = "c:/Users/bmvsi-151/Documents/Axiom-V2/backend/services/chatbot.py"
with open(file_path, "r") as f:
    content = f.read()

if "if tool_result:" not in content:
    marker = "    # -----------------------\n    # doc is already resolved above\n        \n    model_name = \"openai/gpt-oss-120b\""
    
    replacement = """    if tool_result:

        prompt_messages.append(
            {
                "role": "system",
                "content": f\"\"\"

                A tool has provided information.

                Use this information to answer the user naturally.

                Rules:
                - Do not mention tools.
                - Do not say "according to tool".
                - Do not recalculate (unless calculating a relative date/time based on the tool's provided current datetime).
                - Keep the response conversational.
                - For date/time, treat the tool's result as the absolute truth and never guess timezones from context.

                Tool result:

                {tool_result}

                \"\"\"
            }
        )

    # -----------------------
    # -----------------------
    # Document Context
    # -----------------------
    # doc is already resolved above
        
    model_name = "openai/gpt-oss-120b\""""
    
    content = content.replace(marker, replacement)
    
    with open(file_path, "w") as f:
        f.write(content)
    print("Repaired chatbot.py")
else:
    # If the block is there, let's just make sure the string is updated
    content = content.replace("- Do not recalculate.", "- Do not recalculate (unless calculating a relative date/time based on the tool's provided current datetime).\n                - For date/time, treat the tool's result as the absolute truth and never guess timezones from context.")
    with open(file_path, "w") as f:
        f.write(content)
    print("Updated rules in chatbot.py")
