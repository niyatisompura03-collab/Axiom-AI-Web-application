from memory_extractor import extract_memory


tests = [

"My favourite programming language is Python.",

"I love cheeseburgers.",

"Thank you!",

"I work as an AI engineer."

]


for text in tests:

    print("\nInput:")
    print(text)

    print("Output:")
    print(extract_memory(text))