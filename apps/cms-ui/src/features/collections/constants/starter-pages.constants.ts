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
// 3. MODERN RETAIL & FASHION BOUTIQUE STARTER PAGES
export const RETAIL_STARTER_PAGES: StarterPageDefinition[] = [
  {
    key: 'retail_home',
    title: 'Boutique Showcase Homepage',
    slug: '/',
    description:
      'Editorial hero lookbook, seasonal drop announcements, and curated fashion essentials',
    badge: 'Boutique Home',
    schemas: [
      {
        id: 'retail-hero-section',
        name: 'Editorial Atelier Hero',
        slug: 'retail-hero-section',
        entryType: 'single',
        fields: [
          {
            apiId: 'headline',
            displayName: 'Atelier Headline',
            dataType: 'text',
          },
          {
            apiId: 'season_tag',
            displayName: 'Season / Drop Badge',
            dataType: 'text',
          },
          {
            apiId: 'subheading',
            displayName: 'Collection Narrative',
            dataType: 'textarea',
          },
          {
            apiId: 'cta_text',
            displayName: 'Explore Drop CTA',
            dataType: 'text',
          },
        ],
        values: {
          headline: 'Minimalist Forms. Uncompromising Silhouettes.',
          season_tag: 'SPRING / SUMMER 2026 DROP 01',
          subheading:
            'Handcrafted natural textiles, tailored monochrome outerwear, and modular essentials designed for timeless everyday wear.',
          cta_text: 'Explore New Arrivals',
        },
      },
      {
        id: 'curated-drops-section',
        name: 'Curated Arrivals',
        slug: 'curated-drops-section',
        entryType: 'multi',
        fields: [
          {
            apiId: 'section_title',
            displayName: 'Section Title',
            dataType: 'text',
          },
          {
            apiId: 'item_title',
            displayName: 'Garment Name',
            dataType: 'text',
          },
          {
            apiId: 'designer',
            displayName: 'Atelier / Brand',
            dataType: 'text',
          },
          { apiId: 'price', displayName: 'Retail Price ($)', dataType: 'text' },
          {
            apiId: 'lookbook_badge',
            displayName: 'Collection Tag',
            dataType: 'text',
          },
        ],
        values: { section_title: 'Curated Seasonal Drop' },
        items: [
          {
            item_title: 'Oversized Raw Wool Trench Coat',
            designer: 'Atelier & Co.',
            price: '$480',
            lookbook_badge: 'Limited Run (50 Pieces)',
          },
          {
            item_title: 'Pleated Linen Relaxed Trousers',
            designer: 'Studio Monochrome',
            price: '$220',
            lookbook_badge: 'Essential Cut',
          },
          {
            item_title: 'Structured Leather Crossbody Tote',
            designer: 'Nordic Hide',
            price: '$310',
            lookbook_badge: 'Pre-Order',
          },
        ],
      },
    ],
    body: {
      builder: 'grapesjs',
      html: `
        <div class="retail-page" style="${BASE_FONT} color: #18181b; background-color: #fafafa;">
          <section data-cms-schema="retail-hero-section" class="retail-hero" style="padding: 96px 24px; text-align: center; background: #ffffff; border-bottom: 1px solid #f4f4f5;">
            <div style="max-width: 820px; margin: 0 auto;">
              <span data-cms-slot="season_tag" data-cms-schema="retail-hero-section" class="season-badge" style="font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #18181b; border: 1px solid #18181b; padding: 4px 14px; border-radius: 9999px; display: inline-block; margin-bottom: 24px;">
                {{season_tag}}
              </span>
              <h1 data-cms-slot="headline" data-cms-schema="retail-hero-section" style="font-size: 46px; font-weight: 300; letter-spacing: -0.03em; line-height: 1.15; color: #09090b; margin: 0 0 20px;">
                {{headline}}
              </h1>
              <p data-cms-slot="subheading" data-cms-schema="retail-hero-section" style="font-size: 16px; color: #71717a; line-height: 1.8; max-width: 600px; margin: 0 auto 36px; font-weight: 400;">
                {{subheading}}
              </p>
              <a href="/collections" data-cms-slot="cta_text" data-cms-schema="retail-hero-section" style="display: inline-block; background: #18181b; color: #ffffff; padding: 14px 36px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; text-decoration: none; border-radius: 4px;">
                {{cta_text}}
              </a>
            </div>
          </section>

          <section data-cms-schema="curated-drops-section" style="padding: 80px 24px; max-width: 1160px; margin: 0 auto;">
            <h2 data-cms-slot="section_title" data-cms-schema="curated-drops-section" style="font-size: 24px; font-weight: 400; text-transform: uppercase; letter-spacing: 0.08em; text-align: center; margin-bottom: 48px; color: #18181b;">
              {{section_title}}
            </h2>
            <div data-cms-repeat="true" data-cms-schema="curated-drops-section" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 32px;">
              <div style="background: #ffffff; border: 1px solid #e4e4e7; border-radius: 8px; padding: 24px; display: flex; flex-direction: column;">
                <span data-cms-slot="lookbook_badge" data-cms-schema="curated-drops-section" style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #a1a1aa; margin-bottom: 8px;">{{lookbook_badge}}</span>
                <h3 data-cms-slot="item_title" data-cms-schema="curated-drops-section" style="font-size: 17px; font-weight: 600; color: #09090b; margin: 0 0 6px;">{{item_title}}</h3>
                <p data-cms-slot="designer" data-cms-schema="curated-drops-section" style="font-size: 13px; color: #71717a; margin: 0 0 20px;">{{designer}}</p>
                <div style="margin-top: auto; display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid #f4f4f5;">
                  <span data-cms-slot="price" data-cms-schema="curated-drops-section" style="font-size: 18px; font-weight: 700; color: #09090b;">{{price}}</span>
                  <a href="/lookbook" style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #18181b; text-decoration: underline;">View Piece</a>
                </div>
              </div>
            </div>
          </section>
        </div>
      `,
      css: `
        .retail-page { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #18181b; background-color: #fafafa; }
        .season-badge { letter-spacing: 0.15em; }
      `.trim(),
      projectData: null,
    },
  },
  {
    key: 'collections',
    title: 'Curated Collections & Drops',
    slug: '/collections',
    description:
      'Seasonal collection galleries, capsule drops, and lookbook edit',
    badge: 'Collections',
    schemas: [
      {
        id: 'collections-header-section',
        name: 'Collections Header',
        slug: 'collections-header-section',
        entryType: 'single',
        fields: [
          { apiId: 'headline', displayName: 'Header Title', dataType: 'text' },
          {
            apiId: 'subheading',
            displayName: 'Narrative',
            dataType: 'textarea',
          },
        ],
        values: {
          headline: 'Seasonal Capsule Drops',
          subheading:
            'Each capsule is released in limited volume, cut from organic and ethically sourced raw materials.',
        },
      },
      {
        id: 'collections-gallery-section',
        name: 'Capsule Drops',
        slug: 'collections-gallery-section',
        entryType: 'multi',
        fields: [
          {
            apiId: 'collection_name',
            displayName: 'Collection Name',
            dataType: 'text',
          },
          {
            apiId: 'release_season',
            displayName: 'Release Date',
            dataType: 'text',
          },
          {
            apiId: 'piece_count',
            displayName: 'Number of Pieces',
            dataType: 'text',
          },
          {
            apiId: 'description',
            displayName: 'Editorial Summary',
            dataType: 'textarea',
          },
        ],
        values: {},
        items: [
          {
            collection_name: 'Capsule 01: Raw Earth & Charcoal',
            release_season: 'Early Spring 2026',
            piece_count: '14 Silhouettes',
            description:
              'Unbleached Japanese denim, heavyweight knitwear, and unlined chore jackets.',
          },
          {
            collection_name: 'Capsule 02: Coastal Monolith',
            release_season: 'Mid Spring 2026',
            piece_count: '18 Silhouettes',
            description:
              'Water-repellent technical nylon shells paired with featherweight silk-cotton tops.',
          },
        ],
      },
    ],
    body: {
      builder: 'grapesjs',
      html: `
        <div class="collections-page" style="${BASE_FONT} padding: 72px 24px; max-width: 1100px; margin: 0 auto;">
          <div data-cms-schema="collections-header-section" style="text-align: center; margin-bottom: 56px;">
            <h1 data-cms-slot="headline" data-cms-schema="collections-header-section" style="font-size: 38px; font-weight: 300; letter-spacing: -0.02em; margin-bottom: 12px;">{{headline}}</h1>
            <p data-cms-slot="subheading" data-cms-schema="collections-header-section" style="font-size: 15px; color: #71717a; max-width: 600px; margin: 0 auto;">{{subheading}}</p>
          </div>
          <div data-cms-repeat="true" data-cms-schema="collections-gallery-section" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 28px;">
            <div style="background: #ffffff; border: 1px solid #e4e4e7; border-radius: 8px; padding: 32px;">
              <span data-cms-slot="release_season" data-cms-schema="collections-gallery-section" style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #71717a;">{{release_season}}</span>
              <h3 data-cms-slot="collection_name" data-cms-schema="collections-gallery-section" style="font-size: 20px; font-weight: 600; margin: 8px 0;">{{collection_name}}</h3>
              <span data-cms-slot="piece_count" data-cms-schema="collections-gallery-section" style="font-size: 12px; color: #18181b; font-weight: 600; display: inline-block; margin-bottom: 14px;">{{piece_count}}</span>
              <p data-cms-slot="description" data-cms-schema="collections-gallery-section" style="font-size: 14px; color: #71717a; line-height: 1.6; margin: 0 0 20px;">{{description}}</p>
              <a href="/lookbook" style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #18181b; text-decoration: underline;">View Lookbook</a>
            </div>
          </div>
        </div>
      `,
      css: '.collections-page { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }',
      projectData: null,
    },
  },
  {
    key: 'lookbook',
    title: 'Seasonal Lookbook & Catalog',
    slug: '/lookbook',
    description:
      'High-resolution editorial photography, model spotlights, and garment details',
    badge: 'Lookbook',
    schemas: [
      {
        id: 'lookbook-hero-section',
        name: 'Lookbook Editorial Note',
        slug: 'lookbook-hero-section',
        entryType: 'single',
        fields: [
          {
            apiId: 'season_title',
            displayName: 'Season Title',
            dataType: 'text',
          },
          {
            apiId: 'editorial_note',
            displayName: 'Curator Note',
            dataType: 'textarea',
          },
        ],
        values: {
          season_title: 'Lookbook: The Architecture of Form',
          editorial_note:
            'Photographed on 35mm film in Copenhagen. Exploring negative space, tactile draping, and quiet utility.',
        },
      },
      {
        id: 'lookbook-grid-section',
        name: 'Lookbook Gallery',
        slug: 'lookbook-grid-section',
        entryType: 'multi',
        fields: [
          {
            apiId: 'style_name',
            displayName: 'Look Number & Name',
            dataType: 'text',
          },
          { apiId: 'photographer', displayName: 'Credits', dataType: 'text' },
          {
            apiId: 'garments_featured',
            displayName: 'Garments Included',
            dataType: 'textarea',
          },
        ],
        values: {},
        items: [
          {
            style_name: 'Look 01: Monochrome Overcoat & Pleated Slacks',
            photographer: 'Photography by Astrid Lind',
            garments_featured:
              'Raw Wool Trench ($480) with Relaxed Linen Trousers ($220)',
          },
          {
            style_name: 'Look 02: Minimalist Ribbed Knit & Leather Accent',
            photographer: 'Photography by Astrid Lind',
            garments_featured:
              'Merino Rollneck ($190) with Structured Crossbody Tote ($310)',
          },
        ],
      },
    ],
    body: {
      builder: 'grapesjs',
      html: `
        <div class="lookbook-page" style="${BASE_FONT} padding: 72px 24px; max-width: 1040px; margin: 0 auto;">
          <div data-cms-schema="lookbook-hero-section" style="text-align: center; margin-bottom: 56px;">
            <h1 data-cms-slot="season_title" data-cms-schema="lookbook-hero-section" style="font-size: 34px; font-weight: 300; margin-bottom: 12px;">{{season_title}}</h1>
            <p data-cms-slot="editorial_note" data-cms-schema="lookbook-hero-section" style="font-size: 15px; color: #71717a; max-width: 580px; margin: 0 auto;">{{editorial_note}}</p>
          </div>
          <div data-cms-repeat="true" data-cms-schema="lookbook-grid-section" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 32px;">
            <div style="background: #ffffff; border: 1px solid #e4e4e7; border-radius: 8px; padding: 28px;">
              <h3 data-cms-slot="style_name" data-cms-schema="lookbook-grid-section" style="font-size: 18px; font-weight: 600; margin: 0 0 6px;">{{style_name}}</h3>
              <p data-cms-slot="photographer" data-cms-schema="lookbook-grid-section" style="font-size: 12px; color: #a1a1aa; margin: 0 0 16px;">{{photographer}}</p>
              <p data-cms-slot="garments_featured" data-cms-schema="lookbook-grid-section" style="font-size: 14px; color: #52525b; line-height: 1.6; margin: 0;">{{garments_featured}}</p>
            </div>
          </div>
        </div>
      `,
      css: '.lookbook-page { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }',
      projectData: null,
    },
  },
  {
    key: 'concierge',
    title: 'Store Locations & Styling Concierge',
    slug: '/concierge',
    description:
      'Flagship boutique addresses, private styling appointments, and bespoke orders',
    badge: 'Concierge',
    schemas: [
      {
        id: 'concierge-info-section',
        name: 'Styling Concierge',
        slug: 'concierge-info-section',
        entryType: 'single',
        fields: [
          { apiId: 'headline', displayName: 'Header Title', dataType: 'text' },
          {
            apiId: 'concierge_email',
            displayName: 'Private Client Email',
            dataType: 'text',
          },
          { apiId: 'phone', displayName: 'Direct Phone', dataType: 'text' },
          {
            apiId: 'flagship_address',
            displayName: 'Boutique Location',
            dataType: 'textarea',
          },
          {
            apiId: 'booking_cta',
            displayName: 'Appointment Button Text',
            dataType: 'text',
          },
        ],
        values: {
          headline: 'Private Client Styling & Atelier Visits',
          concierge_email: 'atelier@acme-boutique.com',
          phone: '+1 (555) 890-2134',
          flagship_address: '420 Mercer Street, SoHo, New York, NY 10013',
          booking_cta: 'Request Private Appointment',
        },
      },
    ],
    body: {
      builder: 'grapesjs',
      html: `
        <div class="concierge-page" style="${BASE_FONT} padding: 72px 24px; max-width: 860px; margin: 0 auto;">
          <section data-cms-schema="concierge-info-section" style="background: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; padding: 48px; text-align: center;">
            <h1 data-cms-slot="headline" data-cms-schema="concierge-info-section" style="font-size: 32px; font-weight: 400; margin: 0 0 24px;">{{headline}}</h1>
            <p style="font-size: 14px; color: #71717a; margin-bottom: 8px;">Direct Atelier Contact:</p>
            <p data-cms-slot="concierge_email" data-cms-schema="concierge-info-section" style="font-size: 16px; font-weight: 600; color: #18181b; margin: 0 0 6px;">{{concierge_email}}</p>
            <p data-cms-slot="phone" data-cms-schema="concierge-info-section" style="font-size: 15px; color: #52525b; margin: 0 0 24px;">{{phone}}</p>
            <p data-cms-slot="flagship_address" data-cms-schema="concierge-info-section" style="font-size: 14px; color: #71717a; max-width: 400px; margin: 0 auto 32px;">{{flagship_address}}</p>
            <a href="mailto:concierge@acme.com" data-cms-slot="booking_cta" data-cms-schema="concierge-info-section" style="display: inline-block; background: #18181b; color: #ffffff; padding: 12px 32px; border-radius: 4px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; text-decoration: none;">{{booking_cta}}</a>
          </section>
        </div>
      `,
      css: '.concierge-page { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }',
      projectData: null,
    },
  },
];

