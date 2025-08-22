export async function loadItemTemplates() {
  const url = new URL('../items.html', import.meta.url);
  const response = await fetch(url);
  const text = await response.text();
  const doc = new DOMParser().parseFromString(text, 'text/html');
  doc.querySelectorAll('template').forEach((tpl) => {
    document.body.appendChild(tpl);
  });
}

export function renderItemDemos(container = document.body) {
  const templates = document.querySelectorAll('template');
  templates.forEach((tpl) => {
    const fragment = tpl.content.cloneNode(true);
    container.appendChild(fragment);
  });
}
