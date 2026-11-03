import type { Editor } from 'grapesjs';

export function setupBlockA11y(editor: Editor) {
  const updateBlocksAccessibility = () => {
    const blocksContainer = document.getElementById('gjs-blocks');
    if (!blocksContainer) return;

    const blockEls =
      blocksContainer.querySelectorAll<HTMLElement>('.gjs-block');
    blockEls.forEach((el, index) => {
      if (!el.hasAttribute('tabindex')) {
        el.setAttribute('tabindex', '0');
      }
      if (!el.hasAttribute('role')) {
        el.setAttribute('role', 'button');
      }

      const label =
        el.querySelector('.gjs-block-label')?.textContent?.trim() ||
        el.getAttribute('title') ||
        `Canvas block ${index + 1}`;

      if (!el.hasAttribute('aria-label')) {
        el.setAttribute('aria-label', `Insert ${label}`);
      }

      if (el.dataset.a11yBound) return;
      el.dataset.a11yBound = 'true';

      el.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const blockId = el.getAttribute('data-id') || el.id;
          const block = editor.BlockManager?.get(blockId);
          if (block) {
            const content =
              typeof block.getContent === 'function'
                ? block.getContent()
                : block.get?.('content');
            if (content) {
              editor.addComponents(content);
            }
          }
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          const all = Array.from(
            blocksContainer.querySelectorAll<HTMLElement>('.gjs-block'),
          );
          const idx = all.indexOf(el);
          if (idx >= 0 && idx < all.length - 1) {
            all[idx + 1]?.focus();
          }
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          const all = Array.from(
            blocksContainer.querySelectorAll<HTMLElement>('.gjs-block'),
          );
          const idx = all.indexOf(el);
          if (idx > 0) {
            all[idx - 1]?.focus();
          }
        }
      });
    });
  };

  editor.on('load', () => {
    setTimeout(() => {
      const blocksContainer = document.getElementById('gjs-blocks');
      if (!blocksContainer) return;

      updateBlocksAccessibility();

      const observer = new MutationObserver(() => {
        requestAnimationFrame(() => {
          updateBlocksAccessibility();
        });
      });

      observer.observe(blocksContainer, {
        childList: true,
        subtree: true,
      });

      editor.on('block:add block:remove block:custom', () => {
        setTimeout(updateBlocksAccessibility, 50);
      });
    }, 200);
  });
}
