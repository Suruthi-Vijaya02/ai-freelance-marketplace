import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PlusCircle, Sparkles, Wand2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { projectService } from '../services/authService';
import { getApiErrorMessage } from '../utils/helpers';

const aiDescription =
  'We are seeking an experienced developer to build a solution for our platform. The ideal candidate will have relevant expertise and deliver on time and on budget.';

export default function CreateProjectPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', budget: '', skills: '', duration: '8 weeks', biddingEnabled: false });
  const [milestones, setMilestones] = useState([{ title: 'Phase 1', amount: '' }]);
  const [submitting, setSubmitting] = useState(false);

  const generateDescription = () => {
    setForm((f) => ({ ...f, description: aiDescription }));
  };

  const addMilestone = () => {
    setMilestones((m) => [...m, { title: `Phase ${m.length + 1}`, amount: '' }]);
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-text">Description</label>
              <Button type="button" size="sm" variant="secondary" onClick={generateDescription}>
                <Wand2 className="w-4 h-4" /> AI Generate
              </Button>
            </div>
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
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text">Milestones</label>
              <Button type="button" size="sm" variant="outline" onClick={addMilestone}>Add Milestone</Button>
            </div>
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
