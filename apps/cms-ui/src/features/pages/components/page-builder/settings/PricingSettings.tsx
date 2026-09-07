/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Settings, Plus, X, DollarSign, PaintBucket } from 'lucide-react';
import {
  usePageBuilderStore,
  PricingTier,
  PricingFeature,
  PRICING_DEFAULTS,
} from '../stores/pageBuilderStore';

export const PricingSettings: React.FC<{ targetComponentId: string }> = ({
  targetComponentId,
}) => {
  const settings = usePageBuilderStore(
    (state) => state.pricing[targetComponentId] ?? PRICING_DEFAULTS,
  );
  const setPricing = usePageBuilderStore((state) => state.setPricing);

  const [newTierName, setNewTierName] = useState('');

  const handleChange = (
    field: keyof typeof settings,
    value: string | number | boolean | any[],
  ) => {
    setPricing(targetComponentId, { [field]: value });
  };

  const handleAddTier = () => {
    if (!newTierName.trim()) return;
    const newTier: PricingTier = {
      id: Math.random().toString(36).substring(7),
      name: newTierName,
      price: '$99',
      cycle: '/month',
      description: 'New pricing tier description.',
      features: [{ id: 'f1', text: 'New Feature', included: true }],
      buttonText: 'Get Started',
      buttonUrl: '#',
      isPopular: false,
    };
    handleChange('tiers', [...settings.tiers, newTier]);
    setNewTierName('');
  };

  const handleRemoveTier = (id: string) => {
    handleChange(
      'tiers',
      settings.tiers.filter((t) => t.id !== id),
    );
  };

  const handleTierChange = (
    id: string,
    field: keyof PricingTier,
    value: string | number | boolean | any[],
  ) => {
    handleChange(
      'tiers',
      settings.tiers.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    );
  };

  const handleAddFeature = (tierId: string) => {
    const newFeature: PricingFeature = {
      id: Math.random().toString(36).substring(7),
      text: 'New Feature',
      included: true,
    };
    handleChange(
      'tiers',
      settings.tiers.map((t) =>
        t.id === tierId ? { ...t, features: [...t.features, newFeature] } : t,
      ),
    );
  };

  const handleFeatureChange = (
    tierId: string,
    featureId: string,
    field: keyof PricingFeature,
    value: string | number | boolean | any[],
  ) => {
    handleChange(
      'tiers',
      settings.tiers.map((t) => {
        if (t.id !== tierId) return t;
        return {
          ...t,
          features: t.features.map((f) =>
            f.id === featureId ? { ...f, [field]: value } : f,
          ),
        };
      }),
    );
  };

  const handleRemoveFeature = (tierId: string, featureId: string) => {
    handleChange(
      'tiers',
      settings.tiers.map((t) => {
        if (t.id !== tierId) return t;
        return { ...t, features: t.features.filter((f) => f.id !== featureId) };
      }),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-border">
        <Settings className="w-5 h-5 text-primary" />
        <h3 className="font-medium text-foreground">Pricing Table Settings</h3>
      </div>

      {/* Tiers Manager */}
      <div className="space-y-4 pt-2">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-muted-foreground" />
          Pricing Tiers
        </h4>

        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
          {settings.tiers.map((tier, index) => (
            <div
              key={tier.id}
              className="flex flex-col gap-3 bg-muted/30 p-3 rounded-md border border-border"
            >
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-xs font-semibold text-foreground">
                  Tier {index + 1}: {tier.name}
                </span>
                <button
                  onClick={() => handleRemoveTier(tier.id)}
                  className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* Tier Basics */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Name
                  </label>
                  <input
                    type="text"
                    value={tier.name}
                    onChange={(e) =>
                      handleTierChange(tier.id, 'name', e.target.value)
                    }
                    className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Highlight
                  </label>
                  <label className="flex items-center gap-2 px-2 py-1.5 text-xs border border-input rounded bg-background cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tier.isPopular}
                      onChange={(e) =>
                        handleTierChange(tier.id, 'isPopular', e.target.checked)
                      }
                      className="rounded border-input"
                    />
                    Most Popular
                  </label>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Price
                  </label>
                  <input
                    type="text"
                    value={tier.price}
                    onChange={(e) =>
                      handleTierChange(tier.id, 'price', e.target.value)
                    }
                    className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Cycle
                  </label>
                  <input
                    type="text"
                    value={tier.cycle}
                    onChange={(e) =>
                      handleTierChange(tier.id, 'cycle', e.target.value)
                    }
                    className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
                    placeholder="/month"
                  />
                </div>
              </div>
              <input
                type="text"
                value={tier.description}
                onChange={(e) =>
                  handleTierChange(tier.id, 'description', e.target.value)
                }
                className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
                placeholder="Description"
              />

              {/* Features List */}
              <div className="space-y-2 mt-2 bg-background p-2 rounded border border-border">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                  Features
                </span>
                {tier.features.map((feature) => (
                  <div key={feature.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={feature.included}
                      onChange={(e) =>
                        handleFeatureChange(
                          tier.id,
                          feature.id,
                          'included',
                          e.target.checked,
                        )
                      }
                      className="rounded border-input"
                    />
                    <input
                      type="text"
                      value={feature.text}
                      onChange={(e) =>
                        handleFeatureChange(
                          tier.id,
                          feature.id,
                          'text',
                          e.target.value,
                        )
                      }
                      className="flex-1 px-2 py-1 text-xs border border-input rounded bg-background"
                    />
                    <button
                      onClick={() => handleRemoveFeature(tier.id, feature.id)}
                      className="p-1 text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => handleAddFeature(tier.id)}
                  className="w-full py-1 text-xs text-primary font-medium hover:bg-primary/10 rounded transition-colors"
                >
                  + Add Feature
                </button>
              </div>

              {/* Button */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <input
                  type="text"
                  value={tier.buttonText}
                  onChange={(e) =>
                    handleTierChange(tier.id, 'buttonText', e.target.value)
                  }
                  className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
                  placeholder="Button Text"
                />
                <input
                  type="text"
                  value={tier.buttonUrl}
                  onChange={(e) =>
                    handleTierChange(tier.id, 'buttonUrl', e.target.value)
                  }
                  className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
                  placeholder="Button URL"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Add New Tier */}
        <div className="flex flex-col gap-2 mt-4 p-3 bg-muted/50 rounded-md border border-border border-dashed">
          <input
            type="text"
            value={newTierName}
            onChange={(e) => setNewTierName(e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
            placeholder="New Tier Name (e.g. Enterprise)"
            onKeyDown={(e) => e.key === 'Enter' && handleAddTier()}
          />
          <button
            onClick={handleAddTier}
            disabled={!newTierName.trim()}
            className="w-full py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-1 mt-1"
          >
            <Plus className="w-3 h-3" />
            Add Pricing Tier
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
            <label className="text-xs text-muted-foreground">Card Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={settings.cardColor}
                onChange={(e) => handleChange('cardColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings.cardColor}
                onChange={(e) => handleChange('cardColor', e.target.value)}
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
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Accent Color (Buttons/Popular)
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={settings.accentColor}
                onChange={(e) => handleChange('accentColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings.accentColor}
                onChange={(e) => handleChange('accentColor', e.target.value)}
                className="flex-1 px-2 py-1 text-xs border border-input rounded-md bg-background"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
