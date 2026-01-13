"""LLM client for local Llama 3.1 8B model."""
from typing import Optional, List, Dict
import requests
import json


class OllamaClient:
    """Client for interacting with Ollama (local LLM)."""
    
    def __init__(self, base_url: str = "http://localhost:11434", model: str = "llama3.1:8b"):
        """
        Initialize Ollama client.
        
        Args:
            base_url: Ollama API base URL
            model: Model name (default: llama3.1:8b)
        """
        self.base_url = base_url.rstrip('/')
        self.model = model
        self.api_url = f"{self.base_url}/api/generate"
    
    def generate(self, prompt: str, context: Optional[str] = None, **kwargs) -> str:
        """
        Generate text using the LLM.
        
        Args:
            prompt: User prompt
            context: Optional context to include in the prompt
            **kwargs: Additional parameters (temperature, top_p, etc.)
            
        Returns:
            Generated text response
        """
        # Build full prompt with context if provided
        if context:
            full_prompt = f"""Context:
{context}

Question: {prompt}

Answer based on the context above:"""
        else:
            full_prompt = prompt
        
        # Prepare request payload
        payload = {
            "model": self.model,
            "prompt": full_prompt,
            "stream": False,
            **kwargs
        }
        
        try:
            response = requests.post(
                self.api_url,
                json=payload,
                timeout=60  # Reduced to 1 minute timeout to prevent hanging
            )
            response.raise_for_status()
            
            result = response.json()
            response_text = result.get("response", "")
            
            # Safety check: prevent empty or extremely long responses
            if not response_text:
                return "No response generated from LLM."
            if len(response_text) > 10000:  # Limit response length
                response_text = response_text[:10000] + "... [truncated]"
            
            return response_text
        except requests.exceptions.Timeout:
            raise RuntimeError(
                f"Ollama request timed out after 60 seconds. "
                "The model may be too slow or overloaded."
            )
        except requests.exceptions.ConnectionError:
            raise ConnectionError(
                f"Could not connect to Ollama at {self.base_url}. "
                "Make sure Ollama is running and the model is installed. "
                "Install with: ollama pull llama3.1:8b"
            )
        except requests.exceptions.RequestException as e:
            raise RuntimeError(f"Error calling Ollama API: {str(e)}")
    
    def check_health(self) -> bool:
        """
        Check if Ollama is running and accessible.
        
        Returns:
            True if Ollama is accessible, False otherwise
        """
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def list_models(self) -> List[str]:
        """
        List available models in Ollama.
        
        Returns:
            List of model names
        """
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            response.raise_for_status()
            data = response.json()
            return [model["name"] for model in data.get("models", [])]
        except:
            return []

