"""
Prompts for digest generation
"""

DIGEST_ANALYSIS_PROMPT = """Please analyze the following meeting transcript and provide a structured summary with exactly three sections:

1. OVERVIEW: A brief, one-paragraph overview of the meeting (2-3 sentences)
2. KEY DECISIONS: A bulleted list of the key decisions made during the meeting
3. ACTION ITEMS: A bulleted list of action items assigned, including who they were assigned to

Format your response as follows:
OVERVIEW:
[Your overview paragraph here]

KEY DECISIONS:
• [Decision 1]
• [Decision 2]
[etc.]

ACTION ITEMS:
• [Action item 1 - Assigned to: Person]
• [Action item 2 - Assigned to: Person]
[etc.]

Meeting transcript:
{transcript}"""


def get_digest_prompt(transcript: str) -> str:
    """Generate the digest analysis prompt with the provided transcript"""
    return DIGEST_ANALYSIS_PROMPT.format(transcript=transcript)