// 4. SAAS & CLOUD SOFTWARE STARTER PAGES
export const SAAS_STARTER_PAGES: StarterPageDefinition[] = [
  {
    key: 'saas_home',
    title: 'Platform Landing',
    slug: '/',
    description:
      'High-conversion software hero, live code demo preview, and real-time metric counter',
    badge: 'Tech Landing',
    schemas: [
      {
        id: 'saas-hero-section',
        name: 'SaaS Hero Banner',
        slug: 'saas-hero-section',
        entryType: 'single',
        fields: [
          {
            apiId: 'headline',
            displayName: 'Product Headline',
            dataType: 'text',
          },
          { apiId: 'tag_label', displayName: 'Release Tag', dataType: 'text' },
          {
            apiId: 'subheading',
            displayName: 'Value Proposition',
            dataType: 'textarea',
          },
          {
            apiId: 'cta_primary',
            displayName: 'Primary CTA',
            dataType: 'text',
          },
          {
            apiId: 'cta_secondary',
            displayName: 'Secondary CTA',
            dataType: 'text',
          },
        ],
        values: {
          headline: 'The Autonomous Headless CMS Built for Modern Scale',
          tag_label: 'V2.4 NOW LIVE WITH VISUAL RUNTIMES',
          subheading:
            'Deliver sub-50ms web pages with dynamic database bindings, cryptographic hardware isolation, and zero-downtime edge distribution.',
          cta_primary: 'Start 14-Day Free Trial',
          cta_secondary: 'View Live Documentation',
        },
      },
      {
        id: 'saas-metrics-section',
        name: 'Key Platform Metrics',
        slug: 'saas-metrics-section',
        entryType: 'multi',
        fields: [
          {
            apiId: 'metric_value',
            displayName: 'Metric Value',
            dataType: 'text',
          },
          {
            apiId: 'metric_label',
            displayName: 'Metric Label',
            dataType: 'text',
          },
        ],
        values: {},
        items: [
          { metric_value: '99.99%', metric_label: 'Guaranteed SLA Uptime' },
          { metric_value: '< 45ms', metric_label: 'Global Edge Cache Latency' },
          {
            metric_value: '10M+',
            metric_label: 'Dynamic Content Requests / Day',
          },
        ],
      },
    ],
    body: {
      builder: 'grapesjs',
      html: `
        <div class="saas-page" style="${BASE_FONT} color: #0f172a; background-color: #ffffff;">
          <section data-cms-schema="saas-hero-section" style="padding: 88px 24px; text-align: center; background: radial-gradient(circle at 50% 0%, #eff6ff 0%, #ffffff 70%); border-bottom: 1px solid #e2e8f0;">
            <div style="max-width: 860px; margin: 0 auto;">
              <span data-cms-slot="tag_label" data-cms-schema="saas-hero-section" style="font-size: 11px; font-weight: 700; color: #2563eb; background: #dbeafe; padding: 4px 14px; border-radius: 9999px; display: inline-block; margin-bottom: 20px;">{{tag_label}}</span>
              <h1 data-cms-slot="headline" data-cms-schema="saas-hero-section" style="font-size: 46px; font-weight: 800; color: #0f172a; line-height: 1.15; letter-spacing: -0.03em; margin: 0 0 20px;">{{headline}}</h1>
              <p data-cms-slot="subheading" data-cms-schema="saas-hero-section" style="font-size: 18px; color: #64748b; line-height: 1.6; max-width: 680px; margin: 0 auto 36px;">{{subheading}}</p>
              <div style="display: flex; justify-content: center; gap: 14px;">
                <a href="/pricing" data-cms-slot="cta_primary" data-cms-schema="saas-hero-section" style="background: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; text-decoration: none;">{{cta_primary}}</a>
                <a href="/features" data-cms-slot="cta_secondary" data-cms-schema="saas-hero-section" style="background: #f1f5f9; color: #334155; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 15px; text-decoration: none;">{{cta_secondary}}</a>
              </div>
            </div>
          </section>

          <section data-cms-schema="saas-metrics-section" style="padding: 56px 24px; max-width: 1040px; margin: 0 auto;">
            <div data-cms-repeat="true" data-cms-schema="saas-metrics-section" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 28px; text-align: center;">
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px;">
                <div data-cms-slot="metric_value" data-cms-schema="saas-metrics-section" style="font-size: 38px; font-weight: 800; color: #2563eb; margin-bottom: 6px;">{{metric_value}}</div>
                <div data-cms-slot="metric_label" data-cms-schema="saas-metrics-section" style="font-size: 14px; font-weight: 600; color: #64748b;">{{metric_label}}</div>
              </div>
            </div>
          </section>
        </div>
      `,
      css: '.saas-page { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }',
      projectData: null,
    },
  },
  {
    key: 'pricing',
    title: 'Pricing & Plans Matrix',
    slug: '/pricing',
    description:
      'Tiered subscription table (Free, Pro, Enterprise) with feature checkmarks and billing toggle',
    badge: 'Plans & Pricing',
    schemas: [
      {
        id: 'pricing-header-section',
        name: 'Pricing Header',
        slug: 'pricing-header-section',
        entryType: 'single',
        fields: [
          {
            apiId: 'headline',
            displayName: 'Header Headline',
            dataType: 'text',
          },
          {
            apiId: 'subheading',
            displayName: 'Header Subtitle',
            dataType: 'textarea',
          },
        ],
        values: {
          headline: 'Simple, Predictable Cloud Pricing',
          subheading:
            'No surprise bandwidth overages. Scale seamlessly from early prototypes to enterprise workloads.',
        },
      },
      {
        id: 'pricing-plans-section',
        name: 'Subscription Plans',
        slug: 'pricing-plans-section',
        entryType: 'multi',
        fields: [
          { apiId: 'plan_name', displayName: 'Plan Name', dataType: 'text' },
          {
            apiId: 'monthly_price',
            displayName: 'Monthly Price ($)',
            dataType: 'text',
          },
          { apiId: 'badge_tag', displayName: 'Tag / Badge', dataType: 'text' },
          {
            apiId: 'plan_description',
            displayName: 'Audience / Description',
            dataType: 'textarea',
          },
          {
            apiId: 'cta_text',
            displayName: 'CTA Button Text',
            dataType: 'text',
          },
        ],
        values: {},
        items: [
          {
            plan_name: 'Developer Starter',
            monthly_price: '$0',
            badge_tag: 'Free Forever',
            plan_description:
              'Up to 3 websites, 10k page views/mo, community support.',
            cta_text: 'Get Started Free',
          },
          {
            plan_name: 'Team Pro',
            monthly_price: '$49',
            badge_tag: 'Most Popular',
            plan_description:
              'Unlimited websites, 1M edge requests, dynamic schemas, and priority SLA.',
            cta_text: 'Upgrade to Pro',
          },
          {
            plan_name: 'Enterprise Scale',
            monthly_price: '$299',
            badge_tag: 'Custom SLA',
            plan_description:
              'Dedicated edge clusters, SOC-2 compliance review, custom MFA, and 99.99% uptime.',
            cta_text: 'Contact Sales',
          },
        ],
      },
    ],
    body: {
      builder: 'grapesjs',
      html: `
        <div class="pricing-page" style="${BASE_FONT} padding: 72px 24px; max-width: 1120px; margin: 0 auto;">
          <div data-cms-schema="pricing-header-section" style="text-align: center; margin-bottom: 56px;">
            <h1 data-cms-slot="headline" data-cms-schema="pricing-header-section" style="font-size: 38px; font-weight: 800; color: #0f172a; margin-bottom: 12px;">{{headline}}</h1>
            <p data-cms-slot="subheading" data-cms-schema="pricing-header-section" style="font-size: 16px; color: #64748b; max-width: 580px; margin: 0 auto;">{{subheading}}</p>
          </div>
          <div data-cms-repeat="true" data-cms-schema="pricing-plans-section" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 28px;">
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 36px; display: flex; flex-direction: column; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03);">
              <span data-cms-slot="badge_tag" data-cms-schema="pricing-plans-section" style="font-size: 11px; font-weight: 700; color: #2563eb; background: #eff6ff; padding: 4px 10px; border-radius: 4px; align-self: flex-start; margin-bottom: 14px;">{{badge_tag}}</span>
              <h3 data-cms-slot="plan_name" data-cms-schema="pricing-plans-section" style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 6px;">{{plan_name}}</h3>
              <div style="margin: 16px 0 20px;">
                <span data-cms-slot="monthly_price" data-cms-schema="pricing-plans-section" style="font-size: 38px; font-weight: 800; color: #0f172a;">{{monthly_price}}</span>
                <span style="font-size: 14px; color: #64748b;"> / month</span>
              </div>
              <p data-cms-slot="plan_description" data-cms-schema="pricing-plans-section" style="font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 28px; flex: 1;">{{plan_description}}</p>
              <a href="/contact" data-cms-slot="cta_text" data-cms-schema="pricing-plans-section" style="background: #2563eb; color: #ffffff; padding: 12px; border-radius: 8px; font-weight: 600; font-size: 14px; text-align: center; text-decoration: none;">{{cta_text}}</a>
            </div>
          </div>
        </div>
      `,
      css: '.pricing-page { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }',
      projectData: null,
    },
  },
  {
    key: 'features',
    title: 'Product Features & Integrations',
    slug: '/features',
    description:
      'Deep dive into cloud capabilities, distributed edge caching, and REST/GraphQL APIs',
    badge: 'Features',
    schemas: [
      {
        id: 'features-overview-section',
        name: 'Features Overview',
        slug: 'features-overview-section',
        entryType: 'single',
        fields: [
          { apiId: 'headline', displayName: 'Header Title', dataType: 'text' },
          {
            apiId: 'subheading',
            displayName: 'Subtitle',
            dataType: 'textarea',
          },
        ],
        values: {
          headline: 'Engineered for Developers. Loved by Creators.',
          subheading:
            'A headless architecture that eliminates content silos without compromising visual drag-and-drop velocity.',
        },
      },
      {
        id: 'saas-features-grid',
        name: 'Features Highlights',
        slug: 'saas-features-grid',
        entryType: 'multi',
        fields: [
          {
            apiId: 'feature_title',
            displayName: 'Feature Name',
            dataType: 'text',
          },
          {
            apiId: 'feature_category',
            displayName: 'Category Pillar',
            dataType: 'text',
          },
          {
            apiId: 'feature_desc',
            displayName: 'Technical Detail',
            dataType: 'textarea',
          },
        ],
        values: {},
        items: [
          {
            feature_title: 'Instant Edge Hydration',
            feature_category: 'Performance',
            feature_desc:
              'Compiled HTML and dynamic JSON fields are distributed to 300+ CDN edge points in under 1 second.',
          },
          {
            feature_title: 'Granular RBAC & MFA Controls',
            feature_category: 'Security',
            feature_desc:
              'FIDO2 WebAuthn authentication, session revocation, and permission trees for enterprise governance.',
          },
          {
            feature_title: 'Schema-to-Component Binding',
            feature_category: 'Developer Velocity',
            feature_desc:
              'Declare typed database schemas in JSON and automatically expose them inside visual GrapesJS canvases.',
          },
        ],
      },
    ],
    body: {
      builder: 'grapesjs',
      html: `
        <div class="features-page" style="${BASE_FONT} padding: 72px 24px; max-width: 1100px; margin: 0 auto;">
          <div data-cms-schema="features-overview-section" style="text-align: center; margin-bottom: 56px;">
            <h1 data-cms-slot="headline" data-cms-schema="features-overview-section" style="font-size: 38px; font-weight: 800; color: #0f172a; margin-bottom: 12px;">{{headline}}</h1>
            <p data-cms-slot="subheading" data-cms-schema="features-overview-section" style="font-size: 16px; color: #64748b; max-width: 600px; margin: 0 auto;">{{subheading}}</p>
          </div>
          <div data-cms-repeat="true" data-cms-schema="saas-features-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(310px, 1fr)); gap: 28px;">
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 28px;">
              <span data-cms-slot="feature_category" data-cms-schema="saas-features-grid" style="font-size: 11px; font-weight: 700; color: #2563eb; text-transform: uppercase;">{{feature_category}}</span>
              <h3 data-cms-slot="feature_title" data-cms-schema="saas-features-grid" style="font-size: 19px; font-weight: 700; color: #0f172a; margin: 8px 0 12px;">{{feature_title}}</h3>
              <p data-cms-slot="feature_desc" data-cms-schema="saas-features-grid" style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0;">{{feature_desc}}</p>
            </div>
          </div>
        </div>
      `,
      css: '.features-page { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }',
      projectData: null,
    },
  },
  {
    key: 'security',
    title: 'Trust, Security & Compliance',
    slug: '/security',
    description:
      'SOC-2 Type II certifications, hardware MFA, cryptographic isolation, and uptime SLA',
    badge: 'Trust & Sec',
    schemas: [
      {
        id: 'compliance-overview-section',
        name: 'Trust & Compliance',
        slug: 'compliance-overview-section',
        entryType: 'single',
        fields: [
          {
            apiId: 'headline',
            displayName: 'Security Headline',
            dataType: 'text',
          },
          {
            apiId: 'certification_badge',
            displayName: 'Certification Level',
            dataType: 'text',
          },
          {
            apiId: 'audit_date',
            displayName: 'Last Audit Date',
            dataType: 'text',
          },
          {
            apiId: 'uptime_guarantee',
            displayName: 'SLA Guarantee',
            dataType: 'text',
          },
          {
            apiId: 'security_contact',
            displayName: 'Security Team Contact',
            dataType: 'text',
          },
        ],
        values: {
          headline: 'Enterprise Security by Default',
          certification_badge: 'SOC-2 Type II & ISO 27001 Certified',
          audit_date: 'Audited November 2025 by Independent Firm',
          uptime_guarantee: '99.99% Edge Availability Guarantee',
          security_contact: 'security@acme-platform.com',
        },
      },
    ],
    body: {
      builder: 'grapesjs',
      html: `
        <div class="security-page" style="${BASE_FONT} padding: 72px 24px; max-width: 860px; margin: 0 auto;">
          <section data-cms-schema="compliance-overview-section" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 48px; text-align: center;">
            <span data-cms-slot="certification_badge" data-cms-schema="compliance-overview-section" style="font-size: 12px; font-weight: 700; color: #059669; background: #d1fae5; padding: 4px 14px; border-radius: 9999px; display: inline-block; margin-bottom: 20px;">{{certification_badge}}</span>
            <h1 data-cms-slot="headline" data-cms-schema="compliance-overview-section" style="font-size: 36px; font-weight: 800; color: #0f172a; margin: 0 0 16px;">{{headline}}</h1>
            <p data-cms-slot="audit_date" data-cms-schema="compliance-overview-section" style="font-size: 15px; color: #64748b; margin: 0 0 24px;">{{audit_date}}</p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 28px;">
              <span style="font-size: 13px; font-weight: 600; color: #0f172a; display: block; margin-bottom: 4px;">Uptime Commitment:</span>
              <span data-cms-slot="uptime_guarantee" data-cms-schema="compliance-overview-section" style="font-size: 20px; font-weight: 800; color: #2563eb;">{{uptime_guarantee}}</span>
            </div>
            <p style="font-size: 13px; color: #94a3b8;">For vulnerability reports or penetration test summaries, email <strong data-cms-slot="security_contact" data-cms-schema="compliance-overview-section" style="color: #0f172a;">{{security_contact}}</strong></p>
          </section>
        </div>
      `,
      css: '.security-page { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }',
      projectData: null,
    },
  },
];

