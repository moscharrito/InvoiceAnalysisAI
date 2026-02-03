import React, { useState, useRef, useEffect } from 'react';
import { Project, mockProjects, projectTypeLabels, projectTypeColors, formatBudget } from '../types/project';

interface ProjectSelectorProps {
  selectedProject: Project | null;
  onSelectProject: (project: Project | null) => void;
  disabled?: boolean;
}

export default function ProjectSelector({ selectedProject, onSelectProject, disabled = false }: ProjectSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter projects based on search term
  const filteredProjects = mockProjects.filter((project) => {
    const search = searchTerm.toLowerCase();
    return (
      project.status === 'active' && (
        project.name.toLowerCase().includes(search) ||
        project.client?.toLowerCase().includes(search) ||
        project.address?.toLowerCase().includes(search) ||
        projectTypeLabels[project.type].toLowerCase().includes(search)
      )
    );
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (project: Project) => {
    onSelectProject(project);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectProject(null);
    setSearchTerm('');
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* Label */}
      <label className="block text-sm font-medium text-charcoal-700 mb-2">
        Associate with Project/Property
      </label>

      {/* Selector Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-3 text-left rounded-xl border transition-all duration-200
          ${disabled
            ? 'bg-charcoal-50 cursor-not-allowed opacity-60'
            : 'bg-white/80 hover:bg-white cursor-pointer'
          }
          ${isOpen
            ? 'border-amber-400 ring-2 ring-amber-100'
            : 'border-charcoal-200 hover:border-amber-300'
          }
          ${selectedProject ? 'border-amber-300' : ''}
        `}
      >
        {selectedProject ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {/* Project Type Icon */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${projectTypeColors[selectedProject.type]}`}>
                {selectedProject.type === 'construction' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                )}
                {selectedProject.type === 'property' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                )}
                {selectedProject.type === 'renovation' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                  </svg>
                )}
                {selectedProject.type === 'development' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                )}
              </div>

              {/* Project Info */}
              <div className="min-w-0">
                <p className="text-sm font-medium text-charcoal-800 truncate">{selectedProject.name}</p>
                <p className="text-xs text-charcoal-500 truncate">{selectedProject.client}</p>
              </div>
            </div>

            {/* Clear Button */}
            {!disabled && (
              <button
                onClick={handleClear}
                className="p-1 hover:bg-charcoal-100 rounded-full transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4 text-charcoal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between text-charcoal-400">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-charcoal-100 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-sm">Select a project or property...</span>
            </div>
            <svg className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-charcoal-100 overflow-hidden animate-fade-in">
          {/* Search Input */}
          <div className="p-3 border-b border-charcoal-100">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-charcoal-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
            </div>
          </div>

          {/* Projects List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleSelect(project)}
                  className={`
                    w-full px-4 py-3 text-left hover:bg-amber-50 transition-colors border-b border-charcoal-50 last:border-0
                    ${selectedProject?.id === project.id ? 'bg-amber-50' : ''}
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Project Type Badge */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${projectTypeColors[project.type]}`}>
                      {project.type === 'construction' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      )}
                      {project.type === 'property' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      )}
                      {project.type === 'renovation' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                        </svg>
                      )}
                      {project.type === 'development' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      )}
                    </div>

                    {/* Project Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium text-charcoal-800 truncate">{project.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${projectTypeColors[project.type]}`}>
                          {projectTypeLabels[project.type]}
                        </span>
                      </div>
                      <p className="text-xs text-charcoal-500 truncate">{project.client}</p>
                      <div className="flex items-center gap-3 mt-1">
                        {project.address && (
                          <span className="text-xs text-charcoal-400 truncate flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {project.address}
                          </span>
                        )}
                        {project.budget && (
                          <span className="text-xs text-charcoal-400 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatBudget(project.budget)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Selected Indicator */}
                    {selectedProject?.id === project.id && (
                      <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-charcoal-400">
                <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">No projects found</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-charcoal-50 border-t border-charcoal-100">
            <p className="text-xs text-charcoal-400 text-center">
              {filteredProjects.length} active project{filteredProjects.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
