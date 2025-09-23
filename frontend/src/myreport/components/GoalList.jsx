import React from 'react';

const GoalList = ({ goals }) => {
  return (
    <aside className="report-sidebar">
      {goals.map((goal) => (
        <button
          key={goal.id}
          className={`goal-button ${goal.isCurrent ? 'current-goal' : 'past-goal'}`}
        >
          {goal.text}
        </button>
      ))}
    </aside>
  );
};

export default GoalList;