import type { PageCustomSchema } from '@/types/content.types';

export interface StarterPageDefinition {
  key: string;
  title: string;
  slug: string;
  description: string;
  badge: string;
  schemas: PageCustomSchema[];
  body: {
    builder: 'grapesjs';
    html: string;
    css: string;
    projectData: null;
  };
}

const BASE_FONT =
  "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;";

// 1. GENERAL / CORPORATE STARTER PAGES
export const GENERAL_STARTER_PAGES: StarterPageDefinition[] = [
  {
    key: 'home',
    title: 'Homepage',
    slug: '/',
    description:
      'Dynamic Hero banner, value proposition CTA, and 3-column features grid',
    badge: 'Core Landing',
    schemas: [
      {
        id: 'hero-section',
        name: 'Hero Banner',
        slug: 'hero-section',
        entryType: 'single',
        fields: [
          { apiId: 'headline', displayName: 'Main Headline', dataType: 'text' },
          {
            apiId: 'subheading',
            displayName: 'Subheading Copy',
            dataType: 'textarea',
          },
          {
            apiId: 'cta_text',
            displayName: 'CTA Button Text',
            dataType: 'text',
          },
          { apiId: 'cta_url', displayName: 'CTA Button URL', dataType: 'url' },
        ],
        values: {
          headline: 'Build High-Converting Web Experiences',
          subheading:
            'Deploy modern visual landing pages with real-time token bindings and zero code bottlenecks.',
          cta_text: 'Explore Our Services',
          cta_url: '/services',
        },
      },
      {
        id: 'feature-grid-section',
        name: 'Feature Highlights',
        slug: 'feature-grid-section',
        entryType: 'multi',
        fields: [
          {
            apiId: 'section_title',
            displayName: 'Section Title',
            dataType: 'text',
          },
          {
            apiId: 'card_title',
            displayName: 'Feature Title',
            dataType: 'text',
          },
          {
            apiId: 'card_desc',
            displayName: 'Feature Description',
            dataType: 'textarea',
          },
          { apiId: 'card_tag', displayName: 'Category Tag', dataType: 'text' },
        ],
        values: {
          section_title: 'Why Global Teams Choose Us',
        },
        items: [
          {
            card_title: 'Edge Performance',
            card_desc:
              'Assets and rendered layouts are delivered via global CDN edge caches within milliseconds.',
            card_tag: 'Speed',
          },
          {
            card_title: 'Dynamic Schemas',
            card_desc:
              'Connect structured database fields to visual drag-and-drop builder components with ease.',
            card_tag: 'Extensibility',
          },
          {
            card_title: 'Enterprise Security',
            card_desc:
              'Hardware-level MFA, role-based capabilities, and immutable audit logs ensure compliance.',
            card_tag: 'Security',
          },
        ],
      },
    ],
    body: {
      builder: 'grapesjs',
      html: `
        <div class="home-page" style="${BASE_FONT} color: #0f172a; background-color: #ffffff;">
          <!-- Hero Section -->
          <section data-cms-schema="hero-section" class="hero-section" style="padding: 80px 24px; text-align: center; background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%); border-bottom: 1px solid #e2e8f0;">
            <div class="hero-wrapper" style="max-width: 860px; margin: 0 auto;">
              <span class="hero-badge" style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #4f46e5; background: #eef2ff; padding: 4px 14px; border-radius: 9999px; display: inline-block; margin-bottom: 20px;">
                Platform Showcase
              </span>
              <h1 data-cms-slot="headline" data-cms-schema="hero-section" class="hero-title" style="font-size: 44px; font-weight: 800; color: #0f172a; line-height: 1.2; margin: 0 0 16px; letter-spacing: -0.02em;">
                {{headline}}
              </h1>
              <p data-cms-slot="subheading" data-cms-schema="hero-section" class="hero-desc" style="font-size: 18px; color: #64748b; line-height: 1.6; max-width: 680px; margin: 0 auto 32px;">
                {{subheading}}
              </p>
              <div class="hero-btn-group" style="display: flex; justify-content: center; gap: 14px;">
                <a href="/services" data-cms-slot="cta_text" data-cms-schema="hero-section" class="btn-primary" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 15px; text-decoration: none; display: inline-block; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);">
                  {{cta_text}}
                </a>
                <a href="/contact" class="btn-secondary" style="background-color: #f1f5f9; color: #334155; padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 15px; text-decoration: none; display: inline-block;">
                  Contact Team
                </a>
              </div>
            </div>
          </section>

          <!-- Features Section -->
          <section data-cms-schema="feature-grid-section" class="features-section" style="padding: 72px 24px; max-width: 1120px; margin: 0 auto;">
            <div class="features-header" style="text-align: center; margin-bottom: 48px;">
              <h2 data-cms-slot="section_title" data-cms-schema="feature-grid-section" class="features-heading" style="font-size: 30px; font-weight: 800; color: #0f172a; margin: 0 0 10px;">{{section_title}}</h2>
              <p class="features-subheading" style="font-size: 15px; color: #64748b; max-width: 540px; margin: 0 auto;">Engineered for high velocity publishing with dynamic CMS integration.</p>
            </div>
            <div data-cms-repeat="true" data-cms-schema="feature-grid-section" class="features-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 28px;">
              <div class="feature-box" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04);">
                <span data-cms-slot="card_tag" data-cms-schema="feature-grid-section" class="feature-tag" style="font-size: 11px; font-weight: 700; color: #4f46e5; text-transform: uppercase;">{{card_tag}}</span>
                <h3 data-cms-slot="card_title" data-cms-schema="feature-grid-section" class="feature-title" style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 8px 0 12px;">{{card_title}}</h3>
                <p data-cms-slot="card_desc" data-cms-schema="feature-grid-section" class="feature-desc" style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0;">{{card_desc}}</p>
              </div>
            </div>
          </section>
        </div>
      `,
      css: `
        .home-page { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; background-color: #ffffff; }
        .hero-section { padding: 80px 24px; text-align: center; background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%); border-bottom: 1px solid #e2e8f0; }
        .hero-wrapper { max-width: 860px; margin: 0 auto; }
        .hero-badge { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #4f46e5; background: #eef2ff; padding: 4px 14px; border-radius: 9999px; display: inline-block; margin-bottom: 20px; }
        .hero-title { font-size: 44px; font-weight: 800; color: #0f172a; line-height: 1.2; margin: 0 0 16px; letter-spacing: -0.02em; }
        .hero-desc { font-size: 18px; color: #64748b; line-height: 1.6; max-width: 680px; margin: 0 auto 32px; }
        .hero-btn-group { display: flex; justify-content: center; gap: 14px; }
        .btn-primary { background-color: #4f46e5; color: #ffffff; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 15px; text-decoration: none; display: inline-block; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25); }
        .btn-secondary { background-color: #f1f5f9; color: #334155; padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 15px; text-decoration: none; display: inline-block; }
        .features-section { padding: 72px 24px; max-width: 1120px; margin: 0 auto; }
        .features-header { text-align: center; margin-bottom: 48px; }
        .features-heading { font-size: 30px; font-weight: 800; color: #0f172a; margin: 0 0 10px; }
        .features-subheading { font-size: 15px; color: #64748b; max-width: 540px; margin: 0 auto; }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 28px; }
        .feature-box { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04); }
        .feature-tag { font-size: 11px; font-weight: 700; color: #4f46e5; text-transform: uppercase; }
        .feature-title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 8px 0 12px; }
        .feature-desc { font-size: 14px; color: #64748b; line-height: 1.6; margin: 0; }
      `.trim(),
      projectData: null,
    },
  },
  {
    key: 'about',
    title: 'About Us',
    slug: '/about',
    description: 'Company mission statement, leadership team grid, and values',
    badge: 'Company Story',
    schemas: [
      {
        id: 'story-section',
        name: 'Mission & Story',
        slug: 'story-section',
        entryType: 'single',
        fields: [
          { apiId: 'headline', displayName: 'Section Title', dataType: 'text' },
          {
            apiId: 'story_copy',
            displayName: 'Our Story',
            dataType: 'textarea',
          },
          {
            apiId: 'year_founded',
            displayName: 'Year Founded',
            dataType: 'text',
          },
        ],
        values: {
          headline: 'Our Mission & Story',
          story_copy:
            'We build tools that democratize web publishing and connect modern developers with visual creative teams.',
          year_founded: '2022',
        },
      },
      {
        id: 'team-section',
        name: 'Leadership Team',
        slug: 'team-section',
        entryType: 'multi',
        fields: [
          {
            apiId: 'section_title',
            displayName: 'Section Title',
            dataType: 'text',
          },
          { apiId: 'member_name', displayName: 'Full Name', dataType: 'text' },
          {
            apiId: 'member_role',
            displayName: 'Role / Title',
            dataType: 'text',
          },
          {
            apiId: 'member_bio',
            displayName: 'Brief Bio',
            dataType: 'textarea',
          },
        ],
        values: { section_title: 'Leadership & Team' },
        items: [
          {
            member_name: 'Elena Rostova',
            member_role: 'Chief Technology Officer',
            member_bio:
              '15+ years architecting distributed systems and edge content networks.',
          },
          {
            member_name: 'Marcus Vance',
            member_role: 'Head of Product Design',
            member_bio:
              'Passionate about human-centered interfaces and fluid visual canvases.',
          },
        ],
      },
    ],
    body: {
      builder: 'grapesjs',
      html: `
        <div class="about-page" style="${BASE_FONT} color: #0f172a; background-color: #ffffff; padding: 72px 24px; max-width: 1040px; margin: 0 auto;">
          <section data-cms-schema="story-section" class="story-section" style="margin-bottom: 64px; text-align: center;">
            <span class="story-badge" style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #4f46e5; background: #eef2ff; padding: 4px 14px; border-radius: 9999px; display: inline-block; margin-bottom: 16px;">About Us</span>
            <h1 data-cms-slot="headline" data-cms-schema="story-section" class="story-title" style="font-size: 38px; font-weight: 800; color: #0f172a; margin: 0 0 16px;">{{headline}}</h1>
            <p data-cms-slot="story_copy" data-cms-schema="story-section" class="story-copy" style="font-size: 17px; color: #64748b; line-height: 1.7; max-width: 720px; margin: 0 auto;">{{story_copy}}</p>
          </section>

          <section data-cms-schema="team-section" class="team-section">
            <h2 data-cms-slot="section_title" data-cms-schema="team-section" class="team-header" style="font-size: 26px; font-weight: 800; color: #0f172a; text-align: center; margin-bottom: 36px;">{{section_title}}</h2>
            <div data-cms-repeat="true" data-cms-schema="team-section" class="team-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px;">
              <div class="team-card" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 28px; text-align: center;">
                <h3 data-cms-slot="member_name" data-cms-schema="team-section" class="member-name" style="font-size: 19px; font-weight: 700; color: #0f172a; margin: 0 0 4px;">{{member_name}}</h3>
                <p data-cms-slot="member_role" data-cms-schema="team-section" class="member-role" style="font-size: 13px; font-weight: 600; color: #4f46e5; margin: 0 0 12px;">{{member_role}}</p>
                <p data-cms-slot="member_bio" data-cms-schema="team-section" class="member-bio" style="font-size: 13px; color: #64748b; line-height: 1.6; margin: 0;">{{member_bio}}</p>
              </div>
            </div>
          </section>
        </div>
      `,
      css: `
        .about-page { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; background-color: #ffffff; padding: 72px 24px; max-width: 1040px; margin: 0 auto; }
        .story-section { margin-bottom: 64px; text-align: center; }
        .story-badge { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #4f46e5; background: #eef2ff; padding: 4px 14px; border-radius: 9999px; display: inline-block; margin-bottom: 16px; }
        .story-title { font-size: 38px; font-weight: 800; color: #0f172a; margin: 0 0 16px; }
        .story-copy { font-size: 17px; color: #64748b; line-height: 1.7; max-width: 720px; margin: 0 auto; }
        .team-header { font-size: 26px; font-weight: 800; color: #0f172a; text-align: center; margin-bottom: 36px; }
        .team-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
        .team-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 28px; text-align: center; }
        .member-name { font-size: 19px; font-weight: 700; color: #0f172a; margin: 0 0 4px; }
        .member-role { font-size: 13px; font-weight: 600; color: #4f46e5; margin: 0 0 12px; }
        .member-bio { font-size: 13px; color: #64748b; line-height: 1.6; margin: 0; }
      `.trim(),
      projectData: null,
    },
  },
  {
    key: 'contact',
    title: 'Contact Us',
    slug: '/contact',
    description:
      'Direct contact info cards, office hours, and structured inquiry form',
    badge: 'Communication',
    schemas: [
      {
        id: 'contact-info-section',
        name: 'Contact Information',
        slug: 'contact-info-section',
        entryType: 'single',
        fields: [
          {
            apiId: 'section_title',
            displayName: 'Header Title',
            dataType: 'text',
          },
          {
            apiId: 'section_subtitle',
            displayName: 'Header Subtitle',
            dataType: 'textarea',
          },
          { apiId: 'email', displayName: 'Support Email', dataType: 'text' },
          { apiId: 'phone', displayName: 'Phone Number', dataType: 'text' },
          {
            apiId: 'office_address',
            displayName: 'Office Location',
            dataType: 'textarea',
          },
        ],
        values: {
          section_title: 'Contact Our Team',
          section_subtitle:
            'We would love to hear from you. Send us a message below.',
          email: 'hello@acme.com',
          phone: '+1 (555) 432-8900',
          office_address: '500 Tech Boulevard, Suite 300, San Francisco, CA',
        },
      },
    ],
    body: {
      builder: 'grapesjs',
      html: `
        <div class="contact-page" style="${BASE_FONT} color: #0f172a; background-color: #ffffff; padding: 72px 24px; max-width: 960px; margin: 0 auto;">
          <div class="contact-header" style="text-align: center; margin-bottom: 48px;">
            <span class="contact-badge" style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #4f46e5; background: #eef2ff; padding: 4px 14px; border-radius: 9999px; display: inline-block; margin-bottom: 16px;">Get In Touch</span>
            <h1 data-cms-slot="section_title" data-cms-schema="contact-info-section" class="contact-title" style="font-size: 38px; font-weight: 800; color: #0f172a; margin: 0 0 12px;">{{section_title}}</h1>
            <p data-cms-slot="section_subtitle" data-cms-schema="contact-info-section" class="contact-subtitle" style="font-size: 16px; color: #64748b;">{{section_subtitle}}</p>
          </div>

          <div class="contact-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 36px; margin-bottom: 48px;">
            <div data-cms-schema="contact-info-section" class="contact-info-card" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px;">
              <h3 class="channel-title" style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 16px;">Direct Channels</h3>
              <div class="channel-item" style="margin-bottom: 16px;">
                <span class="channel-label" style="font-size: 12px; font-weight: 600; color: #64748b; display: block;">Email</span>
                <span data-cms-slot="email" data-cms-schema="contact-info-section" class="channel-email" style="font-size: 15px; font-weight: 600; color: #4f46e5;">{{email}}</span>
              </div>
              <div class="channel-item" style="margin-bottom: 16px;">
                <span class="channel-label" style="font-size: 12px; font-weight: 600; color: #64748b; display: block;">Phone</span>
                <span data-cms-slot="phone" data-cms-schema="contact-info-section" class="channel-phone" style="font-size: 15px; font-weight: 600; color: #0f172a;">{{phone}}</span>
              </div>
              <div class="channel-item">
                <span class="channel-label" style="font-size: 12px; font-weight: 600; color: #64748b; display: block;">Headquarters</span>
                <span data-cms-slot="office_address" data-cms-schema="contact-info-section" class="channel-address" style="font-size: 14px; color: #334155;">{{office_address}}</span>
              </div>
            </div>

            <!-- Form -->
            <form data-cms-form="contact" class="contact-form" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03);">
              <div class="form-field" style="margin-bottom: 16px;">
                <label class="field-label" style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px;">Your Name</label>
                <input name="name" required placeholder="Jane Doe" class="text-input" style="width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 14px; box-sizing: border-box;" />
              </div>
              <div class="form-field" style="margin-bottom: 16px;">
                <label class="field-label" style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px;">Email Address</label>
                <input name="email" type="email" required placeholder="jane@example.com" class="text-input" style="width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 14px; box-sizing: border-box;" />
              </div>
              <div class="form-field" style="margin-bottom: 20px;">
                <label class="field-label" style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px;">Message</label>
                <textarea name="message" rows="4" required placeholder="How can we help?" class="text-input" style="width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 14px; box-sizing: border-box;"></textarea>
              </div>
              <button type="submit" class="submit-btn" style="width: 100%; background: #4f46e5; color: #ffffff; padding: 12px; border-radius: 8px; font-weight: 600; font-size: 14px; border: none; cursor: pointer;">
                Send Message
              </button>
            </form>
          </div>
        </div>
      `,
      css: `
        .contact-page { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; background-color: #ffffff; padding: 72px 24px; max-width: 960px; margin: 0 auto; }
        .contact-header { text-align: center; margin-bottom: 48px; }
        .contact-badge { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #4f46e5; background: #eef2ff; padding: 4px 14px; border-radius: 9999px; display: inline-block; margin-bottom: 16px; }
        .contact-title { font-size: 38px; font-weight: 800; color: #0f172a; margin: 0 0 12px; }
        .contact-subtitle { font-size: 16px; color: #64748b; }
        .contact-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 36px; margin-bottom: 48px; }
        .contact-info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; }
        .channel-title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 16px; }
        .channel-item { margin-bottom: 16px; }
        .channel-label { font-size: 12px; font-weight: 600; color: #64748b; display: block; }
        .channel-email { font-size: 15px; font-weight: 600; color: #4f46e5; }
        .channel-phone { font-size: 15px; font-weight: 600; color: #0f172a; }
        .channel-address { font-size: 14px; color: #334155; }
        .contact-form { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03); }
        .form-field { margin-bottom: 16px; }
        .field-label { display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px; }
        .text-input { width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 14px; box-sizing: border-box; }
        .submit-btn { width: 100%; background: #4f46e5; color: #ffffff; padding: 12px; border-radius: 8px; font-weight: 600; font-size: 14px; border: none; cursor: pointer; }
      `.trim(),
      projectData: null,
    },
  },
  {
    key: 'services',
    title: 'Services & Solutions',
    slug: '/services',
    description:
      'Services grid with pricing badges, deliverables list, and booking CTA',
    badge: 'Solutions',
    schemas: [
      {
        id: 'services-list-section',
        name: 'Service Offerings',
        slug: 'services-list-section',
        entryType: 'multi',
        fields: [
          {
            apiId: 'section_title',
            displayName: 'Section Title',
            dataType: 'text',
          },
          {
            apiId: 'section_subtitle',
            displayName: 'Section Subtitle',
            dataType: 'textarea',
          },
          {
            apiId: 'service_title',
            displayName: 'Service Name',
            dataType: 'text',
          },
          {
            apiId: 'service_desc',
            displayName: 'Deliverables Summary',
            dataType: 'textarea',
          },
          {
            apiId: 'service_price',
            displayName: 'Starting Rate',
            dataType: 'text',
          },
        ],
        values: {
          section_title: 'Services & Solutions',
          section_subtitle:
            'Comprehensive services tailored to grow and modernize your digital ecosystem.',
        },
        items: [
          {
            service_title: 'Cloud Architecture & Headless Migration',
            service_desc:
              'Full migration strategy decoupling legacy monoliths into distributed edge frontends.',
            service_price: '$2,400',
          },
          {
            service_title: 'Design System & Token Engineering',
            service_desc:
              'Reusable component libraries with dynamic schema traits and multi-brand token sync.',
            service_price: '$1,800',
          },
          {
            service_title: 'Security Auditing & MFA Enforcement',
            service_desc:
              'Enterprise access reviews, cryptographic token isolation, and automated penetration testing.',
            service_price: '$1,200',
          },
        ],
      },
    ],
    body: {
      builder: 'grapesjs',
      html: `
        <div class="services-page" style="${BASE_FONT} color: #0f172a; background-color: #ffffff; padding: 72px 24px; max-width: 1100px; margin: 0 auto;">
          <div class="services-header" style="text-align: center; margin-bottom: 56px;">
            <span class="services-badge" style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #4f46e5; background: #eef2ff; padding: 4px 14px; border-radius: 9999px; display: inline-block; margin-bottom: 16px;">What We Offer</span>
            <h1 data-cms-slot="section_title" data-cms-schema="services-list-section" class="services-title" style="font-size: 38px; font-weight: 800; color: #0f172a; margin: 0 0 12px;">{{section_title}}</h1>
            <p data-cms-slot="section_subtitle" data-cms-schema="services-list-section" class="services-subtitle" style="font-size: 16px; color: #64748b; max-width: 580px; margin: 0 auto;">{{section_subtitle}}</p>
          </div>

          <div data-cms-schema="services-list-section" data-cms-repeat="true" class="services-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(310px, 1fr)); gap: 28px;">
            <div class="service-card" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; display: flex; flex-direction: column; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04);">
              <span data-cms-slot="service_price" data-cms-schema="services-list-section" class="service-price" style="font-size: 24px; font-weight: 800; color: #4f46e5; margin-bottom: 12px;">{{service_price}}</span>
              <h3 data-cms-slot="service_title" data-cms-schema="services-list-section" class="service-name" style="font-size: 19px; font-weight: 700; color: #0f172a; margin: 0 0 10px;">{{service_title}}</h3>
              <p data-cms-slot="service_desc" data-cms-schema="services-list-section" class="service-description" style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 24px; flex: 1;">{{service_desc}}</p>
              <a href="/contact" class="service-btn" style="background: #0f172a; color: #ffffff; text-align: center; padding: 10px; border-radius: 8px; font-weight: 600; font-size: 14px; text-decoration: none;">Book Consultation</a>
            </div>
          </div>
        </div>
      `,
      css: `
        .services-page { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; background-color: #ffffff; padding: 72px 24px; max-width: 1100px; margin: 0 auto; }
        .services-header { text-align: center; margin-bottom: 56px; }
        .services-badge { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #4f46e5; background: #eef2ff; padding: 4px 14px; border-radius: 9999px; display: inline-block; margin-bottom: 16px; }
        .services-title { font-size: 38px; font-weight: 800; color: #0f172a; margin: 0 0 12px; }
        .services-subtitle { font-size: 16px; color: #64748b; max-width: 580px; margin: 0 auto; }
        .services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(310px, 1fr)); gap: 28px; }
        .service-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; display: flex; flex-direction: column; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04); }
        .service-price { font-size: 24px; font-weight: 800; color: #4f46e5; margin-bottom: 12px; }
        .service-name { font-size: 19px; font-weight: 700; color: #0f172a; margin: 0 0 10px; }
        .service-description { font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 24px; flex: 1; }
        .service-btn { background: #0f172a; color: #ffffff; text-align: center; padding: 10px; border-radius: 8px; font-weight: 600; font-size: 14px; text-decoration: none; display: inline-block; }
      `.trim(),
      projectData: null,
    },
  },
];

