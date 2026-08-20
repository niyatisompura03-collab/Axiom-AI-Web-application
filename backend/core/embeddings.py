from fastembed import TextEmbedding

_model = None


def get_embedding_model():
    global _model

    if _model is None:
        _model = TextEmbedding(
            model_name="BAAI/bge-small-en-v1.5"
        )

    return _model


def create_embedding(text):
    model = get_embedding_model()

    embedding = next(model.embed([text]))

    return embedding