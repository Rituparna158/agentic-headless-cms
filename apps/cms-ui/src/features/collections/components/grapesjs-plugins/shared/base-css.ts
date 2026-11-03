export const baseCss = `
  :root {
    --primary: #3b82f6;
    --primary-hover: #2563eb;
    --text-dark: #1e293b;
    --text-light: #64748b;
    --bg-white: #ffffff;
    --bg-gray: #f8fafc;
    --border: #e2e8f0;
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  }
  * {
    box-sizing: border-box;
  }
  img {
    max-width: 100%;
    height: auto;
  }
  img[data-object-fit="cover"],
  [data-cms-slot="cover_image_url"],
  [data-cms-slot="image"] {
    object-fit: cover;
  }
  @media (min-width: 1200px) {
    img:not([style*="max-height"]) {
      max-height: 600px;
    }
  }
`;
