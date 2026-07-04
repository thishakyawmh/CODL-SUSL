import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import './SkillSelector.css';
import skillsData from '../../data/skillsData.json';

interface SkillSelectorProps {
    selectedSkills: string[];
    onChange: (skills: string[]) => void;
    placeholder?: string;
}

export const SkillSelector: React.FC<SkillSelectorProps> = ({ 
    selectedSkills, 
    onChange,
    placeholder = "Type to search skills..."
}) => {
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (inputValue.trim()) {
                const searchLower = inputValue.toLowerCase();
                const filtered = skillsData
                    .filter(skill => 
                        skill.toLowerCase().includes(searchLower) && 
                        !selectedSkills.includes(skill)
                    )
                    .slice(0, 15); // Virtualized/limited to top 15 results
                setSuggestions(filtered);
                setIsDropdownOpen(true);
                setActiveIndex(-1);
            } else {
                setSuggestions([]);
                setIsDropdownOpen(false);
            }
        }, 250);

        return () => clearTimeout(timer);
    }, [inputValue, selectedSkills]);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleAddSkill = (skill: string) => {
        const trimmed = skill.trim();
        if (trimmed && !selectedSkills.includes(trimmed)) {
            onChange([...selectedSkills, trimmed]);
        }
        setInputValue('');
        setIsDropdownOpen(false);
        inputRef.current?.focus();
    };

    const handleRemoveSkill = (skillToRemove: string) => {
        onChange(selectedSkills.filter(s => s !== skillToRemove));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !inputValue && selectedSkills.length > 0) {
            // Remove last item on backspace if input is empty
            handleRemoveSkill(selectedSkills[selectedSkills.length - 1]);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (isDropdownOpen) {
                setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (isDropdownOpen) {
                setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (isDropdownOpen && activeIndex >= 0 && activeIndex < suggestions.length) {
                handleAddSkill(suggestions[activeIndex]);
            } else if (inputValue.trim()) {
                // Add custom skill if it doesn't match a suggestion perfectly but user hit enter
                handleAddSkill(inputValue);
            }
        }
    };

    return (
        <div className="skill-selector-container" ref={wrapperRef}>
            <div className="skill-tags-wrapper" onClick={() => inputRef.current?.focus()}>
                {selectedSkills.map(skill => (
                    <span key={skill} className="skill-tag">
                        {skill}
                        <button 
                            type="button" 
                            className="skill-tag-remove"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveSkill(skill);
                            }}
                        >
                            <X size={14} />
                        </button>
                    </span>
                ))}
                <input
                    ref={inputRef}
                    type="text"
                    className="skill-input"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedSkills.length === 0 ? placeholder : ""}
                />
            </div>

            {isDropdownOpen && inputValue.trim() && (
                <div className="skill-suggestions-dropdown">
                    {suggestions.length > 0 ? (
                        suggestions.map((suggestion, index) => (
                            <div 
                                key={suggestion}
                                className={`skill-suggestion-item ${index === activeIndex ? 'active' : ''}`}
                                onClick={() => handleAddSkill(suggestion)}
                                onMouseEnter={() => setActiveIndex(index)}
                            >
                                {suggestion}
                            </div>
                        ))
                    ) : (
                        <div className="skill-no-results">
                            No exact matches found. 
                            <span 
                                className="skill-add-custom"
                                onClick={() => handleAddSkill(inputValue)}
                            >
                                 Press Enter to add "{inputValue}"
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
