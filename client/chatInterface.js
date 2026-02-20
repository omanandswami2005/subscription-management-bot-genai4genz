/**
 * ChatInterface manages the chat UI and user interactions
 */
class ChatInterface {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.conversationHistory = [];
    this.chatMessages = document.getElementById('chatMessages');
    this.messageInput = document.getElementById('messageInput');
    this.loadingIndicator = document.getElementById('loadingIndicator');
  }

  /**
   * Display a message in the chat window
   * @param {string} message - Message text
   * @param {string} sender - 'user' or 'bot'
   */
  displayMessage(message, sender = 'bot') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    // Convert newlines to <br> and preserve formatting
    const formattedMessage = message.replace(/\n/g, '<br>');
    contentDiv.innerHTML = formattedMessage;

    messageDiv.appendChild(contentDiv);
    this.chatMessages.appendChild(messageDiv);

    // Scroll to bottom
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

    // Add to conversation history
    this.conversationHistory.push({
      role: sender === 'user' ? 'user' : 'assistant',
      content: message
    });
  }

  /**
   * Send user message to server
   * @param {string} messageText - User's message
   * @param {string} customerId - Customer ID
   */
  async sendMessage(messageText, customerId) {
    if (!messageText.trim()) {
      return;
    }

    // Display user message
    this.displayMessage(messageText, 'user');

    // Clear input
    this.messageInput.value = '';

    // Show typing indicator
    this.showTypingIndicator();

    try {
      // Send to server
      const response = await this.apiClient.sendChatMessage(
        customerId,
        messageText,
        this.conversationHistory
      );

      // Hide typing indicator
      this.hideTypingIndicator();

      // Handle response
      this.handleResponse(response);

    } catch (error) {
      this.hideTypingIndicator();
      this.displayError(error.message);
    }
  }

  /**
   * Handle incoming response from server
   * @param {Object} response - Server response
   */
  handleResponse(response) {
    if (response.response) {
      this.displayMessage(response.response, 'bot');
    }

    // Handle specific actions if needed
    if (response.action && response.action !== 'none') {
      console.log('Action performed:', response.action, response.data);
    }
  }

  /**
   * Display error message
   * @param {string} errorMessage - Error message to display
   */
  displayError(errorMessage) {
    const errorToast = document.getElementById('errorToast');
    errorToast.textContent = errorMessage;
    errorToast.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorToast.style.display = 'none';
    }, 5000);

    // Also display in chat
    this.displayMessage(`Error: ${errorMessage}`, 'bot');
  }

  /**
   * Show typing indicator
   */
  showTypingIndicator() {
    // Create typing indicator element
    this.typingIndicator = document.createElement('div');
    this.typingIndicator.className = 'message bot-message typing-indicator-message';
    this.typingIndicator.innerHTML = `
      <div class="message-content">
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;
    
    this.chatMessages.appendChild(this.typingIndicator);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    
    // Disable input
    this.messageInput.disabled = true;
  }

  /**
   * Hide typing indicator
   */
  hideTypingIndicator() {
    if (this.typingIndicator) {
      this.typingIndicator.remove();
      this.typingIndicator = null;
    }
    
    // Enable input
    this.messageInput.disabled = false;
    this.messageInput.focus();
  }

  /**
   * Show loading indicator (for quick actions)
   */
  showLoading() {
    this.loadingIndicator.style.display = 'block';
    this.messageInput.disabled = true;
  }

  /**
   * Hide loading indicator (for quick actions)
   */
  hideLoading() {
    this.loadingIndicator.style.display = 'none';
    this.messageInput.disabled = false;
    this.messageInput.focus();
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
  }
}

export default ChatInterface;
