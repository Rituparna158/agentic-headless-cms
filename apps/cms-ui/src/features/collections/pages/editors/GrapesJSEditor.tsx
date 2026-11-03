import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import type { Editor } from 'grapesjs';
import { browserLogger } from '@repo/logger/browser';
import {
  CustomBlocksPlugin,
  register_universal_cms_traits,
  type CmsSchemaField,
  type CmsPageSchema,
} from '../../components/grapesjs-plugins/CustomBlocksPlugin';
import { GrapesJSEditorProps, GrapesJSEditorHandle } from './types';
import './GrapesJSTheme.css';
import {
  Undo,
  Redo,
  Monitor,
  Smartphone,
  Code,
  Trash2,
  FolderTree,
  Maximize,
  Loader2,
} from 'lucide-react';
import { setupLayerIcons } from './components/LayerIconPlugin';
import { setupBlockA11y } from './components/BlockA11yPlugin';
import { MediaAssetPickerModal } from '@/features/media/components/MediaAssetPickerModal';
import { getMediaFileUrl } from '@/features/media/utils/media.util';

export const GrapesJSEditor = forwardRef<
  GrapesJSEditorHandle,
  GrapesJSEditorProps
>(function GrapesJSEditor(
  {
    initialData,
    onChange,
    schemaFields = [],
    availableSchemas = [],
    schemaValues = {},
  },
  ref,
) {
  const editorRef = useRef<Editor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isReadyRef = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const initialDataRef = useRef(initialData);
  const schemaFieldsRef = useRef(schemaFields);
  schemaFieldsRef.current = schemaFields;
  const availableSchemasRef = useRef(availableSchemas);
  availableSchemasRef.current = availableSchemas;
  const schemaValuesRef = useRef(schemaValues);
  schemaValuesRef.current = schemaValues;

  const [leftTab, setLeftTab] = useState<'blocks' | 'layers'>('blocks');
  const [rightTab, setRightTab] = useState<'styles' | 'traits'>('styles');
  const [activeDevice, setActiveDevice] = useState('Desktop');
  const [outlineActive, setOutlineActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEngineLoading, setIsEngineLoading] = useState(true);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const mediaPickerCallbackRef = useRef<((url: string) => void) | null>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      register_universal_cms_traits(editorRef.current, {
        schemaFields: schemaFields as CmsSchemaField[],
        availableSchemas: availableSchemas as CmsPageSchema[],
        schemaValues,
      });
    }
  }, [schemaFields, availableSchemas, schemaValues]);

  useEffect(() => {
    let isMounted = true;
    if (!containerRef.current || editorRef.current) return;

    const initEditor = async () => {
      try {
        const [grapesjsModule, basicBlocksModule, formsModule] =
          await Promise.all([
            import('grapesjs'),
            import('grapesjs-blocks-basic'),
            import('grapesjs-plugin-forms'),
            import('grapesjs/dist/css/grapes.min.css'),
          ]);

        if (!isMounted || !containerRef.current || editorRef.current) return;

        const grapesjs = grapesjsModule.default || grapesjsModule;
        const basicBlocksPlugin =
          basicBlocksModule.default || basicBlocksModule;
        const formsPlugin = formsModule.default || formsModule;

        const editor = grapesjs.init({
          container: containerRef.current,
          fromElement: false,
          height: '100%',
          width: '100%',
          assetManager: {
            custom: {
              open(props?: {
                select?: (asset: string | object) => void;
                close?: () => void;
                target?: unknown;
              }) {
                mediaPickerCallbackRef.current = (assetUrl: string) => {
                  if (typeof props?.select === 'function') {
                    props.select(assetUrl);
                  }
                  const sel = editor.getSelected();
                  if (sel && sel.is('image')) {
                    sel.set('src', assetUrl);
                  }
                  if (
                    props?.target &&
                    typeof (props.target as Record<string, unknown>).set ===
                      'function'
                  ) {
                    (
                      props.target as { set: (k: string, v: unknown) => void }
                    ).set('src', assetUrl);
                  }
                };
                setIsMediaPickerOpen(true);
              },
              close() {
                setIsMediaPickerOpen(false);
              },
            },
          },
          deviceManager: {
            devices: [
              {
                id: 'Desktop',
                name: 'Desktop',
                width: '',
              },
              {
                id: 'Mobile',
                name: 'Mobile',
                width: '375px',
                widthMedia: '480px',
              },
            ],
          },
          panels: { defaults: [] }, // Disable default preset panels
          blockManager: {
            appendTo: '#gjs-blocks',
          },
          layerManager: {
            appendTo: '#gjs-layers',
          },
          styleManager: {
            appendTo: '#gjs-styles',
          },
          traitManager: {
            appendTo: '#gjs-traits',
          },
          plugins: [
            basicBlocksPlugin,
            formsPlugin,
            (ed: Editor) =>
              CustomBlocksPlugin(ed, {
                schemaFields: schemaFieldsRef.current as CmsSchemaField[],
                availableSchemas:
                  availableSchemasRef.current as CmsPageSchema[],
                schemaValues: schemaValuesRef.current,
              }),
          ],
        });

        editorRef.current = editor;

        // Centralized Asset Manager Command
        editor.Commands.add('open-assets' as string, {
          run(
            ed: Editor,
            _sender: unknown,
            opts: Record<string, unknown> = {},
          ) {
            mediaPickerCallbackRef.current = (assetUrl: string) => {
              const selected = ed.getSelected();
              if (selected && selected.is('image')) {
                selected.set('src', assetUrl);
              }
              if (
                opts.target &&
                typeof (opts.target as Record<string, unknown>).set ===
                  'function'
              ) {
                (opts.target as { set: (k: string, v: unknown) => void }).set(
                  'src',
                  assetUrl,
                );
              }
              if (typeof opts.select === 'function') {
                (opts.select as (url: string) => void)(assetUrl);
              }
            };
            setIsMediaPickerOpen(true);
          },
        });

        // Prompt user with central media library when an image component is added or dropped
        editor.on('component:add', (component: unknown) => {
          const comp = component as {
            is?: (t: string) => boolean;
            get?: (k: string) => string;
            set?: (k: string, v: unknown) => void;
            addAttributes?: (attrs: Record<string, unknown>) => void;
            addStyle?: (style: Record<string, string>) => void;
          };
          if (typeof comp?.is === 'function' && comp.is('image')) {
            // Apply responsive defaults so image NEVER breaks on large screens!
            comp.addAttributes?.({
              'data-object-fit': 'cover',
              'data-aspect-ratio': '16/9',
              'data-max-height': '480px',
              'data-image-width': '100%',
              'data-border-radius': '8px',
              'data-object-position': 'center',
            });
            comp.addStyle?.({
              width: '100%',
              'max-height': '480px',
              'aspect-ratio': '16/9',
              'object-fit': 'cover',
              'border-radius': '8px',
              display: 'block',
              margin: '0 auto',
            });

            const currentSrc = comp.get ? comp.get('src') : '';
            if (
              !currentSrc ||
              currentSrc.includes('placeholder') ||
              currentSrc.includes('via.placeholder')
            ) {
              mediaPickerCallbackRef.current = (assetUrl: string) => {
                if (typeof comp.set === 'function') {
                  comp.set('src', assetUrl);
                }
              };
              setIsMediaPickerOpen(true);
            }
          }
        });

        // Auto-switch to Properties (Traits) tab when user selects an image
        editor.on('component:selected', (component: unknown) => {
          const comp = component as {
            is?: (t: string) => boolean;
            get?: (k: string) => unknown;
          };
          if (
            comp &&
            (comp.is?.('image') ||
              (comp.get?.('tagName') as unknown as string) === 'img')
          ) {
            setRightTab('traits');
          }
        });

        // Intercept native file drag-and-drop on the visual canvas
        editor.on(
          'canvas:drop',
          (dataTransfer: DataTransfer | null | undefined) => {
            if (dataTransfer?.files && dataTransfer.files.length > 0) {
              mediaPickerCallbackRef.current = (assetUrl: string) => {
                const sel = editor.getSelected();
                if (
                  sel &&
                  typeof (
                    sel as unknown as { set: (k: string, v: unknown) => void }
                  ).set === 'function'
                ) {
                  (
                    sel as unknown as { set: (k: string, v: unknown) => void }
                  ).set('src', assetUrl);
                }
              };
              setIsMediaPickerOpen(true);
            }
          },
        );

        // Load initial data
        const initialConfig = initialDataRef.current;
        if (initialConfig && initialConfig.builder === 'grapesjs') {
          try {
            if (initialConfig.projectData) {
              editor.loadProjectData(initialConfig.projectData);
            } else {
              // Fallback for old data format
              if (initialConfig.components) {
                editor.setComponents(initialConfig.components);
              }
              if (initialConfig.styles) {
                editor.setStyle(initialConfig.styles);
              }
            }
          } catch (e) {
            browserLogger.error('Error loading GrapesJS data:', e);
          }
        }
        const handleChange = () => {
          if (!isReadyRef.current) return;
          onChangeRef.current({
            builder: 'grapesjs',
            projectData: editor.getProjectData(),
            // Keep HTML/CSS for external use if needed, but not required for saving
            html: editor.getHtml(),
            css: editor.getCss() || '',
          });
        };

        editor.on('load', () => {
          if (!isMounted) return;
          isReadyRef.current = true;
          setActiveDevice(editor.getDevice());
          setIsEngineLoading(false);
        });

        editor.on('change:device', () => {
          setActiveDevice(editor.getDevice());
        });

        editor.on('run:core:component-outline', () => setOutlineActive(true));
        editor.on('stop:core:component-outline', () => setOutlineActive(false));

        editor.on('update', handleChange);

        // Setup custom layer icons
        setupLayerIcons(editor);
        // Setup keyboard accessibility for block palette
        setupBlockA11y(editor);
      } catch (err) {
        browserLogger.error('Failed to asynchronously load GrapesJS:', err);
        if (isMounted) setIsEngineLoading(false);
      }
    };

    initEditor();

    return () => {
      isMounted = false;
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      loadTemplate: (result, action) => {
        if (!editorRef.current) return;
        const editor = editorRef.current;

        if (action === 'replace') {
          if (result.projectData) {
            editor.loadProjectData(result.projectData);
          } else if (result.html) {
            editor.setComponents(result.html);
            if (result.css) {
              editor.setStyle(result.css);
            }
          }
        } else {
          // append
          if (result.projectData) {
            const pages = result.projectData.pages as
              | Array<{ component?: { components?: unknown[] } }>
              | undefined;
            const comps =
              pages?.[0]?.component?.components ||
              (result.projectData.components as unknown[]);
            if (comps) {
              editor.addComponents(comps);
            }
          } else if (result.html) {
            editor.addComponents(result.html);
            if (result.css) {
              editor.addStyle(result.css);
            }
          }
        }
      },

      loadRawData: (data) => {
        if (!editorRef.current) return;
        const editor = editorRef.current;
        if (data.projectData) {
          editor.loadProjectData(data.projectData);
        } else if (data.components) {
          editor.setComponents(data.components);
          if (data.styles) {
            editor.setStyle(data.styles);
          }
        } else if (data.html) {
          editor.setComponents(data.html);
          if (data.css) {
            editor.setStyle(data.css);
          }
        }
      },

      isCanvasEmpty: () => {
        if (!editorRef.current) return true;
        const wrapper = editorRef.current.getWrapper();
        if (!wrapper) return true;
        const comps = wrapper.components();
        return !comps || comps.length === 0;
      },

      getEditor: () => editorRef.current,
    }),
    [],
  );

  return (
    <div
      ref={wrapperRef}
      className="flex h-full w-full bg-[#18181b] text-zinc-300 font-sans overflow-hidden"
    >
      {/* Left Sidebar */}
      <div className="w-64 flex flex-col bg-[#1e1e24] border-r border-zinc-800 z-10 shadow-xl relative overflow-hidden">
        {/* Bottom gradient accent glow */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-purple-500/5 to-transparent z-0" />
        <div
          role="tablist"
          aria-label="Editor Sidebar Panels"
          className="flex border-b border-zinc-800 p-2 gap-1 z-10 relative"
        >
          <button
            type="button"
            role="tab"
            id="tab-blocks"
            aria-selected={leftTab === 'blocks'}
            aria-controls="gjs-blocks"
            onClick={() => setLeftTab('blocks')}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              leftTab === 'blocks'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            Blocks
          </button>
          <button
            type="button"
            role="tab"
            id="tab-layers"
            aria-selected={leftTab === 'layers'}
            aria-controls="gjs-layers-container"
            onClick={() => setLeftTab('layers')}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              leftTab === 'layers'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            Layers
          </button>
        </div>
        <div className="flex-1 overflow-y-auto relative custom-scrollbar">
          <div
            id="gjs-blocks"
            role="tabpanel"
            aria-labelledby="tab-blocks"
            className={leftTab === 'blocks' ? 'block p-2' : 'hidden'}
          ></div>
          <div
            id="gjs-layers-container"
            role="tabpanel"
            aria-labelledby="tab-layers"
            className={leftTab === 'layers' ? 'block' : 'hidden'}
          >
            {/* Layers panel header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/50">
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-purple-500/15">
                <FolderTree size={14} className="text-purple-400" />
              </div>
              <span className="text-sm font-semibold text-zinc-200 tracking-wide">
                Layers
              </span>
            </div>
            <div id="gjs-layers"></div>
          </div>
        </div>
      </div>

      {/* Center Canvas Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-black relative">
        {/* Topbar */}
        <div
          role="toolbar"
          aria-label="Canvas View and Editing Actions"
          className="h-12 bg-[#1e1e24] border-b border-zinc-800 flex items-center justify-center gap-2 px-4 z-10 shadow-sm"
        >
          <div
            className="flex bg-zinc-900 rounded-md p-1 border border-zinc-800"
            role="group"
            aria-label="Device viewport switcher"
          >
            <button
              type="button"
              onClick={() => editorRef.current?.setDevice('Desktop')}
              aria-pressed={activeDevice === 'Desktop'}
              aria-label="Desktop viewport"
              className={`p-1.5 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${activeDevice === 'Desktop' ? 'text-white bg-zinc-700' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
              title="Desktop"
            >
              <Monitor size={16} />
            </button>
            <button
              type="button"
              onClick={() => editorRef.current?.setDevice('Mobile')}
              aria-pressed={activeDevice === 'Mobile'}
              aria-label="Mobile viewport"
              className={`p-1.5 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${activeDevice === 'Mobile' ? 'text-white bg-zinc-700' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
              title="Mobile"
            >
              <Smartphone size={16} />
            </button>
          </div>

          <div className="w-px h-6 bg-zinc-800 mx-2" aria-hidden="true"></div>

          <button
            type="button"
            onClick={() => editorRef.current?.runCommand('core:undo')}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
            title="Undo"
            aria-label="Undo canvas change"
          >
            <Undo size={16} />
          </button>
          <button
            type="button"
            onClick={() => editorRef.current?.runCommand('core:redo')}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
            title="Redo"
            aria-label="Redo canvas change"
          >
            <Redo size={16} />
          </button>

          <div className="w-px h-6 bg-zinc-800 mx-2" aria-hidden="true"></div>

          <button
            type="button"
            onClick={() => {
              if (outlineActive)
                editorRef.current?.stopCommand('core:component-outline');
              else editorRef.current?.runCommand('core:component-outline');
            }}
            aria-pressed={outlineActive}
            className={`p-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${outlineActive ? 'text-white bg-zinc-700' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            title="Toggle Outline"
            aria-label="Toggle component outlines"
          >
            <div className="w-4 h-4 border border-current border-dashed rounded-sm"></div>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!document.fullscreenElement) {
                wrapperRef.current
                  ?.requestFullscreen()
                  .catch((err) =>
                    browserLogger.error('Fullscreen request failed:', err),
                  );
              } else {
                document.exitFullscreen();
              }
            }}
            aria-pressed={isFullscreen}
            className={`p-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${isFullscreen ? 'text-white bg-zinc-700' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            title="Fullscreen"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            <Maximize size={16} />
          </button>

          <button
            type="button"
            onClick={() => editorRef.current?.runCommand('export-template')}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
            title="View Code"
            aria-label="Export and view canvas template code"
          >
            <Code size={16} />
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm('Are you sure you want to clear the canvas?')) {
                editorRef.current?.runCommand('core:canvas-clear');
              }
            }}
            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            title="Clear Canvas"
            aria-label="Clear canvas contents"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-hidden relative">
          <div ref={containerRef} className="absolute inset-0" />
          {isEngineLoading && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#18181b]/90 backdrop-blur-sm transition-opacity duration-300">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
              <p className="mt-3 text-sm font-medium text-zinc-300">
                Initializing visual page builder...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-72 flex flex-col bg-[#1e1e24] border-l border-zinc-800 z-10 shadow-xl">
        <div
          role="tablist"
          aria-label="Properties and Styles"
          className="flex border-b border-zinc-800 p-2 gap-1"
        >
          <button
            type="button"
            role="tab"
            id="tab-styles"
            aria-selected={rightTab === 'styles'}
            aria-controls="gjs-styles"
            onClick={() => setRightTab('styles')}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              rightTab === 'styles'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            Styles
          </button>
          <button
            type="button"
            role="tab"
            id="tab-traits"
            aria-selected={rightTab === 'traits'}
            aria-controls="gjs-traits"
            onClick={() => setRightTab('traits')}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              rightTab === 'traits'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            Properties
          </button>
        </div>
        <div className="flex-1 overflow-y-auto relative custom-scrollbar">
          <div
            id="gjs-styles"
            role="tabpanel"
            aria-labelledby="tab-styles"
            className={rightTab === 'styles' ? 'block' : 'hidden'}
          ></div>
          <div
            id="gjs-traits"
            role="tabpanel"
            aria-labelledby="tab-traits"
            className={rightTab === 'traits' ? 'block' : 'hidden'}
          ></div>
        </div>
      </div>

      {/* Centralized Media Asset Picker Modal */}
      <MediaAssetPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => {
          setIsMediaPickerOpen(false);
          mediaPickerCallbackRef.current = null;
        }}
        onSelect={(asset) => {
          const fullUrl = getMediaFileUrl(asset.url);
          if (mediaPickerCallbackRef.current) {
            mediaPickerCallbackRef.current(fullUrl);
          }
          setIsMediaPickerOpen(false);
          mediaPickerCallbackRef.current = null;
        }}
        title="Visual Asset Manager - Insert into Canvas"
      />
    </div>
  );
});
