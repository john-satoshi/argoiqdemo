const form = document.getElementById('loginForm');
const loginButton = document.getElementById('loginButton');
const tabLogin = document.getElementById('tabLogin');
const tabCreate = document.getElementById('tabCreate');

function setActiveTab(mode) {
  const isLogin = mode === 'login';
  tabLogin.classList.toggle('is-active', isLogin);
  tabCreate.classList.toggle('is-active', !isLogin);
  tabLogin.setAttribute('aria-selected', isLogin ? 'true' : 'false');
  tabCreate.setAttribute('aria-selected', isLogin ? 'false' : 'true');
  loginButton.textContent = isLogin ? 'Login' : 'Create Account';
}

tabLogin.addEventListener('click', () => setActiveTab('login'));
tabCreate.addEventListener('click', () => setActiveTab('create'));

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const originalLabel = loginButton.textContent;
  loginButton.disabled = true;
  loginButton.textContent = 'Please wait...';

  window.setTimeout(() => {
    loginButton.disabled = false;
    loginButton.textContent = originalLabel;
  }, 900);
});
