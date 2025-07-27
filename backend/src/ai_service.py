import google.generativeai as genai
from typing import Generator, Dict, Any
import json
import re
from .config import settings

class GeminiService:
    def __init__(self):
        genai.configure(api_key=settings.gemini_api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash')
        
    def get_prompt(self) -> str:
        return """
        Please analyze the following meeting transcript and provide a structured summary in JSON format.

        The JSON response should have exactly this structure:
        {
            "overview": "A brief one-paragraph overview of the meeting",
            "key_decisions": ["Decision 1", "Decision 2", "Decision 3"],
            "action_items": ["Action item 1 - Assigned to Person", "Action item 2 - Assigned to Person"]
        }

        Important guidelines:
        - Keep the overview to 2-3 sentences maximum
        - Extract only concrete decisions that were actually made
        - For action items, always include who is responsible when mentioned
        - If no decisions or action items are found, use empty arrays
        - Ensure the response is valid JSON

        Meeting Transcript:
        """

    def generate_digest(self, transcript: str) -> Dict[str, Any]:
        """Generate a digest for a meeting transcript."""
        try:
            prompt = self.get_prompt() + transcript
            response = self.model.generate_content(prompt)
            
            # Extract JSON from the response
            response_text = response.text.strip()
            
            # Try to find JSON in the response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                try:
                    parsed_response = json.loads(json_str)
                    return self._validate_response(parsed_response)
                except json.JSONDecodeError:
                    pass
            
            # Fallback: parse manually if JSON parsing fails
            return self._parse_fallback_response(response_text)
            
        except Exception as e:
            print(f"Error generating digest: {str(e)}")
            return {
                "overview": "Error processing transcript. Please try again.",
                "key_decisions": [],
                "action_items": []
            }

    def generate_digest_stream(self, transcript: str) -> Generator[str, None, None]:
        """Generate a digest with streaming response."""
        try:
            prompt = self.get_prompt() + transcript
            response = self.model.generate_content(prompt, stream=True)
            
            buffer = ""
            for chunk in response:
                if chunk.text:
                    buffer += chunk.text
                    # Split buffer into words and yield them one by one
                    words = buffer.split()
                    if len(words) > 1:
                        # Keep the last word in buffer (it might be incomplete)
                        complete_words = words[:-1]
                        buffer = words[-1]
                        
                        for word in complete_words:
                            yield word + " "
                    # If this is likely the end of a sentence or chunk, yield the buffer
                    elif chunk.text.endswith(('.', '!', '?', '\n', '}')) and buffer.strip():
                        yield buffer
                        buffer = ""
            
            # Yield any remaining content in buffer
            if buffer.strip():
                yield buffer
            
        except Exception as e:
            yield f"Error: {str(e)}"

    def _validate_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and clean the AI response."""
        return {
            "overview": response.get("overview", "No overview provided"),
            "key_decisions": response.get("key_decisions", []) if isinstance(response.get("key_decisions"), list) else [],
            "action_items": response.get("action_items", []) if isinstance(response.get("action_items"), list) else []
        }

    def _parse_fallback_response(self, response_text: str) -> Dict[str, Any]:
        """Fallback parser for when JSON parsing fails."""
        lines = response_text.split('\n')
        overview = ""
        key_decisions = []
        action_items = []
        
        current_section = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Try to identify sections
            if "overview" in line.lower() or "summary" in line.lower():
                current_section = "overview"
                # Extract overview from the same line if present
                if ":" in line:
                    overview = line.split(":", 1)[1].strip()
            elif "decision" in line.lower():
                current_section = "decisions"
            elif "action" in line.lower():
                current_section = "actions"
            elif line.startswith("-") or line.startswith("•") or line.startswith("*"):
                # This is a bullet point
                item = line[1:].strip()
                if current_section == "decisions":
                    key_decisions.append(item)
                elif current_section == "actions":
                    action_items.append(item)
            elif current_section == "overview" and not overview:
                overview = line
        
        return {
            "overview": overview or "Meeting summary not available",
            "key_decisions": key_decisions,
            "action_items": action_items
        }

# Initialize the service
gemini_service = GeminiService()
