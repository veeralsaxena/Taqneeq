"""
automation_engine.py — Native Python Automations for NeuroLogistics

This module replaces the external n8n node engine with pure Python code,
proving the robustness of the backend for enterprise integrations.

Handles:
1. Slack Interactive Escalations (Block Kit via HTTPx)
2. Twilio SMS Alerts (via official `twilio` SDK)
3. Automated PDF Dispatch Generation (via `reportlab`)
"""

import httpx
import asyncio
import logging
import os
from typing import Dict, Any

from twilio.rest import Client as TwilioClient
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

logger = logging.getLogger(__name__)

# --- CONFIGURATION & SIMULATION MODE ---
# If these environment variables are missing, the system falls back to SIMULATION MODE,
# where it beautifully logs the exact payload/PDF paths it *would* have sent.
# This makes it hackathon-safe without requiring judges to set up Twilio accounts.

SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL") 
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER", "+18005550199")
VIP_CLIENT_NUMBER = os.getenv("VIP_CLIENT_NUMBER", "+15551234567")

# --- SLACK ESCALATION (BLOCK KIT) ---

async def trigger_slack_escalation(shipment_id: str, cost: float, delay: float, reason: str, alternatives: list):
    """
    Sends an interactive Slack message requesting human approval when an agent hits an ESCALATE guardrail limit.
    Uses Slack's Block Kit UI framework for a beautiful interface.
    """
    # Constructing a rich Slack Block Kit layout
    blocks = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": "🚨 HIGH COST REROUTE REQUIRED",
                "emoji": True
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*Shipment:* `{shipment_id}`\n*Reason:* {reason}\n*Predicted Delay if Ignored:* {delay:.1f} hours\n*Proposed Reroute Cost:* ${cost:.2f}"
            }
        },
        {"type": "divider"}
    ]

    for alt in alternatives:
        blocks.append({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"• *{alt['carrier']}*: ${alt['cost']:.2f} (ETA: {alt['eta']:.1f}hrs)"
            }
        })

    blocks.append({
        "type": "actions",
        "elements": [
            {
                "type": "button",
                "text": {"type": "plain_text", "text": "Approve Escalation", "emoji": True},
                "style": "primary",
                "value": f"approve_{shipment_id}",
                "action_id": "approve_reroute"
            },
            {
                "type": "button",
                "text": {"type": "plain_text", "text": "Reject & Hold", "emoji": True},
                "style": "danger",
                "value": f"reject_{shipment_id}",
                "action_id": "reject_reroute"
            }
        ]
    })

    payload = {"blocks": blocks}

    if not SLACK_WEBHOOK_URL:
        logger.warning(f"🧪 [SIMULATION MODE] Slack Webhook URL not set.")
        logger.info(f"👉 Would have sent Slack Block Kit to operations channel for {shipment_id}")
        return True

    # Real execution
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(SLACK_WEBHOOK_URL, json=payload, timeout=5.0)
            response.raise_for_status()
            logger.info(f"✅ Successfully fired Slack Interactive Message for {shipment_id}")
            return True
    except Exception as e:
        logger.error(f"❌ Failed to reach Slack Webhook: {e}")
        return False

# --- PDF DISPATCH GENERATION ---

async def trigger_pdf_dispatch(shipment_id: str, carrier_name: str, final_cost: float, new_eta: str):
    """
    Dynamically generates a professional PDF Bill of Lading (BOL) 
    and 'emails' it to the carrier (simulated via file creation).
    """
    output_dir = os.path.join(os.path.dirname(__file__), "dispatches")
    os.makedirs(output_dir, exist_ok=True)
    
    file_path = os.path.join(output_dir, f"Dispatch_{shipment_id}.pdf")
    
    # Generate the PDF using reportlab
    c = canvas.Canvas(file_path, pagesize=letter)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(50, 750, "NeuroLogistics")
    c.setFont("Helvetica", 14)
    c.drawString(50, 720, "Automated Reroute Dispatch Order")
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, 680, "Carrier:")
    c.setFont("Helvetica", 12)
    c.drawString(150, 680, carrier_name)
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, 660, "Shipment ID:")
    c.setFont("Helvetica", 12)
    c.drawString(150, 660, shipment_id)
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, 640, "Authorized Rate:")
    c.setFont("Helvetica", 12)
    c.drawString(150, 640, f"${final_cost:.2f}")

    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, 620, "Contract SLA (ETA):")
    c.setFont("Helvetica", 12)
    c.drawString(150, 620, str(new_eta))

    c.line(50, 600, 550, 600)
    
    c.setFont("Helvetica-Oblique", 10)
    c.drawString(50, 580, "This order was automatically negotiated and approved by the NeuroLogistics AI Engine.")
    
    c.save()
    logger.info(f"✅ Generated PDF Dispatch Order: {file_path}")
    
    return file_path

# --- TWILIO SMS ---

async def trigger_sms_alert(shipment_id: str, risk_level: str, cause: str):
    """
    Sends a Twilio SMS to a mock VIP client when a severe disruption occurs.
    """
    message_body = (
        f"NeuroLogistics Alert: Shipment {shipment_id} encountered {cause} "
        f"(Risk: {risk_level}). Our agents are actively securing a reroute. ETA updating shortly."
    )
    
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        logger.warning(f"🧪 [SIMULATION MODE] Twilio credentials not set.")
        logger.info(f"📱 Would have sent SMS to {VIP_CLIENT_NUMBER}: '{message_body}'")
        return True

    try:
        # Twilio SDK is synchronous, so we run it in a thread to not block FastAPI
        def send_sms():
            client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
            message = client.messages.create(
                body=message_body,
                from_=TWILIO_FROM_NUMBER,
                to=VIP_CLIENT_NUMBER
            )
            return message.sid

        loop = asyncio.get_event_loop()
        message_sid = await loop.run_in_executor(None, send_sms)
        logger.info(f"✅ Twilio SMS sent! SID: {message_sid}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send Twilio SMS: {e}")
        return False
