import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PlusCircle, Sparkles } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { projectService } from '../services/authService';
import { getApiErrorMessage } from '../utils/helpers';

export default function CreateProjectPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', budget: '', skills: '', duration: '8 weeks', biddingEnabled: false });
  const [milestones, setMilestones] = useState([{ title: 'Milestone 1', amount: '' }]);
  const [submitting, setSubmitting] = useState(false);

  const addMilestone = () => {
    setMilestones((m) => [...m, { title: `Milestone ${m.length + 1}`, amount: '' }]);
  };

  const applyMilestonePreset = (preset) => {
    if (preset === 'custom') {
      setMilestones([{ title: 'Milestone 1', amount: '' }]);
      return;
    }

    const budgetValue = Number(form.budget);
    const percentages = preset === '2' ? [0.5, 0.5] : [0.3, 0.4, 0.3];
    const nextMilestones = percentages.map((percent, index) => ({
      title: `Milestone ${index + 1}`,
      amount: Number.isFinite(budgetValue) && budgetValue > 0 ? String(Math.round(budgetValue * percent)) : '',
    }));

    setMilestones(nextMilestones);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const skills = form.skills.split(',').map((s) => s.trim()).filter(Boolean);
      const milestoneData = milestones
        .filter((m) => m.title && m.amount)
        .map((m) => ({ title: m.title, amount: Number(m.amount), status: 'pending' }));

      await projectService.createProject({
        title: form.title,
        description: form.description,
        budget: Number(form.budget),
        skills,
        category: 'General',
        duration: form.duration,
        status: 'open',
        milestones: milestoneData,
        biddingEnabled: Boolean(form.biddingEnabled),
      });
      toast.success('Project created successfully!');
      navigate('/dashboard/client');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-text">Create Project</h1>
        <p className="text-muted mt-1 font-light">Post a new project and start receiving proposals</p>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-6">
          <PlusCircle className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-text">Project Details</h2>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Project title"
            placeholder="e.g. AI Recommendation Engine"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <div>
            <label className="text-sm font-medium text-text">Description</label>
            <textarea
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe your project requirements..."
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Budget ($)"
              type="number"
              placeholder="15000"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              required
            />
            <Input
              label="Duration"
              placeholder="8 weeks"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
            />
          </div>
          <Input
            label="Required skills (comma-separated)"
            placeholder="React, Node.js, AI"
            value={form.skills}
            onChange={(e) => setForm({ ...form, skills: e.target.value })}
          />

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <label className="text-sm font-medium text-text">Milestones</label>
              <div className="flex items-center gap-2">
                <select
                  onChange={(e) => applyMilestonePreset(e.target.value)}
                  className="px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text"
                  defaultValue=""
                >
                  <option value="">Quick setup</option>
                  <option value="2">2 milestones — 50% / 50%</option>
                  <option value="3">3 milestones — 30% / 40% / 30%</option>
                  <option value="custom">Custom</option>
                </select>
                <Button type="button" size="sm" variant="outline" onClick={addMilestone}>Add Milestone</Button>
              </div>
            </div>
            <p className="text-sm text-muted mb-3">Optional. Choose a preset or add milestones manually.</p>
            <div className="space-y-2">
              {milestones.map((m, i) => (
                <div key={i} className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={m.title}
                    onChange={(e) => {
                      const next = [...milestones];
                      next[i] = { ...next[i], title: e.target.value };
                      setMilestones(next);
                    }}
                    placeholder="Milestone title"
                    className="px-3 py-2 bg-surface border border-border rounded-lg text-text text-sm"
                  />
                  <input
                    type="number"
                    value={m.amount}
                    onChange={(e) => {
                      const next = [...milestones];
                      next[i] = { ...next[i], amount: e.target.value };
                      setMilestones(next);
                    }}
                    placeholder="Amount ($)"
                    className="px-3 py-2 bg-surface border border-border rounded-lg text-text text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
            <input
              type="checkbox"
              checked={form.biddingEnabled}
              onChange={(e) => setForm({ ...form, biddingEnabled: e.target.checked })}
              className="rounded border-border"
            />
            Enable live bidding (optional auction-style leaderboard)
          </label>

          <Button type="submit" className="w-full" disabled={submitting}>
            <Sparkles className="w-4 h-4" /> {submitting ? 'Creating...' : 'Post Project'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
