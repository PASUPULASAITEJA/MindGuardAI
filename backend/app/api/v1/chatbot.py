import json
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_db
from app.models.users import User, UserRole
from app.models.chat import Conversation, ChatMessage
from app.schemas.chatbot import (
    CreateConversationRequest,
    ConversationSummary,
    ConversationDetailResponse,
    SendMessageRequest,
    ChatMessageItem,
    ChatResponsePayload,
    BehavioralFeaturesPayload
)
from app.services.conversation_service import conversation_service
from app.services.chatbot_service import chatbot_service
from app.services.behavioral_service import behavioral_service

router = APIRouter(prefix="/chat", tags=["AI Wellness Chatbot"])

@router.post("/conversations", response_model=ConversationSummary, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    payload: CreateConversationRequest = CreateConversationRequest(),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a new private AI Wellness Conversation thread for the authenticated student.
    """
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI Wellness Chatbot is exclusively available for student support."
        )

    conversation = await conversation_service.create_conversation(
        db,
        student_id=current_user.id,
        title=payload.title
    )
    return ConversationSummary(
        id=conversation.id,
        student_id=conversation.student_id,
        title=conversation.title,
        summary=conversation.summary,
        current_risk_level=conversation.current_risk_level,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        message_count=0
    )

@router.get("/conversations", response_model=List[ConversationSummary])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Lists all conversational threads initiated by the current student.
    """
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to student accounts."
        )

    records = await conversation_service.get_student_conversations(db, student_id=current_user.id)
    summaries = []
    for conv, count in records:
        summaries.append(
            ConversationSummary(
                id=conv.id,
                student_id=conv.student_id,
                title=conv.title,
                summary=conv.summary,
                current_risk_level=conv.current_risk_level,
                created_at=conv.created_at,
                updated_at=conv.updated_at,
                message_count=count
            )
        )
    return summaries

@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation_details(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves a conversation thread and its complete chronological message history.
    """
    conversation = await conversation_service.get_conversation(
        db, conversation_id=conversation_id, student_id=current_user.id
    )
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or access denied."
        )

    messages = []
    for msg in conversation.messages:
        emotion_scores = None
        if msg.emotion_scores:
            try:
                emotion_scores = json.loads(msg.emotion_scores)
            except Exception:
                emotion_scores = None

        messages.append(
            ChatMessageItem(
                id=msg.id,
                conversation_id=msg.conversation_id,
                sender=msg.sender.value if hasattr(msg.sender, "value") else str(msg.sender),
                message=msg.message,
                intent=msg.intent,
                primary_emotion=msg.primary_emotion,
                emotion_scores=emotion_scores,
                sentiment_score=msg.sentiment_score,
                risk_level=msg.risk_level,
                is_crisis_flag=msg.is_crisis_flag,
                created_at=msg.created_at
            )
        )

    conv_summary = ConversationSummary(
        id=conversation.id,
        student_id=conversation.student_id,
        title=conversation.title,
        summary=conversation.summary,
        current_risk_level=conversation.current_risk_level,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        message_count=len(messages)
    )

    return ConversationDetailResponse(
        conversation=conv_summary,
        messages=messages
    )

@router.post("/conversations/{conversation_id}/messages", response_model=ChatResponsePayload)
async def send_message(
    conversation_id: UUID,
    payload: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Sends a message to the AI Wellness Chatbot, runs NLP emotion inference,
    safety checks, and returns a supportive, context-aware response.
    """
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can interact with the Wellness Assistant."
        )

    return await chatbot_service.process_student_message(
        db,
        student=current_user,
        conversation_id=conversation_id,
        raw_message=payload.message
    )

@router.post("/conversations/{conversation_id}/messages/stream")
async def send_message_stream(
    conversation_id: UUID,
    payload: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Server-Sent Events (SSE) streaming endpoint for AI wellness chatbot.
    Streams token chunks word-by-word with real-time metadata.
    """
    import asyncio
    from fastapi.responses import StreamingResponse

    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can interact with the Wellness Assistant."
        )

    # Process and retrieve authoritative response and records
    chat_result = await chatbot_service.process_student_message(
        db,
        student=current_user,
        conversation_id=conversation_id,
        raw_message=payload.message
    )

    async def event_generator():
        words = chat_result.response.split(" ")
        for i, word in enumerate(words):
            chunk = {
                "type": "token",
                "content": word + (" " if i < len(words) - 1 else "")
            }
            yield f"data: {json.dumps(chunk)}\n\n"
            await asyncio.sleep(0.02) # Low latency streaming feel

        # Send completion payload with emotion and metadata
        final_payload = {
            "type": "done",
            "data": chat_result.model_dump(mode="json")
        }
        yield f"data: {json.dumps(final_payload)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/conversations/{conversation_id}/messages", response_model=List[ChatMessageItem])
async def get_messages(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves message history for a specific conversation.
    """
    conversation = await conversation_service.get_conversation(
        db, conversation_id=conversation_id, student_id=current_user.id
    )
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or access denied."
        )

    messages = []
    for msg in conversation.messages:
        emotion_scores = None
        if msg.emotion_scores:
            try:
                emotion_scores = json.loads(msg.emotion_scores)
            except Exception:
                emotion_scores = None

        messages.append(
            ChatMessageItem(
                id=msg.id,
                conversation_id=msg.conversation_id,
                sender=msg.sender.value if hasattr(msg.sender, "value") else str(msg.sender),
                message=msg.message,
                intent=msg.intent,
                primary_emotion=msg.primary_emotion,
                emotion_scores=emotion_scores,
                sentiment_score=msg.sentiment_score,
                risk_level=msg.risk_level,
                is_crisis_flag=msg.is_crisis_flag,
                created_at=msg.created_at
            )
        )
    return messages

@router.post("/behavioral-features", status_code=status.HTTP_200_OK)
async def ingest_behavioral_features(
    payload: BehavioralFeaturesPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Consented Desktop/PC & Mobile sensor telemetry ingestion.
    Evaluates baseline deviation, circadian disruption, and auto-dispatches alerts.
    """
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Behavioral telemetry is exclusively available for student accounts."
        )

    return await behavioral_service.ingest_and_evaluate(
        db=db,
        student=current_user,
        payload=payload
    )

@router.get("/behavioral-features/summary", status_code=status.HTTP_200_OK)
async def get_behavioral_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves live digital phenotyping metrics, active PC screen time, and 7-day history for the student dashboard.
    """
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to student accounts."
        )

    return await behavioral_service.get_student_summary(
        db=db,
        student_id=current_user.id
    )
