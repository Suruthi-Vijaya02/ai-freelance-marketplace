import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardCheck, Shield, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';
import { contractService } from '../services/authService';
import { formatCurrency, getApiErrorMessage } from '../utils/helpers';
import { fadeInUp, floatHero, pageFade, stagger } from '../utils/motionVariants';
import ContractsHero from '../assets/img4.png';

export default function ContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await contractService.getMyContracts();
        if (!controller.signal.aborted) setContracts(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!controller.signal.aborted) {
          const message = getApiErrorMessage(err);
          setError(message);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, []);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={pageFade}
      className="space-y-10 font-body"
    >
      <section className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-6 items-center rounded-[2rem] bg-white/70 border border-white/20 p-6 shadow-2xl overflow-hidden">
        <motion.div variants={fadeInUp} className="space-y-4 max-w-xl">
          <Badge color="secondary">Contracts</Badge>
          <h1 className="font-display text-4xl">Contracts that keep your work moving.</h1>
          <p className="text-mid max-w-2xl">Track signed agreements, milestones, and milestone releases in one elegant place. Every agreement here stays connected to your payments and project milestones.</p>
          <div className="flex flex-wrap gap-3 mt-5">
            <Link to="/payments">
              <Button>Escrow & Payments</Button>
            </Link>
            <Link to="/projects">
              <Button variant="outline">Browse Projects</Button>
            </Link>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="flex justify-center">
          <motion.img
            src={ContractsHero}
            alt="Contracts hero"
            className="w-full max-w-[520px] rounded-[2rem] shadow-2xl border border-white/20"
            variants={floatHero}
          />
        </motion.div>
      </section>

      {error && (
        <div className="rounded-3xl bg-error/10 border border-error/30 p-4 text-sm text-error">
          {error}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-3">
        {loading ? (
          [1, 2, 3].map((idx) => <Skeleton key={idx} className="h-48 rounded-[1.5rem]" />)
        ) : contracts.length === 0 ? (
          <div className="lg:col-span-3 rounded-[2rem] border border-border/50 bg-surface p-10 text-center">
            <ClipboardCheck className="mx-auto mb-4 w-12 h-12 text-muted" />
            <p className="text-text text-lg font-semibold">No active contracts yet.</p>
            <p className="text-muted mt-2">Create a project or accept a proposal to start a contract.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/projects"><Button variant="outline">Browse Projects</Button></Link>
              <Link to="/payments"><Button>View Payments</Button></Link>
            </div>
          </div>
        ) : (
          <motion.div variants={stagger} className="grid gap-6 lg:grid-cols-3">
            {contracts.map((contract) => (
              <motion.article key={contract._id} variants={fadeInUp} className="rounded-[1.75rem] border border-border/50 bg-white/80 p-5 shadow-lg">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="text-sm text-muted">{contract.project?.title || 'Agreement'}</p>
                    <p className="font-semibold text-text mt-1 line-clamp-2">{contract.title || contract.project?.title || 'Active contract'}</p>
                  </div>
                  <Badge color={contract.status === 'active' ? 'success' : contract.status === 'pending' ? 'warning' : 'muted'}>{contract.status}</Badge>
                </div>
                <div className="space-y-2 text-sm text-muted">
                  <p><span className="text-text font-medium">Milestone:</span> {contract.milestone || 'Standard'}</p>
                  <p><span className="text-text font-medium">Value:</span> {formatCurrency(contract.amount)}</p>
                </div>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <Link to="/payments" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">Manage escrow</Link>
                  <ArrowRight className="w-5 h-5 text-primary" />
                </div>
              </motion.article>
            ))}
          </motion.div>
        )}
      </section>
    </motion.div>
  );
}