// 5. DIGITAL AGENCY & CREATIVE PORTFOLIO STARTER PAGES
export const PORTFOLIO_STARTER_PAGES: StarterPageDefinition[] = [
  {
    key: 'portfolio_home',
    title: 'Studio Homepage',
    slug: '/',
    description:
      'Hero statement, featured marquee, and studio creative philosophy',
    badge: 'Agency Home',
    schemas: [
      {
        id: 'agency-hero-section',
        name: 'Agency Studio Manifesto',
        slug: 'agency-hero-section',
        entryType: 'single',
        fields: [
          {
            apiId: 'manifesto',
            displayName: 'Main Manifesto',
            dataType: 'text',
          },
          {
            apiId: 'studio_discipline',
            displayName: 'Practice Subtitle',
            dataType: 'textarea',
          },
          {
            apiId: 'reel_label',
            displayName: 'Showreel Link Text',
            dataType: 'text',
          },
        ],
        values: {
          manifesto:
            'We Craft Distinct Visual Identities for Ambitious Brands.',
          studio_discipline:
            'A strategic design and technology studio based in London and Tokyo. Bridging culture, aesthetics, and digital craft.',
          reel_label: 'Watch 2026 Showreel (1:45)',
        },
      },
      {
        id: 'featured-clients-section',
        name: 'Client Marquee',
        slug: 'featured-clients-section',
        entryType: 'multi',
        fields: [
          {
            apiId: 'client_name',
            displayName: 'Client Name',
            dataType: 'text',
          },
          { apiId: 'industry', displayName: 'Industry', dataType: 'text' },
          {
            apiId: 'project_type',
            displayName: 'Discipline',
            dataType: 'text',
          },
        ],
        values: {},
        items: [
          {
            client_name: 'Kroma Audio Labs',
            industry: 'Acoustics & Hardware',
            project_type: 'Brand & E-Commerce',
          },
          {
            client_name: 'Solara Capital',
            industry: 'Fintech & Venture',
            project_type: 'Digital Platform',
          },
          {
            client_name: 'Maison Verre',
            industry: 'Luxury Fragrance',
            project_type: 'Art Direction',
          },
        ],
      },
    ],
    body: {
      builder: 'grapesjs',
      html: `
        <div class="agency-page" style="${BASE_FONT} color: #09090b; background-color: #fdfdfd; padding: 88px 24px; max-width: 1100px; margin: 0 auto;">
          <section data-cms-schema="agency-hero-section" style="margin-bottom: 72px;">
            <h1 data-cms-slot="manifesto" data-cms-schema="agency-hero-section" style="font-size: 52px; font-weight: 300; letter-spacing: -0.03em; line-height: 1.15; color: #09090b; margin: 0 0 24px;">{{manifesto}}</h1>
            <p data-cms-slot="studio_discipline" data-cms-schema="agency-hero-section" style="font-size: 18px; color: #71717a; line-height: 1.7; max-width: 680px; margin: 0 0 32px;">{{studio_discipline}}</p>
            <a href="/work" data-cms-slot="reel_label" data-cms-schema="agency-hero-section" style="display: inline-block; border-bottom: 2px solid #09090b; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #09090b; text-decoration: none; padding-bottom: 4px;">{{reel_label}}</a>
          </section>

          <section data-cms-schema="featured-clients-section" style="border-top: 1px solid #e4e4e7; padding-top: 56px;">
            <h2 style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #a1a1aa; margin-bottom: 32px;">Select Engagements</h2>
            <div data-cms-repeat="true" data-cms-schema="featured-clients-section" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px;">
              <div style="background: #ffffff; border: 1px solid #f4f4f5; padding: 24px; border-radius: 6px;">
                <h3 data-cms-slot="client_name" data-cms-schema="featured-clients-section" style="font-size: 20px; font-weight: 600; margin: 0 0 6px;">{{client_name}}</h3>
                <span data-cms-slot="industry" data-cms-schema="featured-clients-section" style="font-size: 12px; color: #71717a; display: block; margin-bottom: 4px;">{{industry}}</span>
                <span data-cms-slot="project_type" data-cms-schema="featured-clients-section" style="font-size: 11px; font-weight: 700; color: #09090b; text-transform: uppercase;">{{project_type}}</span>
              </div>
            </div>
          </section>
        </div>
      `,
      css: '.agency-page { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }',
      projectData: null,
    },
  },
  {
    key: 'work',
    title: 'Selected Work & Case Studies',
    slug: '/work',
    description:
      'Filterable client case studies, deliverables, and impact metrics',
    badge: 'Case Studies',
    schemas: [
      {
        id: 'case-studies-grid',
        name: 'Case Studies',
        slug: 'case-studies-grid',
        entryType: 'multi',
        fields: [
          {
            apiId: 'project_name',
            displayName: 'Project Title',
            dataType: 'text',
          },
          { apiId: 'client', displayName: 'Client', dataType: 'text' },
          {
            apiId: 'impact_metric',
            displayName: 'Outcome / Metric',
            dataType: 'text',
          },
          { apiId: 'year', displayName: 'Year', dataType: 'text' },
        ],
        values: {},
        items: [
          {
            project_name: 'Next-Gen Acoustic Hardware Storefront',
            client: 'Kroma Audio',
            impact_metric: '+140% D2C Conversion Lift',
            year: '2025',
          },
          {
            project_name: 'Venture Capital Brand Elevation & Web System',
            client: 'Solara Capital',
            impact_metric: '$850M Fund Raised',
            year: '2025',
          },
        ],
      },
    ],
    body: {
      builder: 'grapesjs',
      html: `
        <div class="work-page" style="${BASE_FONT} padding: 72px 24px; max-width: 1040px; margin: 0 auto;">
          <h1 style="font-size: 40px; font-weight: 300; margin-bottom: 48px;">Case Studies</h1>
          <div data-cms-repeat="true" data-cms-schema="case-studies-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 32px;">
            <div style="background: #ffffff; border: 1px solid #e4e4e7; border-radius: 8px; padding: 32px;">
              <span data-cms-slot="year" data-cms-schema="case-studies-grid" style="font-size: 11px; font-weight: 700; color: #a1a1aa;">{{year}}</span>
              <h3 data-cms-slot="project_name" data-cms-schema="case-studies-grid" style="font-size: 22px; font-weight: 600; margin: 8px 0;">{{project_name}}</h3>
              <p data-cms-slot="client" data-cms-schema="case-studies-grid" style="font-size: 14px; color: #71717a; margin-bottom: 16px;">{{client}}</p>
              <div style="padding: 10px 14px; background: #f4f4f5; border-radius: 6px;">
                <span data-cms-slot="impact_metric" data-cms-schema="case-studies-grid" style="font-size: 13px; font-weight: 700; color: #09090b;">{{impact_metric}}</span>
              </div>
            </div>
          </div>
        </div>
      `,
      css: '.work-page { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }',
      projectData: null,
    },
  },
  {
    key: 'capabilities',
    title: 'Capabilities & Studio Practice',
    slug: '/capabilities',
    description:
      'Brand strategy, UI/UX systems, custom engineering, and creative direction',
    badge: 'Practice',
    schemas: [
      {
        id: 'services-pillars-section',
        name: 'Capabilities Pillars',
        slug: 'services-pillars-section',
        entryType: 'multi',
        fields: [
          {
            apiId: 'discipline_title',
            displayName: 'Pillar Name',
            dataType: 'text',
          },
          {
            apiId: 'discipline_desc',
            displayName: 'Discipline Summary',
            dataType: 'textarea',
          },
          {
            apiId: 'deliverables_list',
            displayName: 'Deliverables',
            dataType: 'textarea',
          },
        ],
        values: {},
        items: [
          {
            discipline_title: 'Brand Architecture & Design Systems',
            discipline_desc:
              'Comprehensive visual systems that adapt seamlessly from digital interfaces to physical installations.',
            deliverables_list:
              'Design Tokens, Typography Hierarchy, Figma System, Component Specs',
          },
          {
            discipline_title: 'Headless Engineering & Dynamic Runtimes',
            discipline_desc:
              'Full-stack distributed frontend architecture built on Next.js, Vite, and GraphQL/REST pipelines.',
            deliverables_list:
              'Edge Deployment, CDN Caching, Headless CMS Integration, Zero Downtime Rollouts',
          },
        ],
      },
    ],
    body: {
      builder: 'grapesjs',
      html: `
        <div class="capabilities-page" style="${BASE_FONT} padding: 72px 24px; max-width: 1040px; margin: 0 auto;">
          <h1 style="font-size: 38px; font-weight: 300; margin-bottom: 48px;">Capabilities</h1>
          <div data-cms-repeat="true" data-cms-schema="services-pillars-section" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 32px;">
            <div style="background: #ffffff; border: 1px solid #e4e4e7; border-radius: 8px; padding: 32px;">
              <h3 data-cms-slot="discipline_title" data-cms-schema="services-pillars-section" style="font-size: 20px; font-weight: 600; margin: 0 0 12px;">{{discipline_title}}</h3>
              <p data-cms-slot="discipline_desc" data-cms-schema="services-pillars-section" style="font-size: 14px; color: #71717a; line-height: 1.6; margin-bottom: 20px;">{{discipline_desc}}</p>
              <div style="padding-top: 14px; border-top: 1px solid #f4f4f5;">
                <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #a1a1aa; display: block; margin-bottom: 4px;">Deliverables</span>
                <span data-cms-slot="deliverables_list" data-cms-schema="services-pillars-section" style="font-size: 13px; color: #09090b;">{{deliverables_list}}</span>
              </div>
            </div>
          </div>
        </div>
      `,
      css: '.capabilities-page { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }',
      projectData: null,
    },
  },
  {
    key: 'project_inquiry',
    title: 'Start a Project / Inquiries',
    slug: '/contact',
    description:
      'Client briefing intake, budget ranges, and project timeline scheduler',
    badge: 'Project Brief',
    schemas: [
      {
        id: 'brief-intake-section',
        name: 'Inquiry Intake',
        slug: 'brief-intake-section',
        entryType: 'single',
        fields: [
          { apiId: 'headline', displayName: 'Header Title', dataType: 'text' },
          {
            apiId: 'studio_lead_email',
            displayName: 'Partner Email',
            dataType: 'text',
          },
          {
            apiId: 'studio_location',
            displayName: 'Locations',
            dataType: 'text',
          },
          {
            apiId: 'inquiry_intro',
            displayName: 'Briefing Note',
            dataType: 'textarea',
          },
        ],
        values: {
          headline: 'Let us build something exceptional together.',
          studio_lead_email: 'hello@vanguard-studio.com',
          studio_location: 'London / Tokyo / New York',
          inquiry_intro:
            'We partner with a maximum of 4 clients per quarter to ensure uncompromising craft and focus.',
        },
      },
    ],
    body: {
      builder: 'grapesjs',
      html: `
        <div class="inquiry-page" style="${BASE_FONT} padding: 72px 24px; max-width: 860px; margin: 0 auto;">
          <section data-cms-schema="brief-intake-section" style="background: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; padding: 48px; text-align: center;">
            <h1 data-cms-slot="headline" data-cms-schema="brief-intake-section" style="font-size: 34px; font-weight: 300; margin: 0 0 16px;">{{headline}}</h1>
            <p data-cms-slot="inquiry_intro" data-cms-schema="brief-intake-section" style="font-size: 15px; color: #71717a; max-width: 540px; margin: 0 auto 28px;">{{inquiry_intro}}</p>
            <p style="font-size: 13px; color: #a1a1aa; margin-bottom: 6px;">Direct Studio Inquiries:</p>
            <p data-cms-slot="studio_lead_email" data-cms-schema="brief-intake-section" style="font-size: 18px; font-weight: 700; color: #09090b; margin: 0 0 8px;">{{studio_lead_email}}</p>
            <p data-cms-slot="studio_location" data-cms-schema="brief-intake-section" style="font-size: 13px; color: #71717a;">{{studio_location}}</p>
          </section>
        </div>
      `,
      css: '.inquiry-page { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }',
      projectData: null,
    },
  },
];

