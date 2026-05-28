import { useMemo, useState } from 'react';
import { ALL_SKILLS } from '../../data/skillsData';

const MAX_SKILLS = 15;

export default function SkillsSelector({ value = [], onChange, error }) {
  const [search, setSearch] = useState('');
  const [customSkill, setCustomSkill] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALL_SKILLS.slice(0, 40);
    return ALL_SKILLS.filter((s) => s.toLowerCase().includes(q)).slice(0, 50);
  }, [search]);

  const toggle = (skill) => {
    if (value.includes(skill)) {
      onChange(value.filter((s) => s !== skill));
      return;
    }
    if (value.length >= MAX_SKILLS) return;
    onChange([...value, skill]);
  };

  const addCustom = () => {
    const skill = customSkill.trim();
    if (!skill || value.includes(skill) || value.length >= MAX_SKILLS) return;
    onChange([...value, skill]);
    setCustomSkill('');
  };

  return (
    <div>
      <label className="text-sm font-medium text-text">
        Skills ({value.length}/{MAX_SKILLS}, min 3)
      </label>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search skills..."
        className="w-full mt-1.5 px-4 py-2.5 bg-surface border border-border rounded-lg text-text text-sm"
      />
      <div className="flex flex-wrap gap-2 mt-2 max-h-40 overflow-y-auto p-2 border border-border rounded-lg bg-surface">
        {filtered.map((skill) => (
          <button
            key={skill}
            type="button"
            onClick={() => toggle(skill)}
            className={`px-3 py-1 rounded-full text-xs border transition-colors ${
              value.includes(skill)
                ? 'bg-primary/20 text-primary border-primary/40'
                : 'bg-card text-muted border-border hover:border-primary/30'
            }`}
          >
            {skill}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mt-2">
        <input
          type="text"
          value={customSkill}
          onChange={(e) => setCustomSkill(e.target.value)}
          placeholder="Other skill..."
          className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text"
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustom())}
        />
        <button
          type="button"
          onClick={addCustom}
          className="px-3 py-2 text-sm rounded-lg border border-border hover:bg-card"
        >
          Add
        </button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {value.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/15 text-primary border border-primary/30"
            >
              {s}
              <button type="button" onClick={() => toggle(s)} className="hover:text-error">×</button>
            </span>
          ))}
        </div>
      )}
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  );
}
