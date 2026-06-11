import React from 'react';
import { ChevronRight } from 'lucide-react';
import './ResultsCard.css';

interface Result {
    id: string;
    title: string;
    progress: number;
    color: string;
}

const resultsData: Result[] = [
    { id: '1', title: 'English - Quiz- 01', progress: 37, color: '#f56565' },
    { id: '2', title: 'English - Quiz- 02', progress: 87, color: '#48bb78' },
    { id: '3', title: 'Science - Quiz- 01', progress: 50, color: '#1a202c' },
    { id: '4', title: 'English - Quiz- 01', progress: 37, color: '#f56565' },
    { id: '5', title: 'English - Quiz- 01', progress: 100, color: '#7C3AED' },
];

export const ResultsCard: React.FC = () => {
    return (
        <div className="card results-card">
            <div className="results-header">
                <h3 className="card-title">Recent Results</h3>
                <button className="view-more-link">
                    View More <ChevronRight size={14} />
                </button>
            </div>

            <div className="results-list">
                {resultsData.map((result, index) => (
                    <div className="result-item" key={index}>
                        <span className="result-title">{result.title}</span>
                        <div className="progress-container">
                            <div
                                className="progress-bar"
                                style={{ width: `${result.progress}%`, backgroundColor: result.color }}
                            ></div>
                        </div>
                        <span className="result-percent" style={{ color: result.color }}>
                            {result.progress}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
