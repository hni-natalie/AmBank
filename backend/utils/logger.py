"""Enhanced logging utility with timestamps, input tracking, and version info."""
import logging
import json
from datetime import datetime
from typing import Dict, Any, Optional, List
from functools import wraps
from collections import deque


# Agent versions
AGENT_VERSIONS = {
    "macro_agent": "1.0.0",
    "sector_agent": "1.0.0",
    "bursa_agent": "1.0.0",
    "klse_sector_agent": "1.0.0",
    "volume_filter_agent": "1.0.0",
    "rsi_stochastic_agent": "1.0.0",
    "company_query_agent": "1.0.0",
    "principles_engine": "1.0.0",
}

# Algorithm/Model versions
ALGORITHM_VERSIONS = {
    "macro_agent": "naive_mock_v1.0",
    "sector_agent": "naive_mock_v1.0",
    "bursa_agent": "naive_mock_v1.0",
    "klse_sector_agent": "selenium_web_scraper_v1.0",
    "principles_engine": "rule_based_stub_v1.0",
    "volume_filter_agent": "web_scraper_v1.0",
    "rsi_stochastic_agent": "technical_indicator_analyzer_v1.0",
    "company_query_agent": "ollama_llm_rag_v1.0",
}

# In-memory log storage (circular buffer to prevent memory issues)
LOG_STORAGE = deque(maxlen=10000)  # Store up to 10,000 log entries


class AgentLogger:
    """Enhanced logger for agents with structured logging."""
    
    def __init__(self, agent_name: str, logger: Optional[logging.Logger] = None):
        """
        Initialize agent logger.
        
        Args:
            agent_name: Name of the agent
            logger: Optional existing logger instance
        """
        self.agent_name = agent_name
        self.logger = logger or logging.getLogger(f"agent.{agent_name}")
        self.agent_version = AGENT_VERSIONS.get(agent_name, "unknown")
        self.algorithm_version = ALGORITHM_VERSIONS.get(agent_name, "unknown")
    
    def _format_log_entry(self, level: str, message: str, input_data: Optional[Dict[str, Any]] = None, 
                         output_data: Optional[Dict[str, Any]] = None, **kwargs) -> Dict[str, Any]:
        """
        Format log entry with timestamp and metadata.
        
        Args:
            level: Log level (INFO, DEBUG, ERROR, etc.)
            message: Log message
            input_data: Input data reference
            output_data: Output data reference
            **kwargs: Additional metadata
            
        Returns:
            Formatted log entry dictionary
        """
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "agent_name": self.agent_name,
            "agent_version": self.agent_version,
            "algorithm_version": self.algorithm_version,
            "level": level,
            "message": message,
        }
        
        if input_data is not None:
            log_entry["input_data"] = input_data
        
        if output_data is not None:
            log_entry["output_data"] = output_data
        
        if kwargs:
            log_entry["metadata"] = kwargs
        
        return log_entry
    
    def _log(self, level: str, message: str, input_data: Optional[Dict[str, Any]] = None,
            output_data: Optional[Dict[str, Any]] = None, **kwargs):
        """Internal logging method."""
        log_entry = self._format_log_entry(level, message, input_data, output_data, **kwargs)
        
        # Store log entry in memory
        LOG_STORAGE.append(log_entry)
        
        # Log as JSON for structured logging
        log_message = json.dumps(log_entry, default=str)
        
        if level == "DEBUG":
            self.logger.debug(log_message)
        elif level == "INFO":
            self.logger.info(log_message)
        elif level == "WARNING":
            self.logger.warning(log_message)
        elif level == "ERROR":
            self.logger.error(log_message)
        elif level == "CRITICAL":
            self.logger.critical(log_message)
        else:
            self.logger.info(log_message)
        
        # Also print for console visibility (with timestamp)
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] [{self.agent_name} v{self.agent_version}] {message}")
    
    def info(self, message: str, input_data: Optional[Dict[str, Any]] = None,
            output_data: Optional[Dict[str, Any]] = None, **kwargs):
        """Log info message."""
        self._log("INFO", message, input_data, output_data, **kwargs)
    
    def debug(self, message: str, input_data: Optional[Dict[str, Any]] = None,
             output_data: Optional[Dict[str, Any]] = None, **kwargs):
        """Log debug message."""
        self._log("DEBUG", message, input_data, output_data, **kwargs)
    
    def warning(self, message: str, input_data: Optional[Dict[str, Any]] = None,
               output_data: Optional[Dict[str, Any]] = None, **kwargs):
        """Log warning message."""
        self._log("WARNING", message, input_data, output_data, **kwargs)
    
    def error(self, message: str, input_data: Optional[Dict[str, Any]] = None,
             output_data: Optional[Dict[str, Any]] = None, **kwargs):
        """Log error message."""
        self._log("ERROR", message, input_data, output_data, **kwargs)
    
    def log_agent_start(self, input_data: Dict[str, Any], **kwargs):
        """Log agent execution start."""
        self.info(
            f"Agent '{self.agent_name}' execution started",
            input_data=input_data,
            metadata={"algorithm": self.algorithm_version, **kwargs}
        )
    
    def log_agent_end(self, input_data: Dict[str, Any], output_data: Dict[str, Any], 
                     execution_time: Optional[float] = None, **kwargs):
        """Log agent execution end."""
        metadata = {"algorithm": self.algorithm_version}
        if execution_time is not None:
            metadata["execution_time_seconds"] = execution_time
        
        self.info(
            f"Agent '{self.agent_name}' execution completed",
            input_data=input_data,
            output_data=output_data,
            metadata={**metadata, **kwargs}
        )