// 6. MODERN EDITORIAL & DIGITAL MAGAZINE STARTER PAGES
export const EDITORIAL_STARTER_PAGES: StarterPageDefinition[] = [
  {
    key: 'editorial_home',
    title: 'Publication Frontpage',
    slug: '/',
    description:
      'Lead breaking headline, featured editorial column, and curated reading list',
    badge: 'Frontpage',
    schemas: [
      {
        id: 'lead-story-section',
        name: 'Lead Journalistic Story',
        slug: 'lead-story-section',
        entryType: 'single',
        fields: [
          {
            apiId: 'lead_headline',
            displayName: 'Lead Headline',
            dataType: 'text',
          },
          {
            apiId: 'kicker_tag',
            displayName: 'Topic Kicker',
            dataType: 'text',
          },
          {
            apiId: 'lead_summary',
            displayName: 'Story Excerpt',
            dataType: 'textarea',
          },
          {
            apiId: 'author_byline',
            displayName: 'Author / Byline',
            dataType: 'text',
          },
          { apiId: 'read_time', displayName: 'Reading Time', dataType: 'text' },
        ],
        values: {
          lead_headline:
            'The Post-Industrial Software Paradigm: Autonomous Systems and the Next Decade of Human Labor',
          kicker_tag: 'SPECIAL REPORT • TECHNOLOGY',
          lead_summary:
            'An investigative examination of autonomous agent orchestrations across global infrastructure.',
          author_byline: 'By Dr. Julian Thorne',
          read_time: '12 min read',
        },
      },
      {
        id: 'curated-dispatch-section',
        name: 'Frontpage Dispatches',
        slug: 'curated-dispatch-section',
        entryType: 'multi',
        fields: [
          {
            apiId: 'article_title',
            displayName: 'Story Title',
            dataType: 'text',
          },
          { apiId: 'category_tag', displayName: 'Topic', dataType: 'text' },
          { apiId: 'author', displayName: 'Contributor', dataType: 'text' },
          {
            apiId: 'summary',
            displayName: 'Short Summary',
            dataType: 'textarea',
          },
        ],
        values: {},
        items: [
          {
            article_title:
              'Cryptographic Provenance and the Fight Against Synthesized Media',
            category_tag: 'Security & Law',
            author: 'Mara Vance',
            summary:
              'Hardware-verified signing algorithms are emerging as the international legal standard.',
          },
          {
            article_title: 'Architecture in the Age of High-Density Microgrids',
            category_tag: 'Design & Urbanism',
            author: 'Kenji Sato',
            summary:
              'How European capitals are redesigning residential zoning around decentralized storage.',
          },
        ],
      },
    ],
    body: {
      builder: 'grapesjs',
      html: `
        <div class="editorial-page" style="${BASE_FONT} padding: 72px 24px; max-width: 1040px; margin: 0 auto; color: #1c1917;">
          <section data-cms-schema="lead-story-section" style="border-bottom: 2px solid #1c1917; padding-bottom: 48px; margin-bottom: 48px;">
            <span data-cms-slot="kicker_tag" data-cms-schema="lead-story-section" style="font-size: 11px; font-weight: 800; letter-spacing: 0.1em; color: #b91c1c; text-transform: uppercase;">{{kicker_tag}}</span>
            <h1 data-cms-slot="lead_headline" data-cms-schema="lead-story-section" style="font-size: 42px; font-weight: 800; line-height: 1.2; margin: 12px 0 16px;">{{lead_headline}}</h1>
            <p data-cms-slot="lead_summary" data-cms-schema="lead-story-section" style="font-size: 18px; color: #57534e; line-height: 1.6; margin-bottom: 20px;">{{lead_summary}}</p>
            <div style="font-size: 13px; color: #78716c;">
              <span data-cms-slot="author_byline" data-cms-schema="lead-story-section" style="font-weight: 600; color: #1c1917;">{{author_byline}}</span> • <span data-cms-slot="read_time" data-cms-schema="lead-story-section">{{read_time}}</span>
            </div>
          </section>

          <section data-cms-schema="curated-dispatch-section">
            <h2 style="font-size: 14px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 28px;">Dispatches & Columns</h2>
            <div data-cms-repeat="true" data-cms-schema="curated-dispatch-section" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 32px;">
              <div style="border-top: 1px solid #e7e5e4; padding-top: 20px;">
                <span data-cms-slot="category_tag" data-cms-schema="curated-dispatch-section" style="font-size: 10px; font-weight: 700; color: #78716c; text-transform: uppercase;">{{category_tag}}</span>
                <h3 data-cms-slot="article_title" data-cms-schema="curated-dispatch-section" style="font-size: 20px; font-weight: 700; margin: 8px 0;">{{article_title}}</h3>
                <p data-cms-slot="summary" data-cms-schema="curated-dispatch-section" style="font-size: 14px; color: #57534e; line-height: 1.6; margin-bottom: 12px;">{{summary}}</p>
                <span data-cms-slot="author" data-cms-schema="curated-dispatch-section" style="font-size: 12px; font-weight: 600; color: #1c1917;">{{author}}</span>
              </div>
            </div>
          </section>
        </div>
      `,
      css: '.editorial-page { font-family: Georgia, Cambria, "Times New Roman", Times, serif; }',
      projectData: null,
    },
  },
  {
    key: 'stories',
    title: 'Trending Stories & Longreads',
    slug: '/stories',
    description:
      'In-depth essays, investigations, and multi-part journalistic series',
    badge: 'Longreads',
    schemas: [
      {
        id: 'stories-catalog-section',
        name: 'Stories Catalog',
        slug: 'stories-catalog-section',
        entryType: 'multi',
        fields: [
          {
            apiId: 'story_title',
            displayName: 'Story Title',
            dataType: 'text',
          },
          { apiId: 'topic_kicker', displayName: 'Topic', dataType: 'text' },
          {
            apiId: 'read_time_minutes',
            displayName: 'Reading Time',
            dataType: 'text',
          },
          { apiId: 'author_name', displayName: 'Author', dataType: 'text' },
        ],
        values: {},
        items: [
          {
            story_title:
              'Silicon and Silt: The Geopolitics of Deep-Sea Sensor Cabling',
            topic_kicker: 'INFRASTRUCTURE',
            read_time_minutes: '15 min',
            author_name: 'Dr. Julian Thorne',
          },
          {
            story_title:
              'The Great Decoupling: Modern Frameworks and Edge Storage',
            topic_kicker: 'ENGINEERING',
            read_time_minutes: '9 min',
            author_name: 'Mara Vance',
          },
        ],
      },
    ],
    body: {
      builder: 'grapesjs',
      html: `
        <div class="stories-page" style="${BASE_FONT} padding: 72px 24px; max-width: 960px; margin: 0 auto;">
          <h1 style="font-size: 36px; font-weight: 800; margin-bottom: 36px;">Trending Longreads</h1>
          <div data-cms-repeat="true" data-cms-schema="stories-catalog-section" style="display: flex; flex-direction: column; gap: 24px;">
            <div style="border-bottom: 1px solid #e7e5e4; padding-bottom: 24px;">
              <span data-cms-slot="topic_kicker" data-cms-schema="stories-catalog-section" style="font-size: 11px; font-weight: 700; color: #b91c1c;">{{topic_kicker}}</span>
              <h3 data-cms-slot="story_title" data-cms-schema="stories-catalog-section" style="font-size: 22px; font-weight: 700; margin: 6px 0;">{{story_title}}</h3>
              <div style="font-size: 13px; color: #78716c;">
                <span data-cms-slot="author_name" data-cms-schema="stories-catalog-section" style="font-weight: 600; color: #1c1917;">{{author_name}}</span> • <span data-cms-slot="read_time_minutes" data-cms-schema="stories-catalog-section">{{read_time_minutes}}</span>
              </div>
            </div>
          </div>
        </div>
      `,
      css: '.stories-page { font-family: Georgia, serif; }',
      projectData: null,
    },
  },
  {
    key: 'authors',
    title: 'Editorial Columns & Authors',
    slug: '/authors',
    description:
      'Staff editors, guest columnists, contributor profiles, and beats',
    badge: 'Masthead',
    schemas: [
      {
        id: 'masthead-section',
        name: 'Masthead Authors',
        slug: 'masthead-section',
        entryType: 'multi',
        fields: [
          {
            apiId: 'editor_name',
            displayName: 'Writer Name',
            dataType: 'text',
          },
          {
            apiId: 'role_title',
            displayName: 'Editorial Title',
            dataType: 'text',
          },
          { apiId: 'beat', displayName: 'Subject Beat', dataType: 'text' },
          {
            apiId: 'author_bio',
            displayName: 'Short Bio',
            dataType: 'textarea',
          },
        ],
        values: {},
        items: [
          {
            editor_name: 'Dr. Julian Thorne',
            role_title: 'Senior Editor',
            beat: 'Technology & Policy',
            author_bio:
              'Covers decentralized network topology and algorithmic governance.',
          },
          {
            editor_name: 'Mara Vance',
            role_title: 'Staff Writer',
            beat: 'Security & Economics',
            author_bio:
              'Investigates cryptographic standards and global infrastructure.',
          },
        ],
      },
    ],
    body: {
      builder: 'grapesjs',
      html: `
        <div class="masthead-page" style="${BASE_FONT} padding: 72px 24px; max-width: 960px; margin: 0 auto;">
          <h1 style="font-size: 34px; font-weight: 800; margin-bottom: 40px;">Editorial Masthead</h1>
          <div data-cms-repeat="true" data-cms-schema="masthead-section" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 28px;">
            <div style="background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 8px; padding: 24px;">
              <h3 data-cms-slot="editor_name" data-cms-schema="masthead-section" style="font-size: 19px; font-weight: 700; margin: 0 0 4px;">{{editor_name}}</h3>
              <span data-cms-slot="role_title" data-cms-schema="masthead-section" style="font-size: 12px; font-weight: 600; color: #b91c1c; display: block;">{{role_title}}</span>
              <span data-cms-slot="beat" data-cms-schema="masthead-section" style="font-size: 11px; color: #78716c; display: block; margin-bottom: 12px;">Beat: {{beat}}</span>
              <p data-cms-slot="author_bio" data-cms-schema="masthead-section" style="font-size: 13px; color: #57534e; line-height: 1.6; margin: 0;">{{author_bio}}</p>
            </div>
          </div>
        </div>
      `,
      css: '.masthead-page { font-family: Georgia, serif; }',
      projectData: null,
    },
  },
  {
    key: 'newsletter',
    title: 'Newsletter & Print Editions',
    slug: '/newsletter',
    description: 'Daily digest sign-up, subscriber archive, and digital issues',
    badge: 'Circulation',
    schemas: [
      {
        id: 'newsletter-signup-section',
        name: 'Newsletter Circulation',
        slug: 'newsletter-signup-section',
        entryType: 'single',
        fields: [
          { apiId: 'headline', displayName: 'Header', dataType: 'text' },
          {
            apiId: 'publication_freq',
            displayName: 'Frequency',
            dataType: 'text',
          },
          {
            apiId: 'subscriber_count',
            displayName: 'Audience Number',
            dataType: 'text',
          },
          {
            apiId: 'digest_tagline',
            displayName: 'Pitch Note',
            dataType: 'textarea',
          },
        ],
        values: {
          headline: 'The Morning Dispatch',
          publication_freq: 'Delivered weekdays at 6:00 AM UTC',
          subscriber_count:
            'Read by 45,000+ engineers, founders, and policy leaders',
          digest_tagline:
            'Curated investigative journalism and independent technical essays directly in your inbox.',
        },
      },
    ],
    body: {
      builder: 'grapesjs',
      html: `
        <div class="newsletter-page" style="${BASE_FONT} padding: 72px 24px; max-width: 800px; margin: 0 auto; text-align: center;">
          <section data-cms-schema="newsletter-signup-section" style="border: 2px solid #1c1917; border-radius: 8px; padding: 48px;">
            <span data-cms-slot="publication_freq" data-cms-schema="newsletter-signup-section" style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #b91c1c;">{{publication_freq}}</span>
            <h1 data-cms-slot="headline" data-cms-schema="newsletter-signup-section" style="font-size: 36px; font-weight: 800; margin: 12px 0 16px;">{{headline}}</h1>
            <p data-cms-slot="digest_tagline" data-cms-schema="newsletter-signup-section" style="font-size: 16px; color: #57534e; margin-bottom: 24px;">{{digest_tagline}}</p>
            <p data-cms-slot="subscriber_count" data-cms-schema="newsletter-signup-section" style="font-size: 13px; font-weight: 600; color: #78716c; margin-bottom: 28px;">{{subscriber_count}}</p>
            <div style="display: flex; gap: 8px; max-width: 440px; margin: 0 auto;">
              <input placeholder="Enter your email address" style="flex: 1; padding: 10px 14px; border: 1px solid #a8a29e; border-radius: 4px;" />
              <button style="background: #1c1917; color: #fff; border: none; padding: 10px 20px; font-weight: 600; border-radius: 4px; cursor: pointer;">Subscribe</button>
            </div>
          </section>
        </div>
      `,
      css: '.newsletter-page { font-family: Georgia, serif; }',
      projectData: null,
    },
  },
];

