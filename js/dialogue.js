class DialogueSystem {
  constructor() {
    this.container = document.getElementById('dialogue-container');
    this.box = document.getElementById('dialogue-box');
    this.content = document.getElementById('dialogue-content');
    this.choices = document.getElementById('dialogue-choices');
    this.templates = new Map();
    this.revealTimer = null;
    this.currentNode = null;
    document.addEventListener('keydown', e => {
      if (e.key === 'e' || e.key === 'E') {
        this.handleInteract();
      }
    });
  }

  start(root) {
    const startId = root.dataset.dialogStart;
    if (!startId) return;
    this.templates.clear();
    root.querySelectorAll('template').forEach(t => {
      this.templates.set(t.id, t);
    });
    this.container.style.display = 'block';
    this.renderNode(startId);
  }

  handleInteract() {
    if (!this.currentNode) return;
    if (this.revealing) {
      clearInterval(this.revealTimer);
      this.content.innerHTML = this.fullText;
      this.revealing = false;
      this.showChoices();
      return;
    }
    const next = this.currentNode.dataset.next;
    if (next) {
      this.renderNode(next);
    } else if (this.choices.children.length === 0) {
      this.close();
    }
  }

  renderNode(id) {
    const tpl = this.templates.get(id);
    if (!tpl) return;
    this.currentNode = tpl;
    this.box.className = tpl.dataset.style || '';
    const clone = tpl.content.cloneNode(true);
    this.content.innerHTML = '';
    this.choices.innerHTML = '';
    this.fullText = clone.querySelector('p') ? clone.querySelector('p').innerHTML : clone.textContent;
    const advance = tpl.dataset.advance || 'instant';
    this.revealText(this.fullText, advance);
    clone.querySelectorAll('.choice').forEach(choice => {
      choice.addEventListener('click', () => {
        this.renderNode(choice.dataset.next);
      });
      this.choices.appendChild(choice);
    });
    if (clone.querySelector('.choice')) {
      this.choices.style.display = 'none';
    } else {
      this.choices.style.display = 'block';
    }
  }

  revealText(text, mode) {
    this.revealing = true;
    this.content.innerHTML = '';
    if (mode === 'instant') {
      this.content.innerHTML = text;
      this.revealing = false;
      this.showChoices();
      return;
    }
    const parts = mode === 'word' ? text.split(/(\s+)/) : text.split('');
    let i = 0;
    this.revealTimer = setInterval(() => {
      this.content.innerHTML += parts[i];
      i++;
      if (i >= parts.length) {
        clearInterval(this.revealTimer);
        this.revealing = false;
        this.showChoices();
      }
    }, 50);
  }

  showChoices() {
    this.choices.style.display = 'block';
    if (this.choices.children.length === 0) {
      // no choices and no explicit next: close on interact
      this.currentNode.dataset.next = '';
    }
  }

  close() {
    this.container.style.display = 'none';
    this.currentNode = null;
  }
}

window.dialogue = new DialogueSystem();
export default window.dialogue;
