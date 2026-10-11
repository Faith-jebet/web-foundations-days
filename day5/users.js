const API_URL = 'https://jsonplaceholder.typicode.com/users';

const loadButton = document.querySelector('#load-users');
const filterInput = document.querySelector('#filter-input');
const statusText = document.querySelector('#status');
const usersList = document.querySelector('#users-list');

let allUsers = [];

async function loadUsers() {
  statusText.textContent = 'Loading users...';
  loadButton.disabled = true;

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    allUsers = await response.json();
    renderUsers(allUsers);
    statusText.textContent = `Loaded ${allUsers.length} users.`;
  } catch (error) {
    statusText.textContent = 'Could not load users. Please try again.';
    console.error(error);
  } finally {
    loadButton.disabled = false;
  }
}

function renderUsers(list) {
  usersList.textContent = '';

  if (list.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = 'No users match your filter.';
    usersList.appendChild(empty);
    return;
  }

  list.forEach((user) => {
    const li = document.createElement('li');

    const name = document.createElement('strong');
    name.textContent = user.name;

    const details = document.createElement('div');
    details.textContent = `${user.email} | ${user.address.city} | ${user.company.name}`;

    li.append(name, details);
    usersList.appendChild(li);
  });
}

function filterUsers() {
  if (allUsers.length === 0) {
    return;
  }

  const term = filterInput.value.trim().toLowerCase();
  const matches = allUsers.filter((user) =>
    user.name.toLowerCase().includes(term)
  );

  renderUsers(matches);
}

loadButton.addEventListener('click', loadUsers);
filterInput.addEventListener('input', filterUsers);