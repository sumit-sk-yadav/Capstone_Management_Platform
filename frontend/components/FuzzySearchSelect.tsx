'use client';

import { useState, useEffect, useRef } from 'react';
import Fuse from 'fuse.js';

interface SearchOption {
    id: number;
    student_id: string;
    first_name: string;
    last_name: string;
    email: string;
}

interface FuzzySearchSelectProps {
    options: SearchOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export default function FuzzySearchSelect({
    options,
    value,
    onChange,
    placeholder = 'Search for a classmate...',
    disabled = false,
}: FuzzySearchSelectProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [filteredOptions, setFilteredOptions] = useState<SearchOption[]>(options);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Configure Fuse.js for fuzzy searching
    const fuse = new Fuse(options, {
        keys: ['first_name', 'last_name', 'email', 'student_id'],
        threshold: 0.3,
        includeScore: true,
    });

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredOptions(options);
        } else {
            const results = fuse.search(searchTerm);
            setFilteredOptions(results.map(result => result.item));
        }
        setSelectedIndex(0);
    }, [searchTerm, options]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'Enter') {
                setIsOpen(true);
                e.preventDefault();
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < filteredOptions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredOptions[selectedIndex]) {
                    handleSelect(filteredOptions[selectedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                setSearchTerm('');
                break;
        }
    };

    const handleSelect = (option: SearchOption) => {
        onChange(option.id.toString());
        setSearchTerm('');
        setIsOpen(false);
        inputRef.current?.blur();
    };

    const highlightMatch = (text: string, search: string) => {
        if (!search.trim()) return text;

        const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);

        return parts.map((part, index) =>
            regex.test(part) ? (
                <span key={index} className="bg-yellow-200 font-semibold">{part}</span>
            ) : (
                part
            )
        );
    };

    return (
        <div ref={containerRef} className="relative w-full">
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    className="w-full p-2 pr-10 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                />
                <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {filteredOptions.length > 0 ? (
                        <ul className="py-1">
                            {filteredOptions.map((option, index) => (
                                <li
                                    key={option.id}
                                    className={`px-4 py-2 cursor-pointer transition-colors ${index === selectedIndex
                                            ? 'bg-blue-100 text-blue-900'
                                            : 'hover:bg-gray-100 text-gray-800'
                                        }`}
                                    onClick={() => handleSelect(option)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                >
                                    <div className="font-medium">
                                        {highlightMatch(`${option.first_name} ${option.last_name}`, searchTerm)}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {highlightMatch(option.email, searchTerm)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        ID: {highlightMatch(option.student_id, searchTerm)}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="px-4 py-8 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p className="text-gray-600 font-medium">No learners found</p>
                            <p className="text-sm text-gray-500 mt-1">
                                {searchTerm.trim()
                                    ? 'No learners in your cohort match your search.'
                                    : 'There are no other learners in your cohort.'}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