// 2. E-COMMERCE / AMAZON-STYLE STARTER PAGES
export const ECOMMERCE_STARTER_PAGES: StarterPageDefinition[] = [
  {
    key: 'store_home',
    title: 'Storefront Homepage',
    slug: '/',
    description:
      'Promotional deals banner, top-selling categories, and trending products carousel',
    badge: 'Storefront Home',
    schemas: [
      {
        id: 'deals-hero-section',
        name: 'Prime Deals Hero',
        slug: 'deals-hero-section',
        entryType: 'single',
        fields: [
          { apiId: 'headline', displayName: 'Deal Headline', dataType: 'text' },
          {
            apiId: 'subheading',
            displayName: 'Promotion Details',
            dataType: 'textarea',
          },
          {
            apiId: 'deal_discount',
            displayName: 'Discount Badge',
            dataType: 'text',
          },
          {
            apiId: 'cta_text',
            displayName: 'Shop Button Text',
            dataType: 'text',
          },
        ],
        values: {
          headline: 'Mega Spring Sale & Featured Tech Drops',
          subheading:
            'Up to 45% off premium noise-cancelling headphones, smart wearables, and designer accessories.',
          deal_discount: 'LIMITED TIME 45% OFF',
          cta_text: 'Shop Deals Now',
        },
      },
      {
        id: 'featured-products-section',
        name: 'Trending Products',
        slug: 'featured-products-section',
        entryType: 'multi',
        fields: [
          {
            apiId: 'section_title',
            displayName: 'Section Title',
            dataType: 'text',
          },
          {
            apiId: 'product_name',
            displayName: 'Product Name',
            dataType: 'text',
          },
          {
            apiId: 'product_price',
            displayName: 'Sale Price',
            dataType: 'text',
          },
          {
            apiId: 'product_rating',
            displayName: 'Rating Score',
            dataType: 'text',
          },
          {
            apiId: 'product_badge',
            displayName: 'Amazon Choice Badge',
            dataType: 'text',
          },
        ],
        values: { section_title: 'Trending Right Now' },
        items: [
          {
            product_name: 'Studio Pro Wireless Over-Ear Headphones',
            product_price: '$129.99',
            product_rating: '4.8 ★ (1,240 reviews)',
            product_badge: "Editor's Choice",
          },
          {
            product_name: 'Ultra-Fast 65W GaN Travel Charger Block',
            product_price: '$29.99',
            product_rating: '4.9 ★ (3,120 reviews)',
            product_badge: 'Best Seller',
          },
          {
            product_name: 'Ergonomic Mechanical Keyboard with RGB',
            product_price: '$89.00',
            product_rating: '4.7 ★ (890 reviews)',
            product_badge: 'Popular',
          },
        ],
      },
    ],
    body: {
      builder: 'grapesjs',
      html: `
        <div class="store-page" style="${BASE_FONT} color: #0f172a; background-color: #f8fafc;">
          <!-- Deals Hero -->
          <section data-cms-schema="deals-hero-section" class="deals-hero" style="background: #0f172a; color: #ffffff; padding: 72px 24px; text-align: center;">
            <div class="deals-hero-inner" style="max-width: 820px; margin: 0 auto;">
              <span data-cms-slot="deal_discount" data-cms-schema="deals-hero-section" class="deal-badge" style="background: #f59e0b; color: #000000; font-weight: 800; font-size: 11px; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; display: inline-block; margin-bottom: 16px;">
                {{deal_discount}}
              </span>
              <h1 data-cms-slot="headline" data-cms-schema="deals-hero-section" class="deals-title" style="font-size: 42px; font-weight: 800; line-height: 1.2; margin: 0 0 16px; color: #ffffff;">
                {{headline}}
              </h1>
              <p data-cms-slot="subheading" data-cms-schema="deals-hero-section" class="deals-desc" style="font-size: 17px; color: #94a3b8; line-height: 1.6; margin: 0 auto 28px; max-width: 640px;">
                {{subheading}}
              </p>
              <a href="/products" data-cms-slot="cta_text" data-cms-schema="deals-hero-section" class="shop-btn" style="background: #f59e0b; color: #000000; padding: 12px 30px; border-radius: 8px; font-weight: 700; font-size: 15px; text-decoration: none; display: inline-block;">
                {{cta_text}}
              </a>
            </div>
          </section>

          <!-- Featured Products -->
          <section data-cms-schema="featured-products-section" class="featured-section" style="padding: 64px 24px; max-width: 1120px; margin: 0 auto;">
            <h2 data-cms-slot="section_title" data-cms-schema="featured-products-section" class="featured-heading" style="font-size: 26px; font-weight: 800; color: #0f172a; margin-bottom: 32px;">{{section_title}}</h2>
            <div data-cms-repeat="true" data-cms-schema="featured-products-section" class="products-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px;">
              <div class="product-card" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 24px; display: flex; flex-direction: column;">
                <span data-cms-slot="product_badge" data-cms-schema="featured-products-section" class="product-badge" style="background: #e0f2fe; color: #0284c7; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; align-self: flex-start; margin-bottom: 12px;">{{product_badge}}</span>
                <h3 data-cms-slot="product_name" data-cms-schema="featured-products-section" class="product-title" style="font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 8px;">{{product_name}}</h3>
                <span data-cms-slot="product_rating" data-cms-schema="featured-products-section" class="product-rating" style="font-size: 12px; color: #f59e0b; font-weight: 600; margin-bottom: 16px;">{{product_rating}}</span>
                <div class="product-footer" style="margin-top: auto; display: flex; align-items: center; justify-content: space-between; pt-4; border-top: 1px solid #f1f5f9;">
                  <span data-cms-slot="product_price" data-cms-schema="featured-products-section" class="product-price" style="font-size: 22px; font-weight: 800; color: #0f172a;">{{product_price}}</span>
                  <button type="button" class="add-cart-btn" style="background: #f59e0b; color: #000; border: none; font-weight: 700; font-size: 13px; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Add to Cart</button>
                </div>
              </div>
            </div>
          </section>
        </div>
      `,
      css: `
        .store-page { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; background-color: #f8fafc; }
        .deals-hero { background: #0f172a; color: #ffffff; padding: 72px 24px; text-align: center; }
        .deals-hero-inner { max-width: 820px; margin: 0 auto; }
        .deal-badge { background: #f59e0b; color: #000000; font-weight: 800; font-size: 11px; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; display: inline-block; margin-bottom: 16px; }
        .deals-title { font-size: 42px; font-weight: 800; line-height: 1.2; margin: 0 0 16px; color: #ffffff; }
        .deals-desc { font-size: 17px; color: #94a3b8; line-height: 1.6; margin: 0 auto 28px; max-width: 640px; }
        .shop-btn { background: #f59e0b; color: #000000; padding: 12px 30px; border-radius: 8px; font-weight: 700; font-size: 15px; text-decoration: none; display: inline-block; }
        .featured-section { padding: 64px 24px; max-width: 1120px; margin: 0 auto; }
        .featured-heading { font-size: 26px; font-weight: 800; color: #0f172a; margin-bottom: 32px; }
        .products-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
        .product-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 24px; display: flex; flex-direction: column; }
        .product-badge { background: #e0f2fe; color: #0284c7; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; align-self: flex-start; margin-bottom: 12px; }
        .product-title { font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 8px; }
        .product-rating { font-size: 12px; color: #f59e0b; font-weight: 600; margin-bottom: 16px; }
        .product-footer { margin-top: auto; display: flex; align-items: center; justify-content: space-between; padding-top: 16px; border-top: 1px solid #f1f5f9; }
        .product-price { font-size: 22px; font-weight: 800; color: #0f172a; }
        .add-cart-btn { background: #f59e0b; color: #000; border: none; font-weight: 700; font-size: 13px; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
      `.trim(),
      projectData: null,
    },
  },
  {
    key: 'products',
    title: 'Product Catalog & Shop',
    slug: '/products',
    description:
      'Filterable product catalog with price tags, SKU codes, and stock indicators',
    badge: 'Catalog',
    schemas: [
      {
        id: 'catalog-header-section',
        name: 'Catalog Header',
        slug: 'catalog-header-section',
        entryType: 'single',
        fields: [
          { apiId: 'headline', displayName: 'Catalog Title', dataType: 'text' },
          {
            apiId: 'subheading',
            displayName: 'Catalog Description',
            dataType: 'textarea',
          },
        ],
        values: {
          headline: 'Full Product Catalog',
          subheading:
            'Browse our complete collection of certified hardware, accessories, and replacement parts.',
        },
      },
      {
        id: 'product-grid-section',
        name: 'Catalog Inventory',
        slug: 'product-grid-section',
        entryType: 'multi',
        fields: [
          {
            apiId: 'section_title',
            displayName: 'Section Title',
            dataType: 'text',
          },
          {
            apiId: 'product_name',
            displayName: 'Item Title',
            dataType: 'text',
          },
          { apiId: 'product_price', displayName: 'Price', dataType: 'text' },
          { apiId: 'product_sku', displayName: 'SKU Tag', dataType: 'text' },
          {
            apiId: 'stock_status',
            displayName: 'Availability',
            dataType: 'text',
          },
        ],
        values: { section_title: 'All In-Stock Items' },
        items: [
          {
            product_name: 'Smart Home Security Gateway Hub',
            product_price: '$119.00',
            product_sku: 'SKU-GATEWAY-01',
            stock_status: 'In Stock (Ready to Ship)',
          },
          {
            product_name: 'High-Density Braided USB-C Cable (2m)',
            product_price: '$16.50',
            product_sku: 'SKU-CABLE-02',
            stock_status: 'In Stock',
          },
        ],
      },
    ],
    body: {
      builder: 'grapesjs',
      html: `
        <div class="catalog-page" style="${BASE_FONT} color: #0f172a; background-color: #ffffff; padding: 64px 24px; max-width: 1100px; margin: 0 auto;">
          <div data-cms-schema="catalog-header-section" class="catalog-header" style="margin-bottom: 40px; border-bottom: 1px solid #e2e8f0; padding-bottom: 24px;">
            <h1 data-cms-slot="headline" data-cms-schema="catalog-header-section" class="catalog-title" style="font-size: 34px; font-weight: 800; color: #0f172a; margin: 0 0 8px;">{{headline}}</h1>
            <p data-cms-slot="subheading" data-cms-schema="catalog-header-section" class="catalog-subtitle" style="font-size: 15px; color: #64748b; margin: 0;">{{subheading}}</p>
          </div>

          <div data-cms-schema="product-grid-section" data-cms-repeat="true" class="catalog-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px;">
            <div class="catalog-card" style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background: #fafafa;">
              <span data-cms-slot="product_sku" data-cms-schema="product-grid-section" class="sku-tag" style="font-size: 11px; font-family: monospace; color: #64748b; display: block; margin-bottom: 6px;">{{product_sku}}</span>
              <h3 data-cms-slot="product_name" data-cms-schema="product-grid-section" class="product-name" style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 10px;">{{product_name}}</h3>
              <span data-cms-slot="stock_status" data-cms-schema="product-grid-section" class="stock-badge" style="font-size: 12px; font-weight: 600; color: #16a34a; display: block; margin-bottom: 16px;">{{stock_status}}</span>
              <div class="card-footer" style="display: flex; align-items: center; justify-content: space-between;">
                <span data-cms-slot="product_price" data-cms-schema="product-grid-section" class="item-price" style="font-size: 20px; font-weight: 800; color: #0f172a;">{{product_price}}</span>
                <button type="button" class="buy-btn" style="background: #0f172a; color: #fff; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; border: none; cursor: pointer;">Buy Now</button>
              </div>
            </div>
          </div>
        </div>
      `,
      css: `
        .catalog-page { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; background-color: #ffffff; padding: 64px 24px; max-width: 1100px; margin: 0 auto; }
        .catalog-header { margin-bottom: 40px; border-bottom: 1px solid #e2e8f0; padding-bottom: 24px; }
        .catalog-title { font-size: 34px; font-weight: 800; color: #0f172a; margin: 0 0 8px; }
        .catalog-subtitle { font-size: 15px; color: #64748b; margin: 0; }
        .catalog-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
        .catalog-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background: #fafafa; }
        .sku-tag { font-size: 11px; font-family: monospace; color: #64748b; display: block; margin-bottom: 6px; }
        .product-name { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 10px; }
        .stock-badge { font-size: 12px; font-weight: 600; color: #16a34a; display: block; margin-bottom: 16px; }
        .card-footer { display: flex; align-items: center; justify-content: space-between; }
        .item-price { font-size: 20px; font-weight: 800; color: #0f172a; }
        .buy-btn { background: #0f172a; color: #fff; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; border: none; cursor: pointer; }
      `.trim(),
      projectData: null,
    },
  },
  {
    key: 'orders',
    title: 'Shipping & Orders',
    slug: '/orders',
    description:
      'Order lookup instructions, domestic & global shipping policies',
    badge: 'Logistics',
    schemas: [
      {
        id: 'shipping-info-section',
        name: 'Shipping Policies',
        slug: 'shipping-info-section',
        entryType: 'single',
        fields: [
          { apiId: 'headline', displayName: 'Section Title', dataType: 'text' },
          {
            apiId: 'delivery_time',
            displayName: 'Standard Delivery Time',
            dataType: 'text',
          },
          {
            apiId: 'shipping_terms',
            displayName: 'Policy Details',
            dataType: 'textarea',
          },
        ],
        values: {
          headline: 'Shipping & Order Tracking',
          delivery_time: '2 - 4 Business Days (Express Available)',
          shipping_terms:
            'All orders are processed with real-time tracking numbers and insured against damage or loss.',
        },
      },
    ],
    body: {
      builder: 'grapesjs',
      html: `
        <div class="orders-page" style="${BASE_FONT} color: #0f172a; background-color: #ffffff; padding: 72px 24px; max-width: 860px; margin: 0 auto;">
          <section data-cms-schema="shipping-info-section" class="shipping-card" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 36px;">
            <h1 data-cms-slot="headline" data-cms-schema="shipping-info-section" class="shipping-title" style="font-size: 32px; font-weight: 800; color: #0f172a; margin: 0 0 12px;">{{headline}}</h1>
            <p data-cms-slot="delivery_time" data-cms-schema="shipping-info-section" class="delivery-time" style="font-size: 16px; font-weight: 600; color: #4f46e5; margin: 0 0 16px;">{{delivery_time}}</p>
            <p data-cms-slot="shipping_terms" data-cms-schema="shipping-info-section" class="shipping-terms" style="font-size: 14px; color: #64748b; line-height: 1.7; margin: 0 0 24px;">{{shipping_terms}}</p>
            <div class="tracking-box" style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; display: flex; gap: 12px;">
              <input placeholder="Enter Tracking / Order ID" class="tracking-input" style="flex: 1; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; font-size: 14px;" />
              <button class="tracking-btn" style="background: #0f172a; color: #fff; border: none; padding: 8px 18px; border-radius: 6px; font-weight: 600; cursor: pointer;">Track Order</button>
            </div>
          </section>
        </div>
      `,
      css: `
        .orders-page { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; background-color: #ffffff; padding: 72px 24px; max-width: 860px; margin: 0 auto; }
        .shipping-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 36px; }
        .shipping-title { font-size: 32px; font-weight: 800; color: #0f172a; margin: 0 0 12px; }
        .delivery-time { font-size: 16px; font-weight: 600; color: #4f46e5; margin: 0 0 16px; }
        .shipping-terms { font-size: 14px; color: #64748b; line-height: 1.7; margin: 0 0 24px; }
        .tracking-box { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; display: flex; gap: 12px; }
        .tracking-input { flex: 1; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; font-size: 14px; }
        .tracking-btn { background: #0f172a; color: #fff; border: none; padding: 8px 18px; border-radius: 6px; font-weight: 600; cursor: pointer; }
      `.trim(),
      projectData: null,
    },
  },
  {
    key: 'support',
    title: 'Support & Returns',
    slug: '/support',
    description: '30-day hassle-free return policy and customer support FAQ',
    badge: 'Help Center',
    schemas: [
      {
        id: 'faq-section',
        name: 'Return FAQ',
        slug: 'faq-section',
        entryType: 'multi',
        fields: [
          {
            apiId: 'section_title',
            displayName: 'Section Title',
            dataType: 'text',
          },
          {
            apiId: 'section_subtitle',
            displayName: 'Section Subtitle',
            dataType: 'textarea',
          },
          { apiId: 'question', displayName: 'Question', dataType: 'text' },
          { apiId: 'answer', displayName: 'Answer', dataType: 'textarea' },
        ],
        values: {
          section_title: 'Support & Returns FAQ',
          section_subtitle:
            'Find answers to common customer service inquiries.',
        },
        items: [
          {
            question: 'What is your 30-day return policy?',
            answer:
              'Items can be returned within 30 days of delivery in their original packaging for a 100% refund.',
          },
          {
            question: 'How do I generate a prepaid return shipping label?',
            answer:
              'Head to your Orders dashboard, click Return Item, and a printable PDF barcode label will be created instantly.',
          },
        ],
      },
    ],
    body: {
      builder: 'grapesjs',
      html: `
        <div class="support-page" style="${BASE_FONT} color: #0f172a; background-color: #ffffff; padding: 72px 24px; max-width: 900px; margin: 0 auto;">
          <div class="support-header" style="text-align: center; margin-bottom: 48px;">
            <h1 data-cms-slot="section_title" data-cms-schema="faq-section" class="support-title" style="font-size: 34px; font-weight: 800; color: #0f172a; margin: 0 0 10px;">{{section_title}}</h1>
            <p data-cms-slot="section_subtitle" data-cms-schema="faq-section" class="support-subtitle" style="font-size: 15px; color: #64748b;">{{section_subtitle}}</p>
          </div>
          <div data-cms-schema="faq-section" data-cms-repeat="true" class="faq-list">
            <div class="faq-item" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 16px;">
              <h3 data-cms-slot="question" data-cms-schema="faq-section" class="faq-question" style="font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 8px;">{{question}}</h3>
              <p data-cms-slot="answer" data-cms-schema="faq-section" class="faq-answer" style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0;">{{answer}}</p>
            </div>
          </div>
        </div>
      `,
      css: `
        .support-page { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; background-color: #ffffff; padding: 72px 24px; max-width: 900px; margin: 0 auto; }
        .support-header { text-align: center; margin-bottom: 48px; }
        .support-title { font-size: 34px; font-weight: 800; color: #0f172a; margin: 0 0 10px; }
        .support-subtitle { font-size: 15px; color: #64748b; }
        .faq-list { display: flex; flex-direction: column; gap: 16px; }
        .faq-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; }
        .faq-question { font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 8px; }
        .faq-answer { font-size: 14px; color: #64748b; line-height: 1.6; margin: 0; }
      `.trim(),
      projectData: null,
    },
  },
];

// Helper to get starter pages matching chosen category
export function getStarterPagesForCategory(
  category?: string,
): StarterPageDefinition[] {
  const cat = (category || '').toLowerCase().trim();
  if (cat === 'ecommerce' || cat.includes('amazon') || cat.includes('shop')) {
    return ECOMMERCE_STARTER_PAGES;
  }
  return GENERAL_STARTER_PAGES;
}