// 7. LUXURY REAL ESTATE STARTER PAGES
export const REALESTATE_STARTER_PAGES: StarterPageDefinition[] = [
  {
    key: 'realestate_home',
    title: 'Luxury Residences Homepage',
    slug: '/',
    description:
      'Architectural hero, premier luxury estates, and VIP advisory services',
    badge: 'Estate Showcase',
    schemas: [
      {
        id: 'estate-hero-section',
        name: 'Estate Showcase Hero',
        slug: 'estate-hero-section',
        entryType: 'single',
        fields: [
          {
            apiId: 'hero_title',
            displayName: 'Market Headline',
            dataType: 'text',
          },
          {
            apiId: 'market_subtitle',
            displayName: 'Location & Specialty',
            dataType: 'textarea',
          },
          {
            apiId: 'exclusive_badge',
            displayName: 'Exclusivity Tag',
            dataType: 'text',
          },
          {
            apiId: 'consultation_cta',
            displayName: 'Advisory CTA',
            dataType: 'text',
          },
        ],
        values: {
          hero_title: 'Architectural Masterpieces & Waterfront Sanctuaries',
          market_subtitle:
            'Representing rare residential real estate across coastal California, Aspen, and the French Riviera.',
          exclusive_badge: 'PRIVATE CLIENT BROKERAGE',
          consultation_cta: 'Explore Curated Portfolio',
        },
      },
      {
        id: 'premier-listings-section',
        name: 'Featured Residences',
        slug: 'premier-listings-section',
        entryType: 'multi',
        fields: [
          {
            apiId: 'residence_name',
            displayName: 'Estate Name',
            dataType: 'text',
          },
          {
            apiId: 'price_display',
            displayName: 'Asking Price ($)',
            dataType: 'text',
          },
          {
            apiId: 'bed_bath_sqft',
            displayName: 'Specs (Beds / Baths / SqFt)',
            dataType: 'text',
          },
          {
            apiId: 'neighborhood',
            displayName: 'City & Enclave',
            dataType: 'text',
          },
        ],
        values: {},
        items: [
          {
            residence_name: 'The Promontory Modernist Villa',
            price_display: '$14,500,000',
            bed_bath_sqft: '5 Beds • 7 Baths • 8,400 Sq Ft',
            neighborhood: 'Beverly Hills Post Office, CA',
          },
          {
            residence_name: 'Oceanside Cantilever Pavilion',
            price_display: '$21,000,000',
            bed_bath_sqft: '6 Beds • 8 Baths • 10,200 Sq Ft',
            neighborhood: 'Malibu Colony, CA',
          },
        ],
      },
    ],
    body: {
      builder: 'grapesjs',
      html: `
        <div class="realestate-page" style="${BASE_FONT} padding: 80px 24px; max-width: 1120px; margin: 0 auto; color: #0f172a;">
          <section data-cms-schema="estate-hero-section" style="text-align: center; margin-bottom: 72px;">
            <span data-cms-slot="exclusive_badge" data-cms-schema="estate-hero-section" style="font-size: 11px; font-weight: 700; letter-spacing: 0.15em; color: #b45309; text-transform: uppercase;">{{exclusive_badge}}</span>
            <h1 data-cms-slot="hero_title" data-cms-schema="estate-hero-section" style="font-size: 46px; font-weight: 300; letter-spacing: -0.02em; line-height: 1.2; margin: 16px 0 20px;">{{hero_title}}</h1>
            <p data-cms-slot="market_subtitle" data-cms-schema="estate-hero-section" style="font-size: 17px; color: #64748b; max-width: 640px; margin: 0 auto 36px;">{{market_subtitle}}</p>
            <a href="/properties" data-cms-slot="consultation_cta" data-cms-schema="estate-hero-section" style="background: #0f172a; color: #fff; padding: 14px 36px; border-radius: 4px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; text-decoration: none;">{{consultation_cta}}</a>
          </section>

          <section data-cms-schema="premier-listings-section">
            <h2 style="font-size: 24px; font-weight: 300; letter-spacing: 0.05em; text-align: center; margin-bottom: 40px; text-transform: uppercase;">Premier Offerings</h2>
            <div data-cms-repeat="true" data-cms-schema="premier-listings-section" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 32px;">
              <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 32px;">
                <span data-cms-slot="neighborhood" data-cms-schema="premier-listings-section" style="font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase;">{{neighborhood}}</span>
                <h3 data-cms-slot="residence_name" data-cms-schema="premier-listings-section" style="font-size: 20px; font-weight: 600; margin: 8px 0;">{{residence_name}}</h3>
                <p data-cms-slot="bed_bath_sqft" data-cms-schema="premier-listings-section" style="font-size: 14px; color: #64748b; margin-bottom: 20px;">{{bed_bath_sqft}}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid #f1f5f9;">
                  <span data-cms-slot="price_display" data-cms-schema="premier-listings-section" style="font-size: 22px; font-weight: 700; color: #0f172a;">{{price_display}}</span>
                  <a href="/private-showing" style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #b45309; text-decoration: underline;">Schedule Showing</a>
                </div>
              </div>
            </div>
          </section>
        </div>
      `,
      css: '.realestate-page { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }',
      projectData: null,
    },
  },
  {
    key: 'properties',
    title: 'Exclusive Property Portfolio',
    slug: '/properties',
    description:
      'Filterable estate portfolio with pricing, architecture type, and virtual tours',
    badge: 'Properties',
    schemas: [
      {
        id: 'properties-catalog-section',
        name: 'Property Listings',
        slug: 'properties-catalog-section',
        entryType: 'multi',
        fields: [
          {
            apiId: 'property_name',
            displayName: 'Listing Name',
            dataType: 'text',
          },
          { apiId: 'asking_price', displayName: 'Price', dataType: 'text' },
          { apiId: 'address_line', displayName: 'Address', dataType: 'text' },
          {
            apiId: 'specs_summary',
            displayName: 'Bed/Bath/SqFt',
            dataType: 'text',
          },
        ],
        values: {},
        items: [
          {
            property_name: 'The Glass Horizon Compound',
            asking_price: '$18,900,000',
            address_line: '880 Ocean Ridge Road, Laguna Beach, CA',
            specs_summary: '5 Beds • 6 Baths • 7,800 Sq Ft',
          },
          {
            property_name: 'Aspen Mountain Timber Manor',
            asking_price: '$12,400,000',
            address_line: '120 Red Mountain Way, Aspen, CO',
            specs_summary: '4 Beds • 5 Baths • 6,200 Sq Ft',
          },
        ],
      },
    ],
    body: {
      builder: 'grapesjs',
      html: `
        <div class="properties-page" style="${BASE_FONT} padding: 72px 24px; max-width: 1040px; margin: 0 auto;">
          <h1 style="font-size: 38px; font-weight: 300; margin-bottom: 40px;">Current Portfolio</h1>
          <div data-cms-repeat="true" data-cms-schema="properties-catalog-section" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 28px;">
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 28px;">
              <span data-cms-slot="address_line" data-cms-schema="properties-catalog-section" style="font-size: 12px; color: #94a3b8;">{{address_line}}</span>
              <h3 data-cms-slot="property_name" data-cms-schema="properties-catalog-section" style="font-size: 19px; font-weight: 600; margin: 6px 0 10px;">{{property_name}}</h3>
              <p data-cms-slot="specs_summary" data-cms-schema="properties-catalog-section" style="font-size: 13px; color: #64748b; margin-bottom: 16px;">{{specs_summary}}</p>
              <span data-cms-slot="asking_price" data-cms-schema="properties-catalog-section" style="font-size: 20px; font-weight: 700; color: #0f172a;">{{asking_price}}</span>
            </div>
          </div>
        </div>
      `,
      css: '.properties-page { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }',
      projectData: null,
    },
  },
  {
    key: 'neighborhoods',
    title: 'Neighborhood & City Guides',
    slug: '/neighborhoods',
    description:
      'Curated lifestyle guides, private school rankings, and local dining districts',
    badge: 'Area Guides',
    schemas: [
      {
        id: 'neighborhood-guides-section',
        name: 'Neighborhood Guides',
        slug: 'neighborhood-guides-section',
        entryType: 'multi',
        fields: [
          {
            apiId: 'district_name',
            displayName: 'District / Enclave',
            dataType: 'text',
          },
          {
            apiId: 'average_price',
            displayName: 'Median Value',
            dataType: 'text',
          },
          {
            apiId: 'lifestyle_vibe',
            displayName: 'Atmosphere',
            dataType: 'text',
          },
          {
            apiId: 'key_amenity',
            displayName: 'Key Amenity',
            dataType: 'text',
          },
        ],
        values: {},
        items: [
          {
            district_name: 'Malibu Colony',
            average_price: '$18M Median',
            lifestyle_vibe: 'Private Guard-Gated Beachfront',
            key_amenity: 'Private Surf Access & Yacht Moorings',
          },
          {
            district_name: 'Bel Air Enclave',
            average_price: '$12M Median',
            lifestyle_vibe: 'Secluded Estate Living',
            key_amenity: 'Bel-Air Country Club & Equestrian Trails',
          },
        ],
      },
    ],
    body: {
      builder: 'grapesjs',
      html: `
        <div class="neighborhoods-page" style="${BASE_FONT} padding: 72px 24px; max-width: 1040px; margin: 0 auto;">
          <h1 style="font-size: 36px; font-weight: 300; margin-bottom: 40px;">Enclave & Lifestyle Guides</h1>
          <div data-cms-repeat="true" data-cms-schema="neighborhood-guides-section" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 28px;">
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 28px;">
              <h3 data-cms-slot="district_name" data-cms-schema="neighborhood-guides-section" style="font-size: 19px; font-weight: 600; margin: 0 0 6px;">{{district_name}}</h3>
              <p data-cms-slot="average_price" data-cms-schema="neighborhood-guides-section" style="font-size: 14px; font-weight: 700; color: #b45309; margin-bottom: 12px;">{{average_price}}</p>
              <p data-cms-slot="lifestyle_vibe" data-cms-schema="neighborhood-guides-section" style="font-size: 13px; color: #64748b; margin-bottom: 8px;">{{lifestyle_vibe}}</p>
              <span data-cms-slot="key_amenity" data-cms-schema="neighborhood-guides-section" style="font-size: 12px; color: #94a3b8;">{{key_amenity}}</span>
            </div>
          </div>
        </div>
      `,
      css: '.neighborhoods-page { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }',
      projectData: null,
    },
  },
  {
    key: 'private_showing',
    title: 'Schedule a Private Showing',
    slug: '/private-showing',
    description:
      'Confidential broker appointment booking and bespoke property search',
    badge: 'Private Showing',
    schemas: [
      {
        id: 'showing-intake-section',
        name: 'Private Showing Intake',
        slug: 'showing-intake-section',
        entryType: 'single',
        fields: [
          { apiId: 'headline', displayName: 'Header', dataType: 'text' },
          {
            apiId: 'broker_name',
            displayName: 'Managing Broker',
            dataType: 'text',
          },
          {
            apiId: 'broker_license',
            displayName: 'DRE License #',
            dataType: 'text',
          },
          {
            apiId: 'direct_phone',
            displayName: 'Private Line',
            dataType: 'text',
          },
          {
            apiId: 'confidential_email',
            displayName: 'Direct Email',
            dataType: 'text',
          },
        ],
        values: {
          headline: 'Confidential Showing Appointments',
          broker_name: 'Victoria St. Claire',
          broker_license: 'CA DRE #01928472',
          direct_phone: '+1 (310) 902-8812',
          confidential_email: 'estates@prime-realty.com',
        },
      },
    ],
    body: {
      builder: 'grapesjs',
      html: `
        <div class="showing-page" style="${BASE_FONT} padding: 72px 24px; max-width: 800px; margin: 0 auto; text-align: center;">
          <section data-cms-schema="showing-intake-section" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 48px;">
            <h1 data-cms-slot="headline" data-cms-schema="showing-intake-section" style="font-size: 32px; font-weight: 300; margin: 0 0 20px;">{{headline}}</h1>
            <p data-cms-slot="broker_name" data-cms-schema="showing-intake-section" style="font-size: 18px; font-weight: 600; color: #0f172a; margin: 0 0 4px;">{{broker_name}}</p>
            <p data-cms-slot="broker_license" data-cms-schema="showing-intake-section" style="font-size: 12px; color: #94a3b8; margin: 0 0 20px;">{{broker_license}}</p>
            <p data-cms-slot="direct_phone" data-cms-schema="showing-intake-section" style="font-size: 15px; font-weight: 600; color: #b45309; margin-bottom: 6px;">{{direct_phone}}</p>
            <p data-cms-slot="confidential_email" data-cms-schema="showing-intake-section" style="font-size: 14px; color: #64748b;">{{confidential_email}}</p>
          </section>
        </div>
      `,
      css: '.showing-page { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }',
      projectData: null,
    },
  },
];

