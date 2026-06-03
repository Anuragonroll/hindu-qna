import React, { useState } from 'react';

const ShlokaTag = ({ shloka }) => {
  const [expanded, setExpanded] = useState(true);

  if (!shloka) return null;

  const toggle = () => setExpanded(prev => !prev);

  return (
    <span className="inline-flex flex-col align-middle mx-0.5">
      {/* Clickable header bar */}
      <button
        onClick={toggle}
        className="inline-flex items-center px-3 py-1 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-medium rounded-lg transition-all duration-150 cursor-pointer shadow-sm whitespace-nowrap select-none"
        title={expanded ? 'Click to collapse' : 'Click to expand'}
      >
        {shloka.label}
      </button>

      {/* Shloka content (expanded by default) */}
      {expanded && (
        <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg p-3 shadow-sm text-left">
          {shloka.sanskrit && (
            <div className="mb-2">
              <div className="text-[10px] text-orange-700 mb-0.5 uppercase tracking-wider font-semibold">Sanskrit</div>
              <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'serif' }}>
                {shloka.sanskrit}
              </div>
            </div>
          )}
          {shloka.iast && (
            <div className="mb-2">
              <div className="text-[10px] text-orange-700 mb-0.5 uppercase tracking-wider font-semibold">Transliteration</div>
              <div className="text-xs italic text-gray-700 leading-relaxed whitespace-pre-wrap">
                {shloka.iast}
              </div>
            </div>
          )}
          {shloka.translation && (
            <div className="mb-1">
              <div className="text-[10px] text-orange-700 mb-0.5 uppercase tracking-wider font-semibold">Translation</div>
              <div className="text-xs text-gray-800 leading-relaxed">
                {shloka.translation}
              </div>
            </div>
          )}
          {shloka.purport && (
            <details className="mt-1.5">
              <summary className="text-[11px] text-orange-700 cursor-pointer hover:text-orange-900 font-semibold select-none">
                View purport
              </summary>
              <div className="text-xs text-gray-700 leading-relaxed mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap">
                {shloka.purport}
              </div>
            </details>
          )}
          {shloka.url && (
            <a
              href={shloka.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-orange-600 hover:text-orange-800 underline mt-1.5 inline-block"
              onClick={(e) => e.stopPropagation()}
            >
              vedabase.io ↗
            </a>
          )}
        </div>
      )}
    </span>
  );
};

export default ShlokaTag;
