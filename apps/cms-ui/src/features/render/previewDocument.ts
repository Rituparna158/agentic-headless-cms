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
<base target="_self" />
<style>
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; width: 100%; min-height: 100%; overflow-x: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased; }
  img, video, iframe { max-width: 100%; height: auto; }
  @media (max-width: 768px) {
    .cms-dynamic-feed, [data-cms-repeat] { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)) !important; gap: 20px !important; }
    .gjs-row { flex-wrap: wrap !important; }
    .gjs-cell { width: 100% !important; max-width: 100% !important; }
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
      '.cms-dynamic-feed [data-cms-action="view-post"], [data-cms-repeat] [data-cms-action="view-post"], [data-cms-feed] [data-entry-slug]'
    );
    if (!a && card) {
      e.preventDefault();
      window.parent.postMessage({ type: 'CMS_PREVIEW_NAVIGATE', href: card.getAttribute('data-entry-href') || '', action: 'view-post', slug: card.getAttribute('data-entry-slug') }, '*');
      return;
    }
    if (a) {
      var href = a.getAttribute('href') || '';
      if (href.charAt(0) === '#') return;
      e.preventDefault();
      window.parent.postMessage({
        type: 'CMS_PREVIEW_NAVIGATE',
        href: href,
        action: a.getAttribute('data-cms-action'),
        slug: a.getAttribute('data-entry-slug') || (card && card.getAttribute('data-entry-slug')) || null
      }, '*');
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
