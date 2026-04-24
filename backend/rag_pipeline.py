"""
MTRX-TriAxis | Stage 2: RAG Pipeline
Creates embeddings, stores in FAISS, retrieves relevant chunks,
and answers questions using retrieved context.
"""

import os
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document

from backend.paths import VECTORSTORE_DIR as _DEFAULT_VS_DIR

from backend.llm_utils import get_llm, get_embeddings
from prompts.doubt_solver import get_prompt as get_doubt_prompt

# Default path for persisting the FAISS index (cross-platform via paths.py)
VECTORSTORE_DIR = _DEFAULT_VS_DIR


def create_vectorstore(chunks: list[dict], save_path: str = None) -> FAISS:
    """
    Build a FAISS vector store from content chunks.

    Takes the output of the PDF processor (list of {title, content} dicts),
    converts them to LangChain Documents, embeds them, and saves the index.

    Args:
        chunks: List of dicts with 'title' and 'content' keys.
        save_path: Directory to save the FAISS index. Defaults to data/vectorstore/.

    Returns:
        FAISS vector store instance.
    """
    save_path = save_path or VECTORSTORE_DIR

    # Convert chunks to LangChain Document objects
    documents = []
    for i, chunk in enumerate(chunks):
        doc = Document(
            page_content=chunk.get("content", ""),
            metadata={
                "title": chunk.get("title", f"Chunk {i + 1}"),
                "chunk_index": i,
            }
        )
        documents.append(doc)

    print(f"[INFO] Creating embeddings for {len(documents)} documents...")

    # Create embeddings and build FAISS index
    embeddings = get_embeddings()
    vectorstore = FAISS.from_documents(documents, embeddings)

    # Save to disk for persistence
    os.makedirs(save_path, exist_ok=True)
    vectorstore.save_local(save_path)
    print(f"[INFO] Vector store saved to: {save_path}")

    return vectorstore


def load_vectorstore(load_path: str = None) -> FAISS:
    """
    Load a persisted FAISS vector store from disk.

    Args:
        load_path: Directory containing the FAISS index files.

    Returns:
        FAISS vector store instance.

    Raises:
        FileNotFoundError: If no vector store exists at the path.
    """
    load_path = load_path or VECTORSTORE_DIR

    if not os.path.exists(load_path):
        raise FileNotFoundError(
            f"No vector store found at {load_path}. "
            "Please upload and process a PDF first."
        )

    embeddings = get_embeddings()
    vectorstore = FAISS.load_local(
        load_path,
        embeddings,
        allow_dangerous_deserialization=True  # Required for FAISS
    )
    print(f"[OK] Loaded vector store from: {load_path}")
    return vectorstore


def vectorstore_exists(path: str = None) -> bool:
    """Check if a persisted vector store exists."""
    path = path or VECTORSTORE_DIR
    index_file = os.path.join(path, "index.faiss")
    return os.path.exists(index_file)


def add_to_vectorstore(chunks: list[dict], load_path: str = None) -> FAISS:
    """
    Add new chunks to an existing vector store.
    If no store exists, creates a new one.

    Args:
        chunks: New chunks to add.
        load_path: Path to existing vector store.

    Returns:
        Updated FAISS vector store.
    """
    load_path = load_path or VECTORSTORE_DIR

    # Convert chunks to Documents
    documents = []
    for i, chunk in enumerate(chunks):
        doc = Document(
            page_content=chunk.get("content", ""),
            metadata={
                "title": chunk.get("title", f"Chunk {i + 1}"),
                "chunk_index": i,
            }
        )
        documents.append(doc)

    embeddings = get_embeddings()

    if vectorstore_exists(load_path):
        # Load existing and merge
        vectorstore = load_vectorstore(load_path)
        vectorstore.add_documents(documents)
    else:
        # Create new
        vectorstore = FAISS.from_documents(documents, embeddings)

    # Save updated index
    os.makedirs(load_path, exist_ok=True)
    vectorstore.save_local(load_path)
    print(f"[OK] Added {len(documents)} documents. Total in store updated.")
    return vectorstore


def retrieve_context(query: str, k: int = 5, vectorstore: FAISS = None) -> list[Document]:
    """
    Retrieve the top-k most relevant chunks for a given query.

    Args:
        query: The search query / question.
        k: Number of results to return.
        vectorstore: Optional pre-loaded FAISS instance. Loads from disk if None.

    Returns:
        List of LangChain Document objects with relevant content.
    """
    if vectorstore is None:
        vectorstore = load_vectorstore()

    # Similarity search
    results = vectorstore.similarity_search(query, k=k)
    return results


def rag_query(question: str, k: int = 5, vectorstore: FAISS = None) -> dict:
    """
    Full RAG pipeline: retrieve context → prompt → LLM → answer.

    Args:
        question: The student's question.
        k: Number of context chunks to retrieve.
        vectorstore: Optional pre-loaded FAISS instance.

    Returns:
        Dict with 'answer' and 'sources' (titles of retrieved chunks).
    """
    # Step 1: Retrieve relevant context
    docs = retrieve_context(question, k=k, vectorstore=vectorstore)

    # Step 2: Format context for the prompt
    context_text = "\n\n".join([
        f"**{doc.metadata.get('title', 'Unknown')}:**\n{doc.page_content}"
        for doc in docs
    ])

    # Step 3: Build prompt and generate answer
    llm = get_llm(temperature=0.5)
    prompt = get_doubt_prompt()
    chain = prompt | llm

    answer = chain.invoke({
        "context": context_text,
        "question": question,
    })

    # Step 4: Collect source titles
    sources = [doc.metadata.get("title", "Unknown") for doc in docs]

    return {
        "answer": answer,
        "sources": list(set(sources)),  # Deduplicate
        "context": context_text,
    }


def get_available_topics(vectorstore: FAISS = None) -> list[str]:
    """
    Get a list of all unique topic titles in the vector store.

    Returns:
        List of topic title strings.
    """
    if vectorstore is None:
        vectorstore = load_vectorstore()

    # Access internal document store
    docs = vectorstore.docstore._dict.values()
    topics = set()

    for doc in docs:
        title = doc.metadata.get("title", "")
        if title:
            topics.add(title)

    return sorted(list(topics))