def log_agent_execution(agent_name: str):
    """
    Decorator to automatically log agent execution with timestamps and data.
    
    Args:
        agent_name: Name of the agent
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            logger = AgentLogger(agent_name)
            start_time = datetime.utcnow()
            
            # Extract input data from args and kwargs
            input_data = {}
            if args:
                # Try to convert args to dict (assuming first arg is usually the input)
                if len(args) > 0:
                    if isinstance(args[0], dict):
                        input_data.update(args[0])
                    else:
                        input_data["args"] = str(args)
            if kwargs:
                input_data.update(kwargs)
            
            logger.log_agent_start(input_data)
            
            try:
                result = func(*args, **kwargs)
                
                # Extract output data
                output_data = {}
                if hasattr(result, 'dict'):
                    output_data = result.dict()
                elif hasattr(result, '__dict__'):
                    output_data = result.__dict__
                elif isinstance(result, dict):
                    output_data = result
                else:
                    output_data = {"result": str(result)}
                
                end_time = datetime.utcnow()
                execution_time = (end_time - start_time).total_seconds()
                
                logger.log_agent_end(input_data, output_data, execution_time)
                
                return result
            except Exception as e:
                end_time = datetime.utcnow()
                execution_time = (end_time - start_time).total_seconds()
                
                logger.error(
                    f"Agent '{agent_name}' execution failed: {str(e)}",
                    input_data=input_data,
                    metadata={"execution_time_seconds": execution_time, "error": str(e)}
                )
                raise
        
        return wrapper
    return decorator


def get_all_logs(agent_name: Optional[str] = None, level: Optional[str] = None, 
                 limit: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    Retrieve all stored log entries.
    
    Args:
        agent_name: Optional filter by agent name
        level: Optional filter by log level (INFO, DEBUG, WARNING, ERROR, CRITICAL)
        limit: Optional limit on number of logs to return (most recent first)
        
    Returns:
        List of log entries
    """
    logs = list(LOG_STORAGE)
    
    # Apply filters
    if agent_name:
        logs = [log for log in logs if log.get("agent_name") == agent_name]
    
    if level:
        logs = [log for log in logs if log.get("level") == level.upper()]
    
    # Reverse to get most recent first
    logs.reverse()
    
    # Apply limit
    if limit:
        logs = logs[:limit]
    
    return logs


def clear_logs():
    """Clear all stored logs."""
    LOG_STORAGE.clear()
