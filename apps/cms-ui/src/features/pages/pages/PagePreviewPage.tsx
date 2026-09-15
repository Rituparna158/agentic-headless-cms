import { useState, useEffect, Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { pagesApi } from '../api/pages.api';

const CustomBuilderPreview = lazy(
  () => import('../components/CustomBuilderPreview'),
);
import DOMPurify from 'dompurify';
import { usePageBuilderStore } from '../components/page-builder/stores/pageBuilderStore';

export function PagePreviewPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const pageQuery = useQuery({
    queryKey: ['pageBySlug', slug],
    queryFn: () => pagesApi.getPageBySlug(slug!),
    enabled: !!slug,
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
    // Some browsers prevent input focus if an ancestor has contenteditable="false".
    // Since this is the live preview, we strip all contenteditable attributes.
    const canvas = document.getElementById('canvas');
    if (!canvas) return;

    const observer = new MutationObserver(() => {
      observer.disconnect();
      const elements = canvas.querySelectorAll('[contenteditable]');
      elements.forEach((el) => {
        el.removeAttribute('contenteditable');
      });
      observer.observe(canvas, { childList: true, subtree: true });
    });

    observer.observe(canvas, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [initialBody]);

  // Intercept internal link clicks in Preview mode to route seamlessly
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor) {
        const href = anchor.getAttribute('href');
        if (href && href.startsWith('/') && !href.startsWith('//')) {
          e.preventDefault();
          if (href.startsWith('/preview/')) {
            navigate(href);
          } else {
            navigate(`/preview${href}`);
          }
        }
      }
    };

    document.addEventListener('click', handleLinkClick);
    return () => document.removeEventListener('click', handleLinkClick);
  }, [navigate]);

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
      <div className="flex-1 w-full h-full min-h-screen bg-background text-foreground">
        <style dangerouslySetInnerHTML={{ __html: cleanCss }} />
        <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-x-hidden min-h-screen bg-background text-foreground">
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
