/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import {
  Settings,
  Plus,
  X,
  MessageCircleQuestion,
  PaintBucket,
  Type,
} from 'lucide-react';
import {
  usePageBuilderStore,
  FAQItem,
  FAQ_DEFAULTS,
} from '../stores/pageBuilderStore';

export const FAQSettings: React.FC<{ targetComponentId: string }> = ({
  targetComponentId,
}) => {
  const settings = usePageBuilderStore(
    (state) => state.faq[targetComponentId] ?? FAQ_DEFAULTS,
  );
  const setFAQ = usePageBuilderStore((state) => state.setFAQ);

  const [newQuestion, setNewQuestion] = useState('');

  const handleChange = (
    field: keyof typeof settings,
    value: string | number | boolean | any[],
  ) => {
    setFAQ(targetComponentId, { [field]: value });
  };

  const handleAddQuestion = () => {
    if (!newQuestion.trim()) return;
    const newItem: FAQItem = {
      id: Math.random().toString(36).substring(7),
      question: newQuestion,
      answer: 'This is the answer to your new question. Edit this text.',
    };
    handleChange('items', [...settings.items, newItem]);
    setNewQuestion('');
  };

  const handleRemoveQuestion = (id: string) => {
    handleChange(
      'items',
      settings.items.filter((q) => q.id !== id),
    );
  };

  const handleQuestionChange = (
    id: string,
    field: keyof FAQItem,
    value: string,
  ) => {
    handleChange(
      'items',
      settings.items.map((q) => (q.id === id ? { ...q, [field]: value } : q)),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-border">
        <Settings className="w-5 h-5 text-primary" />
        <h3 className="font-medium text-foreground">FAQ Settings</h3>
      </div>

      {/* Header Info */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Type className="w-4 h-4 text-muted-foreground" />
          Header Content
        </h4>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Title</label>
          <input
            type="text"
            value={settings.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
          />
          <label className="text-xs text-muted-foreground">
            Description (Optional)
          </label>
          <input
            type="text"
            value={settings.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
          />
        </div>
      </div>

      {/* Questions Manager */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <MessageCircleQuestion className="w-4 h-4 text-muted-foreground" />
          Questions & Answers
        </h4>

        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {settings.items.map((item, index) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 bg-muted/30 p-3 rounded-md border border-border"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-muted-foreground">
                  Q{index + 1}
                </span>
                <button
                  onClick={() => handleRemoveQuestion(item.id)}
                  className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <input
                type="text"
                value={item.question}
                onChange={(e) =>
                  handleQuestionChange(item.id, 'question', e.target.value)
                }
                className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background font-medium"
                placeholder="Question"
              />
              <textarea
                value={item.answer}
                onChange={(e) =>
                  handleQuestionChange(item.id, 'answer', e.target.value)
                }
                className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
                placeholder="Answer"
                rows={3}
              />
            </div>
          ))}
        </div>

        {/* Add New */}
        <div className="flex flex-col gap-2 mt-4 p-3 bg-muted/50 rounded-md border border-border border-dashed">
          <input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
            placeholder="New Question"
            onKeyDown={(e) => e.key === 'Enter' && handleAddQuestion()}
          />
          <button
            onClick={handleAddQuestion}
            disabled={!newQuestion.trim()}
            className="w-full py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-1 mt-1"
          >
            <Plus className="w-3 h-3" />
            Add Question
          </button>
        </div>
      </div>

      {/* Styling */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <PaintBucket className="w-4 h-4 text-muted-foreground" />
          Appearance
        </h4>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Background Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={settings.backgroundColor}
                onChange={(e) =>
                  handleChange('backgroundColor', e.target.value)
                }
                className="w-8 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings.backgroundColor}
                onChange={(e) =>
                  handleChange('backgroundColor', e.target.value)
                }
                className="flex-1 px-2 py-1 text-xs border border-input rounded-md bg-background"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Accordion Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={settings.accordionColor}
                onChange={(e) => handleChange('accordionColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings.accordionColor}
                onChange={(e) => handleChange('accordionColor', e.target.value)}
                className="flex-1 px-2 py-1 text-xs border border-input rounded-md bg-background"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Text Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={settings.textColor}
                onChange={(e) => handleChange('textColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings.textColor}
                onChange={(e) => handleChange('textColor', e.target.value)}
                className="flex-1 px-2 py-1 text-xs border border-input rounded-md bg-background"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
