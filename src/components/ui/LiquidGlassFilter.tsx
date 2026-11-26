import React from 'react';

/**
 * Defines a global SVG optical lens displacement filter (`#lp-lens-filter`)
 * referenced by `.liquid-glass` surfaces so light bands and 3D highlights subtly
 * refract through curved frosted edges like iOS Liquid Glass.
 */
export function LiquidGlassFilter() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed w-0 h-0 overflow-hidden"
      style={{ position: 'fixed', width: 0, height: 0 }}
    >
      <defs>
        <filter id="lp-lens-filter" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.008 0.008"
            numOctaves="2"
            seed="17"
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation="2.5" result="smoothNoise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="smoothNoise"
            scale="6"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