// 8. CULINARY BISTRO & RESTAURANT HOSPITALITY STARTER PAGES
export const RESTAURANT_STARTER_PAGES: StarterPageDefinition[] = [
  {
    key: 'bistro_home',
    title: 'Dining Room & Chef Welcome',
    slug: '/',
    description:
      'Culinary atmosphere hero, chef greeting, and seasonal tasting highlights',
    badge: 'Culinary Home',
    schemas: [
      {
        id: 'bistro-hero-section',
        name: 'Dining Room Welcome',
        slug: 'bistro-hero-section',
        entryType: 'single',
        fields: [
          {
            apiId: 'restaurant_name',
            displayName: 'Restaurant Title',
            dataType: 'text',
          },
          {
            apiId: 'cuisine_tagline',
            displayName: 'Cuisine Style',
            dataType: 'textarea',
          },
          {
            apiId: 'booking_cta',
            displayName: 'Reservation Button',
            dataType: 'text',
          },
          {
            apiId: 'hours_summary',
            displayName: 'Operating Hours',
            dataType: 'text',
          },
        ],
        values: {
          restaurant_name: 'Bistrot Gourmet: Woodfired Seasonal Dining',
          cuisine_tagline:
            'Hyper-local farm produce, heritage breed meats, and natural biodynamic wines served in an intimate candlelit dining room.',
          booking_cta: 'Reserve a Table',
          hours_summary:
            'Dinner Tuesday - Sunday from 5:30 PM • Lunch Saturday & Sunday',
        },
      },
      {
        id: 'chef-specials-section',
        name: 'Chef Tasting Highlights',
        slug: 'chef-specials-section',
        entryType: 'multi',
        fields: [
          { apiId: 'dish_name', displayName: 'Dish Title', dataType: 'text' },
          {
            apiId: 'course',
            displayName: 'Course / Course Section',
            dataType: 'text',
          },
          { apiId: 'price', displayName: 'Price ($)', dataType: 'text' },
          {
            apiId: 'dish_description',
            displayName: 'Ingredients & Preparation',
            dataType: 'textarea',
          },
        ],
        values: {},
        items: [
          {
            dish_name: 'Wood-Grilled Heritage Pork Chop',
            course: 'Plats Principaux',
            price: '$44',
            dish_description:
              'Charred spring onions, sour plum glaze, and roasted marrow jus.',
          },
          {
            dish_name: 'Wild Chanterelle Agnolotti',
            course: 'Primi Piatti',
            price: '$32',
            dish_description:
              'Hand-pinched pasta, brown butter, cultured parmesan, and fresh summer truffles.',
          },
        ],
      },
    ],
    body: {
      builder: 'grapesjs',
      html: `
        <div class="restaurant-page" style="${BASE_FONT} padding: 80px 24px; max-width: 1040px; margin: 0 auto; color: #27272a;">
          <section data-cms-schema="bistro-hero-section" style="text-align: center; margin-bottom: 64px;">
            <h1 data-cms-slot="restaurant_name" data-cms-schema="bistro-hero-section" style="font-size: 42px; font-weight: 400; font-family: Georgia, serif; margin: 0 0 16px;">{{restaurant_name}}</h1>
            <p data-cms-slot="cuisine_tagline" data-cms-schema="bistro-hero-section" style="font-size: 16px; color: #71717a; max-width: 600px; margin: 0 auto 24px; line-height: 1.7;">{{cuisine_tagline}}</p>
            <p data-cms-slot="hours_summary" data-cms-schema="bistro-hero-section" style="font-size: 13px; color: #a1a1aa; margin-bottom: 32px;">{{hours_summary}}</p>
            <a href="/reservations" data-cms-slot="booking_cta" data-cms-schema="bistro-hero-section" style="background: #18181b; color: #fff; padding: 12px 32px; border-radius: 4px; font-size: 13px; font-weight: 600; text-decoration: none;">{{booking_cta}}</a>
          </section>

          <section data-cms-schema="chef-specials-section">
            <h2 style="font-size: 22px; font-family: Georgia, serif; text-align: center; margin-bottom: 36px;">Featured Seasonal Courses</h2>
            <div data-cms-repeat="true" data-cms-schema="chef-specials-section" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 28px;">
              <div style="background: #ffffff; border: 1px solid #e4e4e7; border-radius: 8px; padding: 28px;">
                <span data-cms-slot="course" data-cms-schema="chef-specials-section" style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #a1a1aa;">{{course}}</span>
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin: 8px 0 10px;">
                  <h3 data-cms-slot="dish_name" data-cms-schema="chef-specials-section" style="font-size: 18px; font-weight: 600; margin: 0;">{{dish_name}}</h3>
                  <span data-cms-slot="price" data-cms-schema="chef-specials-section" style="font-size: 17px; font-weight: 700;">{{price}}</span>
                </div>
                <p data-cms-slot="dish_description" data-cms-schema="chef-specials-section" style="font-size: 14px; color: #71717a; line-height: 1.6; margin: 0;">{{dish_description}}</p>
              </div>
            </div>
          </section>
        </div>
      `,
      css: '.restaurant-page { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }',
      projectData: null,
    },
  },
  {
    key: 'menu',
    title: 'Seasonal Menus & Wine List',
    slug: '/menu',
    description:
      'A la carte menu, farm-to-table pairings, and sommelier cellar selection',
    badge: 'Menu & Cellar',
    schemas: [
      {
        id: 'full-menu-section',
        name: 'A La Carte Offerings',
        slug: 'full-menu-section',
        entryType: 'multi',
        fields: [
          { apiId: 'item_name', displayName: 'Item Title', dataType: 'text' },
          {
            apiId: 'section_category',
            displayName: 'Course Section',
            dataType: 'text',
          },
          { apiId: 'price', displayName: 'Price', dataType: 'text' },
          {
            apiId: 'dietary_flag',
            displayName: 'Dietary Tag',
            dataType: 'text',
          },
        ],
        values: {},
        items: [
          {
            item_name: 'Grilled Sourdough & Cultured Butter',
            section_category: 'Starters',
            price: '$9',
            dietary_flag: 'Vegetarian',
          },
          {
            item_name: 'Dry-Aged Ribeye for Two',
            section_category: 'Mains',
            price: '$120',
            dietary_flag: 'Gluten-Free',
          },
        ],
      },
    ],
    body: {
      builder: 'grapesjs',
      html: `
        <div class="menu-page" style="${BASE_FONT} padding: 72px 24px; max-width: 860px; margin: 0 auto;">
          <h1 style="font-size: 36px; font-family: Georgia, serif; text-align: center; margin-bottom: 40px;">Dinner Menu</h1>
          <div data-cms-repeat="true" data-cms-schema="full-menu-section" style="display: flex; flex-direction: column; gap: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px dotted #d4d4d8; padding-bottom: 12px;">
              <div>
                <span data-cms-slot="section_category" data-cms-schema="full-menu-section" style="font-size: 11px; text-transform: uppercase; color: #a1a1aa; display: block;">{{section_category}}</span>
                <span data-cms-slot="item_name" data-cms-schema="full-menu-section" style="font-size: 17px; font-weight: 600;">{{item_name}}</span>
                <span data-cms-slot="dietary_flag" data-cms-schema="full-menu-section" style="font-size: 11px; color: #16a34a; margin-left: 8px;">{{dietary_flag}}</span>
              </div>
              <span data-cms-slot="price" data-cms-schema="full-menu-section" style="font-size: 17px; font-weight: 700;">{{price}}</span>
            </div>
          </div>
        </div>
      `,
      css: '.menu-page { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }',
      projectData: null,
    },
  },
  {
    key: 'reservations',
    title: 'Table Reservations & Bookings',
    slug: '/reservations',
    description:
      'Real-time table booking, seating policy, and dining room etiquette',
    badge: 'Reservations',
    schemas: [
      {
        id: 'reservation-rules-section',
        name: 'Reservation Booking',
        slug: 'reservation-rules-section',
        entryType: 'single',
        fields: [
          { apiId: 'headline', displayName: 'Header', dataType: 'text' },
          {
            apiId: 'reservation_phone',
            displayName: 'Host Desk Phone',
            dataType: 'text',
          },
          {
            apiId: 'max_party_size',
            displayName: 'Max Online Party',
            dataType: 'text',
          },
          {
            apiId: 'cancellation_policy',
            displayName: 'Cancellation Policy',
            dataType: 'textarea',
          },
        ],
        values: {
          headline: 'Join Us in the Dining Room',
          reservation_phone: '+1 (555) 743-2901',
          max_party_size: 'Online parties up to 6 guests',
          cancellation_policy:
            'Reservations can be modified or cancelled up to 24 hours prior without fee.',
        },
      },
    ],
    body: {
      builder: 'grapesjs',
      html: `
        <div class="reservations-page" style="${BASE_FONT} padding: 72px 24px; max-width: 800px; margin: 0 auto; text-align: center;">
          <section data-cms-schema="reservation-rules-section" style="background: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; padding: 48px;">
            <h1 data-cms-slot="headline" data-cms-schema="reservation-rules-section" style="font-size: 32px; font-family: Georgia, serif; margin: 0 0 16px;">{{headline}}</h1>
            <p data-cms-slot="max_party_size" data-cms-schema="reservation-rules-section" style="font-size: 14px; color: #71717a; margin-bottom: 8px;">{{max_party_size}}</p>
            <p data-cms-slot="reservation_phone" data-cms-schema="reservation-rules-section" style="font-size: 18px; font-weight: 700; color: #18181b; margin-bottom: 20px;">{{reservation_phone}}</p>
            <p data-cms-slot="cancellation_policy" data-cms-schema="reservation-rules-section" style="font-size: 13px; color: #a1a1aa; max-width: 440px; margin: 0 auto;">{{cancellation_policy}}</p>
          </section>
        </div>
      `,
      css: '.reservations-page { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }',
      projectData: null,
    },
  },
  {
    key: 'events',
    title: 'Private Dining & Events',
    slug: '/events',
    description:
      'Private salon hire, corporate dinners, and custom wedding catering',
    badge: 'Private Dining',
    schemas: [
      {
        id: 'private-events-section',
        name: 'Private Event Spaces',
        slug: 'private-events-section',
        entryType: 'multi',
        fields: [
          {
            apiId: 'room_name',
            displayName: 'Salon / Room Name',
            dataType: 'text',
          },
          {
            apiId: 'capacity_seated',
            displayName: 'Seating Capacity',
            dataType: 'text',
          },
          {
            apiId: 'room_amenities',
            displayName: 'Amenities',
            dataType: 'text',
          },
          {
            apiId: 'package_rate',
            displayName: 'Starting Minimum ($)',
            dataType: 'text',
          },
        ],
        values: {},
        items: [
          {
            room_name: 'The Wine Cellar Salon',
            capacity_seated: 'Seated for 18 guests',
            room_amenities:
              'Dedicated sommelier, private entrance, acoustic isolation',
            package_rate: 'From $2,500',
          },
          {
            room_name: 'The Glass Garden Terrace',
            capacity_seated: 'Seated for 45 guests',
            room_amenities: 'Heated outdoor canopy, bespoke cocktail station',
            package_rate: 'From $5,000',
          },
        ],
      },
    ],
    body: {
      builder: 'grapesjs',
      html: `
        <div class="events-page" style="${BASE_FONT} padding: 72px 24px; max-width: 960px; margin: 0 auto;">
          <h1 style="font-size: 34px; font-family: Georgia, serif; text-align: center; margin-bottom: 40px;">Private Gatherings & Celebrations</h1>
          <div data-cms-repeat="true" data-cms-schema="private-events-section" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 28px;">
            <div style="background: #ffffff; border: 1px solid #e4e4e7; border-radius: 8px; padding: 28px;">
              <h3 data-cms-slot="room_name" data-cms-schema="private-events-section" style="font-size: 20px; font-weight: 600; margin: 0 0 6px;">{{room_name}}</h3>
              <p data-cms-slot="capacity_seated" data-cms-schema="private-events-section" style="font-size: 13px; font-weight: 600; color: #18181b; margin-bottom: 8px;">{{capacity_seated}}</p>
              <p data-cms-slot="room_amenities" data-cms-schema="private-events-section" style="font-size: 13px; color: #71717a; margin-bottom: 16px;">{{room_amenities}}</p>
              <span data-cms-slot="package_rate" data-cms-schema="private-events-section" style="font-size: 17px; font-weight: 700; color: #b45309;">{{package_rate}}</span>
            </div>
          </div>
        </div>
      `,
      css: '.events-page { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }',
      projectData: null,
    },
  },
];

