import { useState, useEffect, Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { collectionsApi } from '../api/collections.api';

const CustomBuilderPreview = lazy(
  () => import('../components/CustomBuilderPreview'),
);
import DOMPurify from 'dompurify';
import { usePageBuilderStore } from '../components/page-builder/stores/pageBuilderStore';

export function PagePreviewPage() {
  const { schemaSlug, slug } = useParams<{
    schemaSlug: string;
    slug: string;
  }>();
  const navigate = useNavigate();

  const pageQuery = useQuery({
    queryKey: ['pageBySlug', schemaSlug, slug],
    queryFn: () => collectionsApi.getPageBySlug(schemaSlug!, slug!),
    enabled: !!schemaSlug && !!slug,
  });

  (window as { __IS_CMS_PREVIEW__?: boolean }).__IS_CMS_PREVIEW__ = true;

  useEffect(() => {
    usePageBuilderStore.getState().resetStore();
    return () => {
      delete (window as { __IS_CMS_PREVIEW__?: boolean }).__IS_CMS_PREVIEW__;
    };
  }, [slug]);

  const [initialBody, setInitialBody] = useState<unknown>(undefined);

  useEffect(() => {
    if (pageQuery.data) {
      setInitialBody(pageQuery.data.data.body || []);
    }
  }, [pageQuery.data]);

  useEffect(() => {
    const container = document.getElementById('preview-container');
    if (!container) return;

    const processElements = () => {
      // 1. Remove contenteditable to ensure interactivity
      const editableElements = container.querySelectorAll('[contenteditable]');
      editableElements.forEach((el) => {
        el.removeAttribute('contenteditable');
      });

      // 2. Rewrite internal links so browser hover shows the correct URL
      const links = container.querySelectorAll('a');
      links.forEach((a) => {
        const href = a.getAttribute('href');
        if (
          href &&
          href.startsWith('/') &&
          !href.startsWith('//') &&
          !href.startsWith(`/collections/${schemaSlug}/preview/`)
        ) {
          a.setAttribute('data-original-href', href);
          a.setAttribute('href', `/collections/${schemaSlug}/preview${href}`);
        }
      });
    };

    const observer = new MutationObserver(() => {
      observer.disconnect();
      processElements();
      observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['href', 'contenteditable'],
      });
    });

    processElements();
    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['href', 'contenteditable'],
    });

    return () => observer.disconnect();
  }, [initialBody, schemaSlug]);

  // Intercept internal link clicks in Preview mode to route seamlessly (SPA navigation)
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor) {
        const href = anchor.getAttribute('href');
        if (href && href.startsWith('/') && !href.startsWith('//')) {
          e.preventDefault();
          if (href.startsWith(`/collections/${schemaSlug}/preview/`)) {
            navigate(href);
          } else {
            navigate(`/collections/${schemaSlug}/preview${href}`);
          }
        }
      }
    };

    document.addEventListener('click', handleLinkClick);
    return () => document.removeEventListener('click', handleLinkClick);
  }, [navigate, schemaSlug]);

  if (pageQuery.isLoading)
    return <div className="p-8 text-center">Loading...</div>;
  if (pageQuery.isError)
    return (
      <div className="p-8 text-center">
        Error loading page or page not found
      </div>
    );
  if (!initialBody) return null;

  const bodyData = initialBody as {
    builder?: string;
    html?: string;
    css?: string;
  };
  if (bodyData?.builder === 'grapesjs') {
    const cleanHtml = DOMPurify.sanitize(bodyData.html || '');
    const cleanCss = DOMPurify.sanitize(bodyData.css || '');
    return (
      <div
        id="preview-container"
        className="flex-1 w-full h-full min-h-screen bg-background text-foreground"
      >
        <style dangerouslySetInnerHTML={{ __html: cleanCss }} />
        <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />
      </div>
    );
  }

  return (
    <div
      id="preview-container"
      className="flex-1 overflow-x-hidden min-h-screen bg-background text-foreground"
    >
      <style>{`
        /* Override custom builder's global html/body overflow hidden */
        html, body {
          overflow: auto !important;
          height: auto !important;
        }
        
        /* Hide Custom Builder Editor Toolbar and sidebars in Preview Mode */
        #page-builder-header, 
        #sidebar,
        #customization,
        .component-controls,
        .component-label,
        .canvas-resizers {
          display: none !important;
        }
        
        /* Make Canvas Full Screen and let browser handle scrolling */
        page-builder {
          display: block;
          width: 100%;
          height: auto;
        }
        #app {
          border-radius: 0 !important;
          box-shadow: none !important;
          overflow: visible !important;
          height: auto !important;
          min-height: 100vh !important;
        }
        #canvas {
          width: 100% !important;
          height: auto !important;
          min-height: 100vh !important;
          background-image: none !important;
          padding: 0 !important;
          margin: 0 !important;
          overflow: visible !important;
          pointer-events: auto !important;
        }
        
        /* Force interactivity for form elements in preview mode */
        input, textarea, select, button, a, form, .component {
          pointer-events: auto !important;
          user-select: auto !important;
        }
        
        /* Remove dashed borders from editable components */
        .editable-component {
          border-color: transparent !important;
        }
        .editable-component:hover {
          border-color: transparent !important;
          box-shadow: none !important;
        }
      `}</style>
      <Suspense
        fallback={
          <div className="p-8 text-center text-muted-foreground">
            Loading preview...
          </div>
        }
      >
        <CustomBuilderPreview
          slug={slug!}
          initialDesign={initialBody}
          title={pageQuery.data?.data.title || 'Page Preview'}
        />
      </Suspense>
    </div>
  );
}
