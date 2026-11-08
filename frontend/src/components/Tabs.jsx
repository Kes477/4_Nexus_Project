import React from 'react';

const Tabs = ({ tabs, activeTab, onChange }) => {
    return (
        <div className="tabs">
            {tabs.map((tab, index) => (
                <button
                key={index}
                className={`tab ${activeTab === index ? 'active' : ''}`}
                onClick={() => onChange(index)}
                >
                    {tab}
                </button>
            ))}
        </div>
    );
};

export default Tabs;