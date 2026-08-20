from embeddings import create_embedding

vector = create_embedding(
    "I am learning AI Engineering."
)

print(len(vector))
print(vector[:10])