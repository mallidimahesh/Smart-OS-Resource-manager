import json
from flask import Blueprint, request, jsonify
from app.database import db
from app.models.experiment import QuizAttempt
from app.api.auth import get_current_user_optional
from app.services.tutor_service import (
    get_topics_and_concepts,
    get_quiz_questions,
    evaluate_quiz_submission,
    generate_contextual_explanation
)

tutor_bp = Blueprint("tutor", __name__)


@tutor_bp.route("/topics", methods=["GET"])
def get_topics():
    return jsonify(get_topics_and_concepts()), 200


@tutor_bp.route("/quiz", methods=["GET"])
def get_quiz():
    topic = request.args.get("topic")
    questions = get_quiz_questions(topic)
    # Don't expose correct_index in the question prompt!
    sanitized = []
    for q in questions:
        sanitized.append({
            "id": q["id"],
            "topic": q["topic"],
            "question": q["question"],
            "options": q["options"]
        })
    return jsonify({"questions": sanitized}), 200


@tutor_bp.route("/quiz/submit", methods=["POST"])
def submit_quiz():
    data = request.get_json() or {}
    answers = data.get("answers", {})  # {q_id: chosen_index}
    user = get_current_user_optional()

    eval_result = evaluate_quiz_submission(answers)

    # Persist attempt
    try:
        attempt = QuizAttempt(
            user_id=user.id if user else None,
            score_percentage=eval_result["score_percentage"],
            correct_count=eval_result["correct_count"],
            total_questions=eval_result["total_questions"],
            details=json.dumps(eval_result)
        )
        db.session.add(attempt)
        db.session.commit()
    except Exception:
        pass

    return jsonify(eval_result), 200


@tutor_bp.route("/explain", methods=["POST"])
def explain_result():
    data = request.get_json() or {}
    module = data.get("module", "")
    result = data.get("result", {})
    explanation = generate_contextual_explanation(module, result)
    return jsonify(explanation), 200
