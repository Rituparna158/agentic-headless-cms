import { useEffect, useRef, useState } from 'react';
import grapesjs, { Editor } from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import basicBlocksPlugin from 'grapesjs-blocks-basic';
import formsPlugin from 'grapesjs-plugin-forms';
import { CustomBlocksPlugin } from '../../components/grapesjs-plugins/CustomBlocksPlugin';
import { GrapesJSEditorProps } from './types';
import './GrapesJSTheme.css';
import {
  Undo,
  Redo,
  Monitor,
  Smartphone,
  Code,
  Trash2,
  Layers,
  Maximize,
} from 'lucide-react';
import { setupLayerIcons } from './components/LayerIconPlugin';

export function GrapesJSEditor({ initialData, onChange }: GrapesJSEditorProps) {
  const editorRef = useRef<Editor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isReadyRef = useRef(false);

  const [leftTab, setLeftTab] = useState<'blocks' | 'layers'>('blocks');
  const [rightTab, setRightTab] = useState<'styles' | 'traits'>('styles');
  const [activeDevice, setActiveDevice] = useState('Desktop');
  const [outlineActive, setOutlineActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
    if (!containerRef.current || editorRef.current) return;

    const editor = grapesjs.init({
      container: containerRef.current,
      fromElement: false,
      height: '100%',
      width: '100%',
      storageManager: false,
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
      plugins: [basicBlocksPlugin, formsPlugin, CustomBlocksPlugin],
    });

    editorRef.current = editor;

    // Load initial data
    if (initialData && initialData.builder === 'grapesjs') {
      try {
        if (initialData.projectData) {
          editor.loadProjectData(initialData.projectData);
        } else {
          // Fallback for old data format
          if (initialData.components) {
            editor.setComponents(initialData.components);
          }
          if (initialData.styles) {
            editor.setStyle(initialData.styles);
          }
        }
      } catch (e) {
        console.error('Error loading GrapesJS data:', e);
      }
    }

    const handleChange = () => {
      if (!isReadyRef.current) return;
      onChange({
        builder: 'grapesjs',
        projectData: editor.getProjectData(),
        // Keep HTML/CSS for external use if needed, but not required for saving
        html: editor.getHtml(),
        css: editor.getCss() || '',
      });
    };

    editor.on('load', () => {
      isReadyRef.current = true;
      setActiveDevice(editor.getDevice());
    });

    editor.on('change:device', () => {
      setActiveDevice(editor.getDevice());
    });

    editor.on('run:core:component-outline', () => setOutlineActive(true));
    editor.on('stop:core:component-outline', () => setOutlineActive(false));

    editor.on('update', handleChange);

    // Setup custom layer icons
    setupLayerIcons(editor);

    return () => {
      editor.destroy();
      editorRef.current = null;
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="flex h-full w-full bg-[#18181b] text-zinc-300 font-sans overflow-hidden"
    >
      {/* Left Sidebar */}
      <div className="w-64 flex flex-col bg-[#1e1e24] border-r border-zinc-800 z-10 shadow-xl relative overflow-hidden">
        {/* Bottom gradient accent glow */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-purple-500/5 to-transparent z-0" />
        <div className="flex border-b border-zinc-800 p-2 gap-1 z-10 relative">
          <button
            onClick={() => setLeftTab('blocks')}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-colors ${
              leftTab === 'blocks'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            Blocks
          </button>
          <button
            onClick={() => setLeftTab('layers')}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-colors ${
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
            className={leftTab === 'blocks' ? 'block p-2' : 'hidden'}
          ></div>
          <div className={leftTab === 'layers' ? 'block' : 'hidden'}>
            {/* Layers panel header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/50">
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-purple-500/15">
                <Layers size={14} className="text-purple-400" />
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
        <div className="h-12 bg-[#1e1e24] border-b border-zinc-800 flex items-center justify-center gap-2 px-4 z-10 shadow-sm">
          <div className="flex bg-zinc-900 rounded-md p-1 border border-zinc-800">
            <button
              onClick={() => editorRef.current?.setDevice('Desktop')}
              className={`p-1.5 rounded transition-colors ${activeDevice === 'Desktop' ? 'text-white bg-zinc-700' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
              title="Desktop"
            >
              <Monitor size={16} />
            </button>
            <button
              onClick={() => editorRef.current?.setDevice('Mobile')}
              className={`p-1.5 rounded transition-colors ${activeDevice === 'Mobile' ? 'text-white bg-zinc-700' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
              title="Mobile"
            >
              <Smartphone size={16} />
            </button>
          </div>

          <div className="w-px h-6 bg-zinc-800 mx-2"></div>

          <button
            onClick={() => editorRef.current?.runCommand('core:undo')}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
            title="Undo"
          >
            <Undo size={16} />
          </button>
          <button
            onClick={() => editorRef.current?.runCommand('core:redo')}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
            title="Redo"
          >
            <Redo size={16} />
          </button>

          <div className="w-px h-6 bg-zinc-800 mx-2"></div>

          <button
            onClick={() => {
              if (outlineActive)
                editorRef.current?.stopCommand('core:component-outline');
              else editorRef.current?.runCommand('core:component-outline');
            }}
            className={`p-2 rounded-md transition-colors ${outlineActive ? 'text-white bg-zinc-700' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            title="Toggle Outline"
          >
            <div className="w-4 h-4 border border-current border-dashed rounded-sm"></div>
          </button>

          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                wrapperRef.current?.requestFullscreen().catch(console.error);
              } else {
                document.exitFullscreen();
              }
            }}
            className={`p-2 rounded-md transition-colors ${isFullscreen ? 'text-white bg-zinc-700' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            title="Fullscreen"
          >
            <Maximize size={16} />
          </button>

          <button
            onClick={() => editorRef.current?.runCommand('export-template')}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
            title="View Code"
          >
            <Code size={16} />
          </button>

          <button
            onClick={() => {
              if (confirm('Are you sure you want to clear the canvas?')) {
                editorRef.current?.runCommand('core:canvas-clear');
              }
            }}
            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-md transition-colors"
            title="Clear Canvas"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-hidden relative">
          <div ref={containerRef} className="absolute inset-0" />
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-72 flex flex-col bg-[#1e1e24] border-l border-zinc-800 z-10 shadow-xl">
        <div className="flex border-b border-zinc-800 p-2 gap-1">
          <button
            onClick={() => setRightTab('styles')}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-colors ${
              rightTab === 'styles'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            Styles
          </button>
          <button
            onClick={() => setRightTab('traits')}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-colors ${
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
            className={rightTab === 'styles' ? 'block' : 'hidden'}
          ></div>
          <div
            id="gjs-traits"
            className={rightTab === 'traits' ? 'block' : 'hidden'}
          ></div>
        </div>
      </div>
    </div>
  );
}
