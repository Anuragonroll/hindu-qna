import React from 'react';

const ShlokaCard = ({ shloka }) => {
  if (!shloka) return null;
  return (
    <div className="my-4 border-l-4 border-orange-400 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-r-lg p-4 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div className="text-xs font-semibold text-orange-700 uppercase tracking-wider">
          📖 {shloka.label || shloka.raw}
        </div>
        {shloka.url && (
          <a
            href={shloka.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-orange-600 hover:text-orange-800 underline flex-shrink-0 ml-2"
          >
            vedabase.io ↗
          </a>
        )}
      </div>
      {shloka.sanskrit && (
        <div className="mb-2">
          <div className="text-xs text-gray-500 mb-1">Sanskrit</div>
          <div className="text-base text-gray-900 leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'serif' }}>
            {shloka.sanskrit}
          </div>
        </div>
      )}
      {shloka.iast && (
        <div className="mb-2">
          <div className="text-xs text-gray-500 mb-1">Transliteration</div>
          <div className="text-sm italic text-gray-700 leading-relaxed whitespace-pre-wrap">
            {shloka.iast}
          </div>
        </div>
      )}
      {shloka.translation && (
        <div className="mb-2">
          <div className="text-xs text-gray-500 mb-1">Translation</div>
          <div className="text-sm text-gray-800 leading-relaxed">
            {shloka.translation}
          </div>
        </div>
      )}
      {shloka.purport && (
        <details className="mt-2">
          <summary className="text-xs text-orange-700 cursor-pointer hover:text-orange-900 font-semibold">
            View purport
          </summary>
          <div className="text-xs text-gray-700 leading-relaxed mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap">
            {shloka.purport}
          </div>
        </details>
      )}
    </div>
  );
};

export default ShlokaCard;
