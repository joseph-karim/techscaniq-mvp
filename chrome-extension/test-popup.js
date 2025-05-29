console.log('Popup script loading...');

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded');
  
  const testBtn = document.getElementById('testBtn');
  const statusDiv = document.getElementById('status');
  
  console.log('testBtn:', testBtn);
  console.log('statusDiv:', statusDiv);
  
  testBtn.addEventListener('click', async () => {
    console.log('Button clicked!');
    statusDiv.textContent = 'Button was clicked!';
    
    try {
      // Test tab access
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('Current tab:', tab);
      statusDiv.textContent = `Tab: ${tab.url}`;
      
      // Test simple script injection
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          console.log('Script injected successfully!');
          alert('TechScan: Script injection working!');
          return window.location.href;
        }
      });
      
      statusDiv.textContent = 'Script injection successful!';
      
    } catch (error) {
      console.error('Error:', error);
      statusDiv.textContent = 'Error: ' + error.message;
    }
  });
  
  console.log('Event listener attached');
});