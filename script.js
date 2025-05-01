let authKey = 'c4d3f5da2388d568461efabda2ca21df';
let githubOwner = 'YOUR_GITHUB_USERNAME';
let githubRepo = 'YOUR_REPO_NAME';
let githubToken = 'YOUR_GITHUB_TOKEN';

const params = new URLSearchParams(window.location.search);
const giraffeId = params.get('GIRAFFEID');

let photos = [];
let selected = [];

document.getElementById('selectTab').addEventListener('click', () => switchTab('select'));
document.getElementById('orderTab').addEventListener('click', () => switchTab('order'));
document.getElementById('modalClose').addEventListener('click', () => {
  document.getElementById('modal').style.display = 'none';
});

function switchTab(tab) {
  document.getElementById('selectSection').classList.toggle('active', tab==='select');
  document.getElementById('orderSection').classList.toggle('active', tab==='order');
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('active', b.id===tab+'Tab'));
  if (tab==='order') renderOrder();
}

fetch(`https://api.giraffe360.com/api/v2/projects/${giraffeId}/`, {
  headers: { 'Authorization': `Token ${authKey}` }
})
  .then(r => r.json())
  .then(data => {
    photos = data.still_photos;
    loadSaved();
    renderGrid();
  });

function renderGrid() {
  const grid = document.getElementById('photoGrid');
  grid.innerHTML = '';
  photos.forEach(p => {
    const div = document.createElement('div');
    div.className = 'photo-item';
    const img = document.createElement('img');
    img.src = p.url;
    img.onclick = () => {
      document.getElementById('modalImg').src = p.url;
      document.getElementById('modal').style.display = 'flex';
    };
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = selected.includes(p.id);
    cb.onchange = () => {
      if (cb.checked) selected.push(p.id);
      else selected = selected.filter(id => id !== p.id);
      save();
    };
    div.append(cb, img);
    grid.append(div);
  });
}

function renderOrder() {
  const list = document.getElementById('orderList');
  list.innerHTML = '';
  selected.forEach(id => {
    const p = photos.find(x => x.id===id);
    const li = document.createElement('li');
    const img = document.createElement('img');
    img.src = p.url;
    li.append(img);
    list.append(li);
  });
  Sortable.create(list, {
    onEnd: () => {
      selected = Array.from(list.children).map(li => {
        const src = li.querySelector('img').src;
        return photos.find(p => p.url===src).id;
      });
      save();
    }
  });
}

function save() {
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(selected))));
  const path = `data/${giraffeId}.json`;
  fetch(`https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${path}`, {
    headers: { 'Authorization': `token ${githubToken}` }
  })
  .then(r => r.json())
  .then(res => {
    const sha = res.sha;
    return fetch(`https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Update giraffe ${giraffeId}`,
        content: content,
        sha: sha
      })
    });
  });
}

function loadSaved() {
  const path = `data/${giraffeId}.json`;
  fetch(`https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${path}`)
    .then(r => {
      if (!r.ok) return { content: null };
      return r.json();
    })
    .then(res => {
      if (res.content) {
        const data = decodeURIComponent(escape(atob(res.content)));
        selected = JSON.parse(data);
      }
      renderGrid();
    });
}
