---
layout: page
title: Portfolio
# title: Holdings
---

<div id="password-prompt" style="text-align: center; padding: 50px;">
  <h2>Protected Content</h2>
  <p>Please enter the password to access this page:</p>
  <input type="password" id="password-input" placeholder="Enter password" style="padding: 10px; margin: 10px; border: 1px solid #ccc; border-radius: 4px;">
  <br>
  <button onclick="checkPassword()" style="padding: 10px 20px; margin: 10px; background-color: #007cba; color: white; border: none; border-radius: 4px; cursor: pointer;">Submit</button>
  <p id="error-message" style="color: red; display: none;">Incorrect password. Please try again.</p>
</div>

<div id="protected-content" style="display: none;">
  <h2>My Holdings</h2>

  <p>This page contains information about my stock portfolio, not project portfolio. <em>This page is for personal use.</em></p>

  <table>
    <thead>
      <tr>
        <th style="text-align: center;">#</th>
        <th>Ticker</th>
        <th style="text-align: center;">Company</th>
        <th style="text-align: right;">Weight</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="text-align: center;">1</td>
        <td>TSLA</td>
        <td style="text-align: center;">Tesla, Inc.</td>
        <td style="text-align: right;">12.56%</td>
      </tr>
      <tr>
        <td style="text-align: center;">2</td>
        <td>ROKU</td>
        <td style="text-align: center;">Roku, Inc.</td>
        <td style="text-align: right;">6.07%</td>
      </tr>
    </tbody>
  </table>
</div>

<script>
function checkPassword() {
  const input = document.getElementById('password-input');
  const errorMessage = document.getElementById('error-message');
  const passwordPrompt = document.getElementById('password-prompt');
  const protectedContent = document.getElementById('protected-content');

  if (input.value === '051110') {
    passwordPrompt.style.display = 'none';
    protectedContent.style.display = 'block';
    // Store in session storage so user doesn't need to re-enter during session
    sessionStorage.setItem('portfolioAccess', 'granted');
  } else {
    errorMessage.style.display = 'block';
    input.value = '';
    input.focus();
  }
}

// Check if user already entered correct password in this session
document.addEventListener('DOMContentLoaded', function() {
  if (sessionStorage.getItem('portfolioAccess') === 'granted') {
    document.getElementById('password-prompt').style.display = 'none';
    document.getElementById('protected-content').style.display = 'block';
  }
});

// Allow Enter key to submit password
document.getElementById('password-input').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    checkPassword();
  }
});
</script>
