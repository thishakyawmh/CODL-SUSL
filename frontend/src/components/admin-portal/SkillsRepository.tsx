import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Tag, Filter, Edit3, Award, Check, X, BookOpen, Layers, RefreshCw, BarChart2 } from 'lucide-react';
import { curriculumAlignmentService, courseService } from '../../services/apiService';
import { toast } from '../../utils/toast';
import './SkillsRepository.css';

interface SkillItem {
    id: number;
    course_id: number;
    semester_id: number | null;
    subject_id: number | null;
    skill: string;
    category: string | null;
    course?: { title: string; code: string; level: string };
    subject?: { name: string; code: string };
}

const CATEGORIES = [
    'Software Development',
    'Information Systems',
    'Intelligent Systems',
    'Security',
    'Infrastructure',
    'Data Analytics',
    'Core Subjects'
];

export const SkillsRepository: React.FC = () => {
    const navigate = useNavigate();
    const [skills, setSkills] = useState<SkillItem[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [courseFilter, setCourseFilter] = useState('all');
    
    // Editing Category state
    const [editingSkillId, setEditingSkillId] = useState<number | null>(null);
    const [tempCategory, setTempCategory] = useState('');

    const loadSkillsAndCourses = async () => {
        setIsLoading(true);
        try {
            const [skillsData, coursesData] = await Promise.all([
                curriculumAlignmentService.getSkills(),
                courseService.getAll()
            ]);
            setSkills(skillsData.skills || []);
            setCourses(coursesData || []);
        } catch (err) {
            console.error('Failed to load skills database:', err);
            toast.error('Failed to load skills repository.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadSkillsAndCourses();
    }, []);

    const handleSaveCategory = async (skillId: number) => {
        if (!tempCategory) return;
        try {
            await curriculumAlignmentService.updateSkillCategory(skillId, tempCategory);
            setSkills(prev => prev.map(s => s.id === skillId ? { ...s, category: tempCategory } : s));
            setEditingSkillId(null);
            toast.success('Skill category updated successfully.');
        } catch (err) {
            console.error('Failed to update category:', err);
            toast.error('Failed to save category.');
        }
    };

    // Filter Skills
    const filteredSkills = skills.filter(item => {
        const matchesSearch = item.skill.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.subject?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
        const matchesCourse = courseFilter === 'all' || item.course_id.toString() === courseFilter;
        
        return matchesSearch && matchesCategory && matchesCourse;
    });

    // Compute Category distribution for custom SVG chart
    const categoryCounts = CATEGORIES.reduce((acc, cat) => {
        acc[cat] = skills.filter(s => s.category === cat).length;
        return acc;
    }, {} as Record<string, number>);

    const maxCount = Math.max(...Object.values(categoryCounts), 1);

    return (
        <div className="sr-container">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Skills Repository</h1>
                    <p className="admin-page-subtitle">
                        View and manage the centralized repository of all competencies extracted from university program modules.
                    </p>
                </div>
                <div className="admin-header-actions">
                    <button className="admin-btn-outline" onClick={loadSkillsAndCourses} disabled={isLoading}>
                        <RefreshCw size={14} className={isLoading ? 'spin' : ''} /> Refresh
                    </button>
                </div>
            </div>

            {/* Top KPI row */}
            <div className="sr-kpi-row">
                <div className="sr-kpi-card">
                    <div className="kpi-icon total"><Tag size={20} /></div>
                    <div className="kpi-info">
                        <span className="kpi-val">{skills.length}</span>
                        <span className="kpi-label">Total Unique Skills</span>
                    </div>
                </div>

                <div className="sr-kpi-card">
                    <div className="kpi-icon courses"><BookOpen size={20} /></div>
                    <div className="kpi-info">
                        <span className="kpi-val">{new Set(skills.map(s => s.course_id)).size}</span>
                        <span className="kpi-label">Program Mappings</span>
                    </div>
                </div>

                <div className="sr-kpi-card">
                    <div className="kpi-icon categories"><Layers size={20} /></div>
                    <div className="kpi-info">
                        <span className="kpi-val">
                            {skills.filter(s => !s.category || s.category === 'Core Subjects').length}
                        </span>
                        <span className="kpi-label">Core / Uncategorized</span>
                    </div>
                </div>
            </div>

            {/* Custom SVG Analytics */}
            <div className="sr-analytics-box">
                <div className="srab-header">
                    <BarChart2 size={16} />
                    <h3>Skills Distribution by Category</h3>
                </div>
                <div className="srab-body">
                    {CATEGORIES.map(cat => {
                        const count = categoryCounts[cat] || 0;
                        const percentage = (count / maxCount) * 100;
                        return (
                            <div key={cat} className="category-chart-row">
                                <span className="cat-name">{cat}</span>
                                <div className="bar-wrapper">
                                    <div className="bar-fill" style={{ width: `${percentage}%` }}></div>
                                </div>
                                <span className="cat-count">{count} skill{count !== 1 ? 's' : ''}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Filters Row */}
            <div className="sr-filters-row">
                <div className="filter-item search">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search skill name or subject..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="filter-item dropdown">
                    <Filter size={14} />
                    <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                        <option value="all">All Categories</option>
                        {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-item dropdown">
                    <BookOpen size={14} />
                    <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
                        <option value="all">All Degree Programs</option>
                        {courses.map(course => (
                            <option key={course.id} value={course.id}>{course.code} - {course.title}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Skills Table */}
            <div className="sr-table-card">
                {isLoading ? (
                    <div className="sr-loading-state">
                        <div className="sr-spinner"></div>
                        <p>Loading skills database...</p>
                    </div>
                ) : filteredSkills.length === 0 ? (
                    <div className="sr-empty-state">
                        <Tag size={48} className="empty-icon" />
                        <h3>No Skills Found</h3>
                        <p>No competencies match your filters. Run "Skill Extraction" inside a course dashboard first.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="sr-table">
                            <thead>
                                <tr>
                                    <th>Skill</th>
                                    <th>Extracted From Module</th>
                                    <th>Program / Degree</th>
                                    <th>Level</th>
                                    <th>Category Assignment</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSkills.map(item => (
                                    <tr key={item.id}>
                                        <td className="skill-name-cell">
                                            <span className="skill-badge-tag">{item.skill}</span>
                                        </td>
                                        <td>
                                            <div className="module-info">
                                                <span className="module-name">{item.subject?.name || 'Curriculum Subject'}</span>
                                                <span className="module-code">{item.subject?.code || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="course-code-badge">{item.course?.code || 'N/A'}</span>
                                        </td>
                                        <td>
                                            <span className="level-badge">{item.course?.level || 'Degree'}</span>
                                        </td>
                                        <td>
                                            {editingSkillId === item.id ? (
                                                <div className="category-edit-cell">
                                                    <select
                                                        value={tempCategory}
                                                        onChange={(e) => setTempCategory(e.target.value)}
                                                        className="cat-select"
                                                    >
                                                        <option value="">Select Category</option>
                                                        {CATEGORIES.map(c => (
                                                            <option key={c} value={c}>{c}</option>
                                                        ))}
                                                    </select>
                                                    <button className="cell-btn save" onClick={() => handleSaveCategory(item.id)}>
                                                        <Check size={14} />
                                                    </button>
                                                    <button className="cell-btn cancel" onClick={() => setEditingSkillId(null)}>
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="category-display-cell">
                                                    <span className={`cat-label ${(item.category || 'Core Subjects').toLowerCase().replace(/\s/g, '-')}`}>
                                                        {item.category || 'Core Subjects'}
                                                    </span>
                                                    <button
                                                        className="edit-cat-btn"
                                                        onClick={() => {
                                                            setEditingSkillId(item.id);
                                                            setTempCategory(item.category || '');
                                                        }}
                                                    >
                                                        <Edit3 size={12} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