// 9. ONLINE ACADEMY & COURSE MASTERCLASS STARTER PAGES
export const EDUCATION_STARTER_PAGES: StarterPageDefinition[] = [
  {
    key: 'academy_home',
    title: 'Academy Learning Portal',
    slug: '/',
    description:
      'Course search banner, learning tracks, and accredited certification',
    badge: 'Academy Home',
    schemas: [
      {
        id: 'academy-hero-section',
        name: 'Academy Hero Banner',
        slug: 'academy-hero-section',
        entryType: 'single',
        fields: [
          {
            apiId: 'headline',
            displayName: 'Academy Headline',
            dataType: 'text',
          },
          {
            apiId: 'accreditation_tag',
            displayName: 'Accreditation Badge',
            dataType: 'text',
          },
          {
            apiId: 'subheadline',
            displayName: 'Curriculum Mission',
            dataType: 'textarea',
          },
          {
            apiId: 'explore_cta',
            displayName: 'Explore Catalog CTA',
            dataType: 'text',
          },
        ],
        values: {
          headline: 'Master Distributed Systems & Modern Software Engineering',
          accreditation_tag: 'INDUSTRY CERTIFIED CURRICULUM',
          subheadline:
            'Learn directly from principal architects and open-source core contributors through real-world production projects.',
          explore_cta: 'Browse Masterclasses',
        },
      },
      {
        id: 'trending-courses-section',
        name: 'Featured Masterclasses',
        slug: 'trending-courses-section',
        entryType: 'multi',
        fields: [
          {
            apiId: 'course_title',
            displayName: 'Course Name',
            dataType: 'text',
          },
          {
            apiId: 'category_tag',
            displayName: 'Subject Track',
            dataType: 'text',
          },
          {
            apiId: 'instructor',
            displayName: 'Lead Instructor',
            dataType: 'text',
          },
          {
            apiId: 'duration',
            displayName: 'Duration / Lessons',
            dataType: 'text',
          },
          { apiId: 'level', displayName: 'Skill Level', dataType: 'text' },
        ],
        values: {},
        items: [
          {
            course_title: 'Advanced Edge Networking & Distributed Caching',
            category_tag: 'Infrastructure',
            instructor: 'Elena Rostova',
            duration: '24 Hours • 32 Lessons',
            level: 'Advanced',
          },
          {
            course_title: 'Declarative Visual Canvases & Custom AST Engines',
            category_tag: 'Frontend Architecture',
            instructor: 'Marcus Vance',
            duration: '18 Hours • 24 Lessons',
            level: 'Intermediate',
          },
        ],
      },
    ],
    body: {
      builder: 'grapesjs',
      html: `
        <div class="academy-page" style="${BASE_FONT} padding: 80px 24px; max-width: 1040px; margin: 0 auto; color: #0f172a;">
          <section data-cms-schema="academy-hero-section" style="text-align: center; margin-bottom: 64px;">
            <span data-cms-slot="accreditation_tag" data-cms-schema="academy-hero-section" style="font-size: 11px; font-weight: 700; color: #4338ca; background: #e0e7ff; padding: 4px 14px; border-radius: 9999px; display: inline-block; margin-bottom: 20px;">{{accreditation_tag}}</span>
            <h1 data-cms-slot="headline" data-cms-schema="academy-hero-section" style="font-size: 44px; font-weight: 800; line-height: 1.2; margin: 0 0 16px;">{{headline}}</h1>
            <p data-cms-slot="subheadline" data-cms-schema="academy-hero-section" style="font-size: 17px; color: #64748b; max-width: 640px; margin: 0 auto 32px; line-height: 1.6;">{{subheadline}}</p>
            <a href="/courses" data-cms-slot="explore_cta" data-cms-schema="academy-hero-section" style="background: #4338ca; color: #ffffff; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px; text-decoration: none;">{{explore_cta}}</a>
          </section>

          <section data-cms-schema="trending-courses-section">
            <h2 style="font-size: 24px; font-weight: 800; text-align: center; margin-bottom: 36px;">Trending Masterclasses</h2>
            <div data-cms-repeat="true" data-cms-schema="trending-courses-section" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 28px;">
              <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px;">
                <span data-cms-slot="category_tag" data-cms-schema="trending-courses-section" style="font-size: 11px; font-weight: 700; color: #4338ca; text-transform: uppercase;">{{category_tag}}</span>
                <h3 data-cms-slot="course_title" data-cms-schema="trending-courses-section" style="font-size: 19px; font-weight: 700; margin: 8px 0 10px;">{{course_title}}</h3>
                <p data-cms-slot="instructor" data-cms-schema="trending-courses-section" style="font-size: 13px; color: #64748b; margin-bottom: 14px;">Instructor: {{instructor}}</p>
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #94a3b8; padding-top: 14px; border-top: 1px solid #f1f5f9;">
                  <span data-cms-slot="duration" data-cms-schema="trending-courses-section">{{duration}}</span>
                  <span data-cms-slot="level" data-cms-schema="trending-courses-section" style="font-weight: 600; color: #0f172a;">{{level}}</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      `,
      css: '.academy-page { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }',
      projectData: null,
    },
  },
  {
    key: 'courses',
    title: 'Course Directory & Curriculum',
    slug: '/courses',
    description:
      'Comprehensive course catalog with syllabi, prerequisites, and enrollment',
    badge: 'Curriculum',
    schemas: [
      {
        id: 'courses-catalog-section',
        name: 'Full Curriculum',
        slug: 'courses-catalog-section',
        entryType: 'multi',
        fields: [
          {
            apiId: 'course_name',
            displayName: 'Course Title',
            dataType: 'text',
          },
          { apiId: 'tracks_offered', displayName: 'Pillars', dataType: 'text' },
          {
            apiId: 'hours_total',
            displayName: 'Total Hours',
            dataType: 'text',
          },
          {
            apiId: 'credential_earned',
            displayName: 'Certification',
            dataType: 'text',
          },
        ],
        values: {},
        items: [
          {
            course_name: 'Enterprise Cryptography & FIDO2 Identity Engineering',
            tracks_offered: 'Security Architecture',
            hours_total: '30 Hours',
            credential_earned: 'Certified Identity Architect',
          },
          {
            course_name: 'Next.js 15 Server Components & Headless Pipelines',
            tracks_offered: 'Web Engineering',
            hours_total: '20 Hours',
            credential_earned: 'Certified React Edge Specialist',
          },
        ],
      },
    ],
    body: {
      builder: 'grapesjs',
      html: `
        <div class="courses-page" style="${BASE_FONT} padding: 72px 24px; max-width: 960px; margin: 0 auto;">
          <h1 style="font-size: 36px; font-weight: 800; margin-bottom: 40px;">All Academic Tracks</h1>
          <div data-cms-repeat="true" data-cms-schema="courses-catalog-section" style="display: flex; flex-direction: column; gap: 20px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
              <div>
                <span data-cms-slot="tracks_offered" data-cms-schema="courses-catalog-section" style="font-size: 11px; font-weight: 700; color: #4338ca; text-transform: uppercase;">{{tracks_offered}}</span>
                <h3 data-cms-slot="course_name" data-cms-schema="courses-catalog-section" style="font-size: 18px; font-weight: 700; margin: 4px 0 6px;">{{course_name}}</h3>
                <span data-cms-slot="credential_earned" data-cms-schema="courses-catalog-section" style="font-size: 12px; color: #64748b;">Credentials: {{credential_earned}}</span>
              </div>
              <span data-cms-slot="hours_total" data-cms-schema="courses-catalog-section" style="font-size: 14px; font-weight: 700; color: #0f172a;">{{hours_total}}</span>
            </div>
          </div>
        </div>
      `,
      css: '.courses-page { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }',
      projectData: null,
    },
  },
  {
    key: 'faculty',
    title: 'Instructors & Faculty Directory',
    slug: '/faculty',
    description:
      'Industry practitioner profiles, research publications, and office hours',
    badge: 'Faculty',
    schemas: [
      {
        id: 'faculty-roster-section',
        name: 'Faculty Members',
        slug: 'faculty-roster-section',
        entryType: 'multi',
        fields: [
          {
            apiId: 'instructor_name',
            displayName: 'Faculty Name',
            dataType: 'text',
          },
          {
            apiId: 'academic_title',
            displayName: 'Title / Role',
            dataType: 'text',
          },
          {
            apiId: 'organization',
            displayName: 'Affiliation / Background',
            dataType: 'text',
          },
          {
            apiId: 'specialization',
            displayName: 'Subject Focus',
            dataType: 'textarea',
          },
        ],
        values: {},
        items: [
          {
            instructor_name: 'Elena Rostova',
            academic_title: 'Chair of Distributed Systems',
            organization: 'Ex-Infrastructure VP',
            specialization:
              'Consensus protocols, high-concurrency memory layouts, and edge datastores.',
          },
          {
            instructor_name: 'Marcus Vance',
            academic_title: 'Head of Visual Computing',
            organization: 'Design Systems Lead',
            specialization:
              'Direct manipulation canvases, AST transformers, and token architectures.',
          },
        ],
      },
    ],
    body: {
      builder: 'grapesjs',
      html: `
        <div class="faculty-page" style="${BASE_FONT} padding: 72px 24px; max-width: 960px; margin: 0 auto;">
          <h1 style="font-size: 34px; font-weight: 800; margin-bottom: 40px;">Faculty & Lecturers</h1>
          <div data-cms-repeat="true" data-cms-schema="faculty-roster-section" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 28px;">
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px;">
              <h3 data-cms-slot="instructor_name" data-cms-schema="faculty-roster-section" style="font-size: 19px; font-weight: 700; margin: 0 0 4px;">{{instructor_name}}</h3>
              <span data-cms-slot="academic_title" data-cms-schema="faculty-roster-section" style="font-size: 12px; font-weight: 600; color: #4338ca; display: block;">{{academic_title}}</span>
              <span data-cms-slot="organization" data-cms-schema="faculty-roster-section" style="font-size: 11px; color: #94a3b8; display: block; margin-bottom: 12px;">{{organization}}</span>
              <p data-cms-slot="specialization" data-cms-schema="faculty-roster-section" style="font-size: 13px; color: #64748b; line-height: 1.6; margin: 0;">{{specialization}}</p>
            </div>
          </div>
        </div>
      `,
      css: '.faculty-page { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }',
      projectData: null,
    },
  },
  {
    key: 'admissions',
    title: 'Student Admissions & FAQs',
    slug: '/admissions',
    description:
      'Tuition fees, scholarship aid, academic calendar, and enrollment FAQs',
    badge: 'Admissions',
    schemas: [
      {
        id: 'admissions-faq-section',
        name: 'Admissions FAQs',
        slug: 'admissions-faq-section',
        entryType: 'multi',
        fields: [
          { apiId: 'question', displayName: 'Question', dataType: 'text' },
          { apiId: 'answer', displayName: 'Answer', dataType: 'textarea' },
          { apiId: 'topic_tag', displayName: 'Category', dataType: 'text' },
        ],
        values: {},
        items: [
          {
            question:
              'What background experience is required for advanced tracks?',
            answer:
              'Proficiency in modern TypeScript or Golang and familiarity with distributed web architecture.',
            topic_tag: 'Prerequisites',
          },
          {
            question: 'Are corporate tuition reimbursements accepted?',
            answer:
              'Yes, we provide official syllabus invoices and receipts matching corporate L&D standards.',
            topic_tag: 'Tuition',
          },
        ],
      },
    ],
    body: {
      builder: 'grapesjs',
      html: `
        <div class="admissions-page" style="${BASE_FONT} padding: 72px 24px; max-width: 860px; margin: 0 auto;">
          <h1 style="font-size: 34px; font-weight: 800; text-align: center; margin-bottom: 40px;">Admissions & Tuition FAQ</h1>
          <div data-cms-repeat="true" data-cms-schema="admissions-faq-section" style="display: flex; flex-direction: column; gap: 16px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
              <span data-cms-slot="topic_tag" data-cms-schema="admissions-faq-section" style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #4338ca;">{{topic_tag}}</span>
              <h3 data-cms-slot="question" data-cms-schema="admissions-faq-section" style="font-size: 17px; font-weight: 700; margin: 6px 0 8px;">{{question}}</h3>
              <p data-cms-slot="answer" data-cms-schema="admissions-faq-section" style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0;">{{answer}}</p>
            </div>
          </div>
        </div>
      `,
      css: '.admissions-page { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }',
      projectData: null,
    },
  },
];

