"""
Authentication utilities for Verteil API

This module handles OAuth2 authentication with the Verteil API, including token
management and request authentication.
"""
import base64
import logging
import requests
import threading
import time
import os
from flask import current_app
from typing import Dict, Optional, Any

# Configure logging
logger = logging.getLogger(__name__)

class AuthError(Exception):
    """Custom exception for authentication errors"""
    pass

def get_basic_auth_token(config: Dict[str, str]) -> str:
    """
    Generate Basic Auth token for Verteil API
    
    Args:
        config: Configuration dictionary containing VERTEIL_USERNAME and VERTEIL_PASSWORD
        
    Returns:
        str: Base64 encoded Basic Auth token
        
    Raises:
        AuthError: If required configuration is missing
    """
    if not config or 'VERTEIL_USERNAME' not in config or 'VERTEIL_PASSWORD' not in config:
        raise AuthError("Missing VERTEIL_USERNAME or VERTEIL_PASSWORD in config")
        
    credentials = f"{config['VERTEIL_USERNAME']}:{config['VERTEIL_PASSWORD']}"
    return base64.b64encode(credentials.encode()).decode()

def get_oauth_token(config: Dict[str, str]) -> Dict[str, Any]:
    """
    Get access token from Verteil API using Basic Authentication
    
    Args:
        config: Configuration dictionary containing required settings.
               Must include VERTEIL_API_BASE_URL, VERTEIL_TOKEN_ENDPOINT,
               VERTEIL_USERNAME, and VERTEIL_PASSWORD.
        
    Returns:
        Dict containing access token and token metadata
        
    Raises:
        AuthError: If authentication fails or required config is missing
    """
    logger.info("Starting authentication request...")
    
    # Validate required configuration
    required = ['VERTEIL_API_BASE_URL', 'VERTEIL_TOKEN_ENDPOINT', 
               'VERTEIL_USERNAME', 'VERTEIL_PASSWORD']
    missing = [key for key in required if not config.get(key)]
    if missing:
        error_msg = f"Missing required configuration: {', '.join(missing)}"
        logger.error(error_msg)
        raise AuthError(error_msg)
    
    token_url = f"{config['VERTEIL_API_BASE_URL'].rstrip('/')}{config['VERTEIL_TOKEN_ENDPOINT']}"
    logger.info(f"Requesting authentication from: {token_url}")
    
    # Prepare the request with Basic Auth and required headers
    auth = (config['VERTEIL_USERNAME'], config['VERTEIL_PASSWORD'])
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    
    # The request body for authentication
    payload = {
        'username': config['VERTEIL_USERNAME'],
        'password': config['VERTEIL_PASSWORD']
    }
    
    try:
        logger.info("Generating Basic Auth token...")
        basic_auth_token = get_basic_auth_token(config)
        logger.debug("Basic Auth token generated successfully")
        
        # Prepare headers for the token request
        headers = {
            'Authorization': f'Basic {basic_auth_token}',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        
        # Log the request details (without sensitive data)
        logger.debug(f"Making token request to: {token_url}")
        logger.debug(f"Request headers: { {k: v if k != 'Authorization' else 'Basic [REDACTED]' for k, v in headers.items()} }")
        
        # Make the token request
        response = requests.post(
            token_url,
            headers=headers,
            data={'grant_type': 'client_credentials'},
            timeout=30
        )
        
        # Log response status and headers
        logger.info(f"Token request response status: {response.status_code}")
        logger.debug(f"Response headers: {dict(response.headers)}")
        
        # Check for HTTP errors
        try:
            response.raise_for_status()
        except requests.exceptions.HTTPError as http_err:
            error_msg = f"HTTP error occurred: {http_err}"
            if response.text:
                error_msg += f" - Response: {response.text}"
            logger.error(error_msg)
            raise AuthError(f"Failed to obtain token: {http_err}. Response: {response.text}")
        
        # Parse the response
        try:
            token_data = response.json()
            logger.debug(f"Token response: { {k: v if k != 'access_token' else '[REDACTED]' for k, v in token_data.items()} }")
        except ValueError as json_err:
            error_msg = f"Failed to parse JSON response: {response.text}"
            logger.error(error_msg)
            raise AuthError(f"Invalid token response: {error_msg}")
        
        # Validate required fields in response
        required_fields = ['access_token', 'token_type', 'expires_in']
        missing_fields = [field for field in required_fields if field not in token_data]
        if missing_fields:
            error_msg = f"Missing required fields in token response: {', '.join(missing_fields)}"
            logger.error(f"{error_msg}. Full response: {token_data}")
            raise AuthError(f"Invalid token response: {error_msg}")
            
        logger.info("Successfully obtained OAuth2 token")
        return {
            'access_token': token_data['access_token'],
            'token_type': token_data['token_type'],
            'expires_in': int(token_data['expires_in']),
            'scope': token_data.get('scope', '')
        }
            
    except (ValueError, KeyError) as e:
        logger.error(f"Invalid token response format: {response.text}")
        raise AuthError("Invalid token response format from authentication server") from e
        
    except requests.exceptions.RequestException as e:
        error_msg = f"Failed to get OAuth token: {str(e)}"
        if hasattr(e, 'response') and e.response is not None:
            error_msg += f" - {e.response.text}"
        raise AuthError(error_msg) from e
    except (KeyError, ValueError) as e:
        raise AuthError(f"Invalid token response: {str(e)}") from e

class TokenManager:
    """
    Manages OAuth2 token lifecycle including caching and automatic renewal.
    
    Implements the singleton pattern to ensure only one token manager exists.
    Tokens are cached in memory and reused until they expire.
    """
    _instance = None
    _token = None
    _token_data = None
    _token_expiry = 0
    _config = None
    _lock = threading.RLock()  # Using RLock for reentrant lock
    _is_refreshing = False
    _last_refresh_attempt = 0
    REFRESH_COOLDOWN = 5  # seconds
    
    # Metrics
    _metrics = {
        'token_generations': 0,
        'token_refreshes': 0,
        'concurrent_refresh_attempts': 0,
        'last_token_generation_time': 0,
        'last_token_refresh_time': 0,
        'concurrent_refresh_peaks': 0,
        'total_token_requests': 0
    }

    def __new__(cls):
        if cls._instance is None:
            with threading.Lock():
                if cls._instance is None:  # Double-checked locking pattern
                    cls._instance = super(TokenManager, cls).__new__(cls)
                    cls._instance._metrics_lock = threading.Lock()
                    logger.info("Initialized new TokenManager instance")
        return cls._instance
        
    def _increment_metric(self, metric_name: str, amount: int = 1) -> None:
        """Thread-safe metric increment"""
        with self._metrics_lock:
            if metric_name in self._metrics:
                self._metrics[metric_name] += amount
            else:
                self._metrics[metric_name] = amount
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get a copy of current metrics"""
        with self._metrics_lock:
            return self._metrics.copy()
    
    def clear_metrics(self) -> None:
        """Reset all metrics"""
        with self._metrics_lock:
            self._metrics = {
                'token_generations': 0,
                'token_refreshes': 0,
                'concurrent_refresh_attempts': 0,
                'last_token_generation_time': self._metrics.get('last_token_generation_time', 0),
                'last_token_refresh_time': self._metrics.get('last_token_refresh_time', 0),
                'concurrent_refresh_peaks': self._metrics.get('concurrent_refresh_peaks', 0),
                'total_token_requests': self._metrics.get('total_token_requests', 0)
            }
    
    @classmethod
    def get_instance(cls) -> 'TokenManager':
        """Get the singleton instance of TokenManager."""
        return cls()
        
    def set_config(self, config: Dict[str, Any]):
        """
        Set the configuration for the token manager.
        
        Args:
            config: Dictionary containing configuration values
        """
        if not config:
            return
            
        with self._lock:
            if self._config is None:
                self._config = {}
            self._config.update(config)
            logger.debug(f"Updated TokenManager config: {', '.join(config.keys())}")

    def _get_effective_config(self, config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Determine which configuration to use.
        
        Args:
            config: Optional config to use, falls back to instance config or env vars
            
        Returns:
            Dict containing the effective configuration
        """
        effective_config = {}
        
        # Priority 1: Use provided config
        if config is not None:
            effective_config.update(config)
        # Priority 2: Use instance config
        elif self._config is not None:
            effective_config.update(self._config)
            
        # Priority 3: Try to get from current_app if available
        try:
            from flask import current_app
            if current_app:
                app_config = {
                    'VERTEIL_API_BASE_URL': current_app.config.get('VERTEIL_API_BASE_URL'),
                    'VERTEIL_TOKEN_ENDPOINT': current_app.config.get('VERTEIL_TOKEN_ENDPOINT', '/oauth2/token'),
                    'VERTEIL_USERNAME': current_app.config.get('VERTEIL_USERNAME'),
                    'VERTEIL_PASSWORD': current_app.config.get('VERTEIL_PASSWORD'),
                    'VERTEIL_THIRD_PARTY_ID': current_app.config.get('VERTEIL_THIRD_PARTY_ID'),
                    'VERTEIL_OFFICE_ID': current_app.config.get('VERTEIL_OFFICE_ID'),
                    'OAUTH2_TOKEN_EXPIRY_BUFFER': current_app.config.get('OAUTH2_TOKEN_EXPIRY_BUFFER', 300)
                }
                effective_config.update({k: v for k, v in app_config.items() if v is not None})
        except (RuntimeError, ImportError):
            # Not in an app context or Flask not available
            pass
            
        # Priority 4: Fall back to environment variables
        env_config = {
            'VERTEIL_API_BASE_URL': os.environ.get('VERTEIL_API_BASE_URL'),
            'VERTEIL_TOKEN_ENDPOINT': os.environ.get('VERTEIL_TOKEN_ENDPOINT', '/oauth2/token'),
            'VERTEIL_USERNAME': os.environ.get('VERTEIL_USERNAME'),
            'VERTEIL_PASSWORD': os.environ.get('VERTEIL_PASSWORD'),
            'VERTEIL_THIRD_PARTY_ID': os.environ.get('VERTEIL_THIRD_PARTY_ID'),
            'VERTEIL_OFFICE_ID': os.environ.get('VERTEIL_OFFICE_ID'),
            'OAUTH2_TOKEN_EXPIRY_BUFFER': int(os.environ.get('OAUTH2_TOKEN_EXPIRY_BUFFER', '300'))
        }
        effective_config.update({k: v for k, v in env_config.items() if v is not None})
        
        return effective_config

    def _is_token_valid(self, buffer_seconds: int = 300) -> bool:
        """
        Check if the current token is still valid.
        
        Args:
            buffer_seconds: Number of seconds before expiry to consider token invalid.
                          If the token will expire within this many seconds, it's considered invalid.
            
        Returns:
            bool: True if token is valid, False otherwise
        """
        try:
            current_time = int(time.time())
            
            # Debug logging
            logger.debug(f"\n=== Token Validation Check ===")
            logger.debug(f"Current time: {current_time} ({time.ctime(current_time)})")
            logger.debug(f"Token exists: {bool(self._token)}")
            logger.debug(f"Token expiry: {self._token_expiry} ({time.ctime(self._token_expiry) if self._token_expiry else 'N/A'})")
            
            # Check if token exists
            if not self._token:
                logger.debug("No token available")
                return False
                
            # Check if token has an expiry time
            if not self._token_expiry:
                logger.debug("No token expiry set")
                return False
            
            # Calculate time until expiry
            time_until_expiry = self._token_expiry - current_time
            
            # Token is valid if it hasn't expired yet
            is_valid = time_until_expiry > 0
            
            # Apply buffer - if the token will expire within the buffer period, consider it invalid
            if is_valid and buffer_seconds > 0:
                is_valid = time_until_expiry > buffer_seconds
            
            # Log detailed validation info
            if is_valid:
                logger.debug(f"[VALID] Token is valid for {time_until_expiry} more seconds (expires at {time.ctime(self._token_expiry)})")
                if buffer_seconds > 0:
                    logger.debug(f"[VALID] Token will be considered valid until {time.ctime(self._token_expiry - buffer_seconds)} (with {buffer_seconds}s buffer)")
            else:
                if time_until_expiry <= 0:
                    logger.debug(f"[INVALID] Token expired {abs(time_until_expiry)} seconds ago")
                else:
                    logger.debug(f"[INVALID] Token will expire in {time_until_expiry} seconds (buffer: {buffer_seconds}s)")
            
            logger.debug("=" * 40 + "\n")
            return is_valid
            
        except Exception as e:
            logger.error(f"Error in _is_token_valid: {str(e)}", exc_info=True)
            return False

    def get_token(self, config: Optional[Dict[str, Any]] = None) -> str:
        """
        Get a valid OAuth2 token, reusing cached token if still valid.
        
        Args:
            config: Optional configuration dictionary. If not provided, uses the one set via set_config
                   or falls back to current_app.config or environment variables.
            
        Returns:
            str: Valid access token in 'Bearer <token>' format
            
        Raises:
            AuthError: If token cannot be obtained
        """
        try:
            self._increment_metric('total_token_requests')
            
            # Get effective config first to ensure we have all required settings
            effective_config = self._get_effective_config(config)
            
            # Update instance config if not set
            if not self._config:
                with self._lock:
                    if not self._config:  # Double-checked locking
                        self._config = effective_config
                        logger.info("Updated TokenManager config")
            
            # Fast path: token is valid
            if self._is_token_valid():
                logger.debug("Using cached token")
                return self._token
            
            # Token needs refresh, acquire lock
            with self._lock:
                # Double-check after acquiring lock
                if self._is_token_valid():
                    return self._token
                    
                # Check if another thread is already refreshing
                if self._is_refreshing:
                    self._increment_metric('concurrent_refresh_attempts')
                    logger.warning("Concurrent token refresh detected, waiting for refresh to complete...")
                    
                    # Wait for refresh to complete with timeout
                    timeout = time.time() + 30  # 30 second timeout
                    while time.time() < timeout:
                        if not self._is_refreshing:
                            if self._is_token_valid():
                                return self._token
                            break
                        time.sleep(0.1)
                    else:
                        raise AuthError("Timeout waiting for token refresh")
                    
                    # After waiting, check one more time
                    if self._is_token_valid():
                        return self._token
                    
                    # If we get here, the refresh failed, so we'll try to get a new token
                    logger.warning("Previous refresh failed, attempting new token request...")
                
                # Mark that we're refreshing
                self._is_refreshing = True
                self._increment_metric('token_generations')
                self._metrics['last_token_generation_time'] = time.time()
                
                try:
                    logger.info("Requesting new OAuth token...")
                    logger.debug(f"Using config: { {k: v for k, v in effective_config.items() if 'PASS' not in k} }")
                    
                    # Get the token data
                    self._token_data = get_oauth_token(effective_config)
                    
                    if not self._token_data or 'access_token' not in self._token_data:
                        error_msg = f"Invalid token response: {self._token_data}"
                        logger.error(error_msg)
                        raise AuthError(f"Invalid token response: missing access_token")
                    
                    # Get expires_in with a fallback to 12 hours if not provided
                    expires_in = int(self._token_data.get('expires_in', 43200))
                    current_time = int(time.time())
                    
                    # Calculate the actual expiry time (when the token will actually expire)
                    self._token_expiry = current_time + expires_in
                    
                    # Format the token for Authorization header
                    token_type = self._token_data.get('token_type', 'Bearer')
                    access_token = self._token_data['access_token']
                    self._token = f"{token_type} {access_token}"
                    
                    # Get buffer from config or use default (300s / 5 minutes)
                    buffer_seconds = int(effective_config.get('OAUTH2_TOKEN_EXPIRY_BUFFER', 300))
                    
                    # Log all the important details
                    logger.debug("=== Token Details ===")
                    logger.debug(f"Current time:       {current_time} ({time.ctime(current_time)})")
                    logger.debug(f"Token expires in:    {expires_in} seconds")
                    logger.debug(f"Token expiry time:   {self._token_expiry} ({time.ctime(self._token_expiry)})")
                    logger.debug(f"Using buffer:       {buffer_seconds} seconds")
                    logger.debug(f"Valid until:        {time.ctime(self._token_expiry - buffer_seconds)} (with buffer)")
                    logger.debug(f"Token type:         {token_type}")
                    logger.debug(f"Token preview:      {self._token[:20]}...")
                    logger.debug("====================")
                    
                    # Update metrics
                    self._increment_metric('token_refreshes')
                    self._metrics['last_token_refresh_time'] = current_time
                    
                    logger.info(f"Successfully obtained new token, expires in {expires_in} seconds")
                    logger.info(f"Token will be considered valid until {time.ctime(self._token_expiry - buffer_seconds)} (with {buffer_seconds}s buffer)")
                    
                    # Verify the token is valid with the current buffer
                    if not self._is_token_valid(buffer_seconds):
                        logger.warning("Newly obtained token is already expired or will expire soon!")
                    
                    return self._token
                    
                except Exception as e:
                    # Clear any partial state on error
                    self._token = None
                    self._token_data = None
                    self._token_expiry = 0
                    logger.error(f"Failed to obtain OAuth2 token: {str(e)}", exc_info=True)
                    raise AuthError(f"Failed to obtain access token: {str(e)}") from e
                    
                finally:
                    self._is_refreshing = False
                    
        except Exception as e:
            logger.error(f"Unexpected error in get_token: {str(e)}", exc_info=True)
            raise
        
    def get_token_info(self) -> Dict[str, Any]:
        """
        Get information about the current token.
        
        Returns:
            Dict containing token information including expiry time
        """
        current_time = int(time.time())
        expires_in = max(0, self._token_expiry - current_time) if self._token_expiry else 0
        
        return {
            'has_token': bool(self._token),
            'expires_in_seconds': expires_in,
            'expires_at': self._token_expiry,
            'expires_at_human': time.ctime(self._token_expiry) if self._token_expiry else 'N/A'
        }
        
    def clear_token(self) -> None:
        """
        Clear the current token, forcing a refresh on next request.
        Useful for handling 401 Unauthorized responses.
        """
        with self._lock:
            self._token = None
            self._token_data = None
            self._token_expiry = 0
            self._is_refreshing = False
            logger.debug("Token cache cleared")
