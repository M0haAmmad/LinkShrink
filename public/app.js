document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('shorten-form');
  const longUrlInput = document.getElementById('long-url');
  const customCodeInput = document.getElementById('custom-code');
  const domainPrefix = document.getElementById('domain-prefix');
  const errorDiv = document.getElementById('error-message');
  const successDiv = document.getElementById('success-result');
  const resultUrlInput = document.getElementById('short-result-url');
  const copyResultBtn = document.getElementById('copy-result-btn');

  if (domainPrefix) {
    domainPrefix.textContent = window.location.host + '/';
  }

  function getBaseUrl() {
    return window.location.origin;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';

    const url = longUrlInput.value;
    const customCode = customCodeInput.value;

    fetch('/api/shorten', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url, customCode })
    })
      .then(res => {
        return res.json().then(data => {
          if (!res.ok) {
            throw new Error(data.error || 'Something went wrong');
          }
          return data;
        });
      })
      .then(data => {
        const fullShortUrl = `${getBaseUrl()}/${data.code}`;
        resultUrlInput.value = fullShortUrl;
        successDiv.style.display = 'flex';
        form.reset();
      })
      .catch(err => {
        errorDiv.textContent = err.message;
        errorDiv.style.display = 'block';
      });
  });

  copyResultBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(resultUrlInput.value).then(() => {
      copyResultBtn.textContent = 'Copied!';
      copyResultBtn.classList.add('copied');
      setTimeout(() => {
        copyResultBtn.textContent = 'Copy';
        copyResultBtn.classList.remove('copied');
      }, 1500);
    });
  });
});
