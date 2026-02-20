import APIClient from './apiClient.js';
import ChatInterface from './chatInterface.js';

// Initialize API client and chat interface
const apiClient = new APIClient();
const chatInterface = new ChatInterface(apiClient);

// Get DOM elements
const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const customerIdSelect = document.getElementById('customerId');
const actionButtons = document.querySelectorAll('.action-btn');

// Handle chat form submission
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const message = messageInput.value.trim();
  const customerId = customerIdSelect.value;

  if (message) {
    await chatInterface.sendMessage(message, customerId);
  }
});

// Handle quick action buttons
actionButtons.forEach(button => {
  button.addEventListener('click', async () => {
    const action = button.dataset.action;
    const customerId = customerIdSelect.value;

    chatInterface.showLoading();

    try {
      let response;
      let message;

      switch (action) {
        case 'subscriptions':
          response = await apiClient.getSubscriptions(customerId);
          if (response.subscriptions.length === 0) {
            message = "You don't have any subscriptions yet.";
          } else {
            message = `You have ${response.subscriptions.length} subscription(s):\n\n` +
              response.subscriptions.map(s => 
                `📦 ${s.planName}\n` +
                `   Status: ${s.status}\n` +
                `   Price: $${s.amount}/${s.billingCycle}\n` +
                `   Next billing: ${new Date(s.nextBillingDate).toLocaleDateString()}`
              ).join('\n\n');
          }
          break;

        case 'billing':
          response = await apiClient.getBillingHistory(customerId);
          if (response.transactions.length === 0) {
            message = "You don't have any billing history yet.";
          } else {
            message = `Recent billing transactions:\n\n` +
              response.transactions.slice(0, 5).map(t => 
                `💳 ${new Date(t.date).toLocaleDateString()}\n` +
                `   Amount: $${t.amount}\n` +
                `   Status: ${t.status}\n` +
                `   ${t.description}`
              ).join('\n\n');
          }
          break;

        case 'recommendations':
          response = await apiClient.getRecommendations(customerId);
          if (response.recommendations.length === 0) {
            message = "No recommendations available at this time.";
          } else {
            message = `✨ Personalized Recommendations:\n\n` +
              response.recommendations.map(r => 
                `📊 ${r.planName}\n` +
                `   ${r.reasoning}\n` +
                `   💰 ${r.costImplication}\n` +
                `   Benefits: ${r.benefits.join(', ')}`
              ).join('\n\n');
          }
          break;
      }

      chatInterface.hideLoading();
      chatInterface.displayMessage(message, 'bot');

    } catch (error) {
      chatInterface.hideLoading();
      chatInterface.displayError(error.message);
    }
  });
});

// Handle customer change - clear conversation
customerIdSelect.addEventListener('change', () => {
  chatInterface.clearHistory();
  
  // Clear chat messages except welcome message
  const chatMessages = document.getElementById('chatMessages');
  const messages = chatMessages.querySelectorAll('.message');
  messages.forEach((msg, index) => {
    if (index > 0) { // Keep first welcome message
      msg.remove();
    }
  });
});

// Focus input on load
messageInput.focus();

console.log('Subscription Management Chatbot initialized');