// Helper to get starter pages matching chosen category
export function getStarterPagesForCategory(
  category?: string,
): StarterPageDefinition[] {
  const cat = (category || '').toLowerCase().trim();
  if (
    cat === 'retail' ||
    cat.includes('boutique') ||
    cat.includes('fashion') ||
    cat.includes('atelier')
  ) {
    return RETAIL_STARTER_PAGES;
  }
  if (
    cat === 'ecommerce' ||
    cat.includes('amazon') ||
    cat.includes('shop') ||
    cat.includes('store')
  ) {
    return ECOMMERCE_STARTER_PAGES;
  }
  if (
    cat === 'saas' ||
    cat.includes('software') ||
    cat.includes('tech') ||
    cat.includes('cloud')
  ) {
    return SAAS_STARTER_PAGES;
  }
  if (
    cat === 'portfolio' ||
    cat.includes('agency') ||
    cat.includes('studio') ||
    cat.includes('creative')
  ) {
    return PORTFOLIO_STARTER_PAGES;
  }
  if (
    cat === 'editorial' ||
    cat === 'blog' ||
    cat.includes('news') ||
    cat.includes('magazine')
  ) {
    return EDITORIAL_STARTER_PAGES;
  }
  if (
    cat === 'real-estate' ||
    cat === 'realestate' ||
    cat.includes('property') ||
    cat.includes('realty')
  ) {
    return REALESTATE_STARTER_PAGES;
  }
  if (
    cat === 'restaurant' ||
    cat.includes('culinary') ||
    cat.includes('food') ||
    cat.includes('bistro') ||
    cat.includes('dining')
  ) {
    return RESTAURANT_STARTER_PAGES;
  }
  if (
    cat === 'education' ||
    cat === 'course' ||
    cat.includes('academy') ||
    cat.includes('school')
  ) {
    return EDUCATION_STARTER_PAGES;
  }
  return GENERAL_STARTER_PAGES;
}
