import DOMPurify from 'dompurify';

/** Builds the sandboxed document shown in the preview frame. */
export function buildPreviewDocument(
  bodyHtml: string,
  css: string,
  head = '',
): string {
  const safeCss = DOMPurify.sanitize(css || '');
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
${head}
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<base href="${typeof window !== 'undefined' ? window.location.origin : ''}/" target="_self" />
<style>
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; width: 100%; min-height: 100%; overflow-x: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased; }
  img, video, iframe { max-width: 100%; height: auto; }

  /* Base Prose & Code Styling for Blog Posts */
  pre {
    background-color: #0f172a !important;
    color: #f8fafc !important;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace !important;
    font-size: 0.875rem !important;
    line-height: 1.65 !important;
    padding: 1.25rem 1.5rem !important;
    border-radius: 12px !important;
    overflow-x: auto !important;
    margin: 1.5rem 0 !important;
    border: 1px solid #1e293b !important;
  }
  pre code {
    background: transparent !important;
    color: inherit !important;
    padding: 0 !important;
    border: none !important;
    white-space: pre !important;
    font-size: inherit !important;
  }
  :not(pre) > code {
    background-color: #f1f5f9 !important;
    color: #0f172a !important;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace !important;
    font-size: 0.875em !important;
    padding: 0.2em 0.45em !important;
    border-radius: 6px !important;
    border: 1px solid #e2e8f0 !important;
    font-weight: 500 !important;
  }

  .cms-post-reader {
    background-color: transparent !important;
    border: none !important;
    box-shadow: none !important;
  }
  .cms-back-btn:hover {
    background-color: #e2e8f0 !important;
    transform: translateX(-2px);
  }

  @media (max-width: 768px) {
    .cms-dynamic-feed, [data-cms-repeat] { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)) !important; gap: 20px !important; }
    .gjs-row { flex-wrap: wrap !important; }
    .gjs-cell { width: 100% !important; max-width: 100% !important; }
    .cms-post-reader { padding: 24px 16px 48px !important; }
  }
  @media (max-width: 480px) {
    .cms-dynamic-feed, [data-cms-repeat] { grid-template-columns: 1fr !important; }
    section { padding-left: 16px !important; padding-right: 16px !important; }
  }
  ${safeCss}
</style>
</head>
<body>
${bodyHtml}
<script>
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    var card = e.target.closest(
      '.cms-dynamic-feed [data-cms-action="view-post"], [data-cms-repeat] [data-cms-action="view-post"], [data-cms-feed] [data-entry-slug], .cms-post-card, [data-entry-slug]'
    );
    if (a) {
      var action = a.getAttribute('data-cms-action');
      if (action === 'back-to-list') {
        e.preventDefault();
        window.parent.postMessage({ type: 'CMS_PREVIEW_NAVIGATE', href: '', action: 'back-to-list' }, '*');
        return;
      }
      var href = a.getAttribute('href') || '';
      if (href.charAt(0) === '#' && !action) return;
      e.preventDefault();
      window.parent.postMessage({
        type: 'CMS_PREVIEW_NAVIGATE',
        href: href,
        action: action,
        slug: a.getAttribute('data-entry-slug') || (card && card.getAttribute('data-entry-slug')) || null
      }, '*');
      return;
    }
    if (card) {
      var cardSlug = card.getAttribute('data-entry-slug');
      var cardHref = card.getAttribute('data-entry-href') || '';
      if (cardSlug || cardHref) {
        e.preventDefault();
        window.parent.postMessage({
          type: 'CMS_PREVIEW_NAVIGATE',
          href: cardHref,
          action: 'view-post',
          slug: cardSlug
        }, '*');
      }
    }
  });
  document.addEventListener('submit', function (e) {
    var form = e.target;
    // Nothing on a page may navigate the frame by submitting a form
    e.preventDefault();
    if (!form || !form.matches || !form.matches('form[data-cms-form]')) return;
    var fields = {};
    new FormData(form).forEach(function (v, k) { if (typeof v === 'string') fields[k] = v; });
    var btn = form.querySelector('[type="submit"], button:not([type])');
    if (btn) btn.disabled = true;
    window.parent.postMessage({ type: 'CMS_FORM_SUBMIT', form: form.getAttribute('data-cms-form'), fields: fields }, '*');
    form.__pending = true;
  });
  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || d.type !== 'CMS_FORM_RESULT') return;
    document.querySelectorAll('form[data-cms-form]').forEach(function (form) {
      if (!form.__pending) return;
      form.__pending = false;
      var btn = form.querySelector('[type="submit"], button:not([type])');
      if (btn) btn.disabled = false;
      var status = form.querySelector('[data-cms-form-status]');
      if (!status) {
        status = document.createElement('p');
        status.setAttribute('data-cms-form-status', '');
        status.style.cssText = 'margin:12px 0 0;font-size:14px';
        form.appendChild(status);
      }
      status.textContent = d.message || '';
      status.style.color = d.ok ? '#15803d' : '#b91c1c';
      if (d.ok) form.reset();
    });
  });
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t && t.matches && t.matches('select[data-cms-dropdown], [data-cms-selector]') && t.value) {
      window.parent.postMessage({ type: 'CMS_PREVIEW_SELECT', slug: t.value }, '*');
    }
  });
  document.querySelectorAll('[contenteditable]').forEach(function (el) { el.removeAttribute('contenteditable'); });
</script>
</body>
</html>`;
}
