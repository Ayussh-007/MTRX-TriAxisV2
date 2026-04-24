"""
MTRX-TriAxis | Stage 4: Quiz Engine
Generates MCQ quizzes from curriculum content and evaluates student answers.
"""

import json
import uuid
from backend.llm_utils import get_llm
from backend.rag_pipeline import retrieve_context, load_vectorstore, vectorstore_exists
from prompts.quiz_generator import get_prompt as get_quiz_prompt


def generate_quiz(topic: str, num_questions: int = 5) -> dict:
    """
    Generate a multiple-choice quiz on a given topic.

    Uses the RAG pipeline to retrieve relevant content, then prompts
    the LLM to create MCQ questions from that content.

    Args:
        topic: The topic to quiz on (e.g., "Newton's Laws of Motion").
        num_questions: How many questions to generate (default: 5).

    Returns:
        Dict with:
            - quiz_id: unique identifier
            - topic: the quiz topic
            - questions: list of MCQ dicts [{question, options, correct, explanation}, ...]
    """
    # Step 1: Retrieve relevant content from vector store
    if not vectorstore_exists():
        return {
            "error": "No curriculum loaded. Please upload and process a PDF first.",
            "quiz_id": None,
            "topic": topic,
            "questions": [],
        }

    docs = retrieve_context(topic, k=5)
    context = "\n\n".join([doc.page_content for doc in docs])

    if not context.strip():
        return {
            "error": f"No content found for topic: {topic}",
            "quiz_id": None,
            "topic": topic,
            "questions": [],
        }

    # Step 2: Generate MCQs using LLM
    llm = get_llm(temperature=0.7)
    prompt = get_quiz_prompt()
    chain = prompt | llm

    print(f"[INFO] Generating {num_questions} questions on: {topic}...")
    response = chain.invoke({
        "topic": topic,
        "context": context,
        "num_questions": str(num_questions),
    })

    # Step 3: Parse the JSON response
    questions = _parse_quiz_response(response)

    quiz_id = str(uuid.uuid4())[:8]

    return {
        "quiz_id": quiz_id,
        "topic": topic,
        "questions": questions,
        "error": None if questions else "Failed to generate valid questions.",
    }


def evaluate_answers(quiz_data: dict, student_answers: dict) -> dict:
    """
    Evaluate a student's quiz answers and calculate the score.

    Args:
        quiz_data: The quiz dict from generate_quiz().
        student_answers: Dict mapping question index → selected option letter.
                         Example: {0: "A", 1: "C", 2: "B"}

    Returns:
        Dict with:
            - score: number of correct answers
            - max_score: total number of questions
            - percentage: score as percentage
            - results: list of per-question results with explanations
    """
    questions = quiz_data.get("questions", [])
    results = []
    correct_count = 0

    for i, question in enumerate(questions):
        student_answer = student_answers.get(i, "")
        correct_answer = question.get("correct", "")
        is_correct = student_answer.upper() == correct_answer.upper()

        if is_correct:
            correct_count += 1

        results.append({
            "question_index": i,
            "question": question.get("question", ""),
            "student_answer": student_answer,
            "correct_answer": correct_answer,
            "is_correct": is_correct,
            "explanation": question.get("explanation", ""),
        })

    max_score = len(questions)
    percentage = round((correct_count / max_score) * 100, 1) if max_score > 0 else 0

    return {
        "score": correct_count,
        "max_score": max_score,
        "percentage": percentage,
        "results": results,
    }


def _parse_quiz_response(response: str) -> list[dict]:
    """
    Parse LLM response into a list of question dicts.
    Handles common LLM quirks (extra text, markdown code blocks).
    """
    import re

    # Remove markdown code blocks if present
    cleaned = response.strip()
    cleaned = re.sub(r'^```json\s*', '', cleaned)
    cleaned = re.sub(r'^```\s*', '', cleaned)
    cleaned = re.sub(r'\s*```$', '', cleaned)

    # Try direct parse
    try:
        questions = json.loads(cleaned)
        if isinstance(questions, list):
            return _validate_questions(questions)
    except json.JSONDecodeError:
        pass

    # Find JSON array in the response
    json_match = re.search(r'\[[\s\S]*\]', response)
    if json_match:
        try:
            questions = json.loads(json_match.group())
            if isinstance(questions, list):
                return _validate_questions(questions)
        except json.JSONDecodeError:
            pass

    print("[WARN] Could not parse quiz response as JSON")
    return []


def _validate_questions(questions: list) -> list[dict]:
    """Validate that questions have the required structure."""
    valid = []
    for q in questions:
        if all(key in q for key in ["question", "options", "correct"]):
            # Ensure options is a dict with A-D keys
            if isinstance(q["options"], dict) and len(q["options"]) >= 2:
                valid.append(q)
    return valid
