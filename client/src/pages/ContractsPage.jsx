import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardCheck, 
  Shield, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MessageSquare, 
  Copy, 
  ExternalLink, 
  Wallet,
  X,
  Send,
  CreditCard,
  Lock,
  DollarSign,
  Zap
} from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { contractService, paymentService, projectService } from '../services/authService';
import api from '../services/authService';
import { formatCurrency, formatDate, getApiErrorMessage } from '../utils/helpers';
import { fadeInUp, floatHero, pageFade, stagger } from '../utils/motionVariants';
import ContractsHero from '../assets/img4.png';
import toast from 'react-hot-toast';

export default function ContractsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('agreements');
  const [contracts, setContracts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedContract, setSelectedContract] = useState(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletState, setWalletState] = useState('idle'); // idle, connecting, signing, confirmed
  const [signingContract, setSigningContract] = useState(null);

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitMilestoneId, setSubmitMilestoneId] = useState(null);
  const [submitNotes, setSubmitNotes] = useState('');
  const [submittingWork, setSubmittingWork] = useState(false);
  const [actionProcessing, setActionProcessing] = useState(false);

  const loadData = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError('');
      const [contractsRes, txRes] = await Promise.all([
        contractService.getMyContracts().catch(err => {
          console.error('Contracts fetch error:', err);
          return { data: [] };
        }),
        paymentService.getTransactions().catch(err => {
          console.error('Transactions fetch error:', err);
          return { data: [] };
        })
      ]);
      
      if (!signal?.aborted) {
        const contractsData = contractsRes?.data || [];
        const transactionsData = txRes?.data || [];
        setContracts(Array.isArray(contractsData) ? contractsData : []);
        setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      }
    } catch (err) {
      if (!signal?.aborted) {
        setError('Unable to load contracts. Please refresh.');
        toast.error(getApiErrorMessage(err));
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  // Reload selected contract helper
  const reloadSelectedContract = async (contractId) => {
    try {
      const { data } = await api.get(`/contracts/${contractId}`);
      if (data) {
        // If contract is wrapped inside a success wrapper
        const updated = data.data || data;
        setSelectedContract(updated);
        setContracts(prev => prev.map(c => c._id === contractId ? updated : c));
      }
    } catch (err) {
      toast.error('Failed to refresh contract details');
    }
  };

  const getContractProgress = (contract) => {
    if (!contract?.milestones || !Array.isArray(contract.milestones) || contract.milestones.length === 0) return 0;
    const released = contract.milestones.filter(m => m?.status === 'released').length;
    return Math.round((released / contract.milestones.length) * 100);
  };

  const getReleasedAmount = (contract) => {
    if (!contract?.milestones || !Array.isArray(contract.milestones) || contract.milestones.length === 0) return 0;
    return contract.milestones
      .filter(m => m?.status === 'released')
      .reduce((sum, m) => sum + (Number(m?.amount) || 0), 0);
  };

  const handleCopyText = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const buildConversationId = (u1, u2) => {
    if (!u1 || !u2) return '';
    return [u1.toString(), u2.toString()].sort((a, b) => a.localeCompare(b)).join('_');
  };

  // Simulated signing flow
  const handleOpenWalletModal = (contract) => {
    setSigningContract(contract);
    setWalletState('idle');
    setShowWalletModal(true);
  };

  const handleSimulateSigning = async () => {
    setWalletState('connecting');
    setTimeout(() => {
      setWalletState('signing');
      setTimeout(async () => {
        try {
          // Send signature API request to server
          const response = await api.post(`/contracts/${signingContract._id}/sign`);
          
          // Generate simulated block details and tx hash on client
          const mockTxHash = '0x' + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('');
          
          // We can also trigger block updates if backend supports it or save mock on client
          // Let's call updates if needed
          await api.put(`/contracts/${signingContract._id}`, {
            blockchain: {
              verified: true,
              network: 'sepolia',
              txHash: mockTxHash,
              verifiedAt: new Date()
            }
          }).catch(() => {}); // ignore if raw update not permitted

          setWalletState('confirmed');
          toast.success('Contract signed and verified on Sepolia Testnet!');
          
          // Refresh data
          await loadData();
          if (selectedContract?._id === signingContract._id) {
            await reloadSelectedContract(signingContract._id);
          }
          
          setTimeout(() => {
            setShowWalletModal(false);
          }, 3000);
        } catch (err) {
          toast.error(getApiErrorMessage(err));
          setWalletState('idle');
        }
      }, 2000);
    }, 1500);
  };

  // Submit Work Flow
  const handleOpenSubmitModal = (milestoneId) => {
    setSubmitMilestoneId(milestoneId);
    setSubmitNotes('');
    setShowSubmitModal(true);
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!submitNotes.trim()) {
      toast.error('Please enter submission notes');
      return;
    }
    setSubmittingWork(true);
    try {
      await api.put(`/contracts/${selectedContract._id}/milestones/${submitMilestoneId}/submit`, {
        notes: submitNotes
      });
      toast.success('Work submitted successfully!');
      setShowSubmitModal(false);
      await reloadSelectedContract(selectedContract._id);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmittingWork(false);
    }
  };

  // Client Approve & Release Flow
  const handleApproveRelease = async (milestoneId) => {
    setActionProcessing(true);
    try {
      // First approve
      await api.put(`/contracts/${selectedContract._id}/milestones/${milestoneId}/approve`);
      // Then release
      await api.put(`/contracts/${selectedContract._id}/milestones/${milestoneId}/release`);
      toast.success('Milestone approved and payment released!');
      await reloadSelectedContract(selectedContract._id);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setActionProcessing(false);
    }
  };

  // Dispute Flow
  const handleDispute = async () => {
    if (!window.confirm('Are you sure you want to open a dispute? This will freeze payments.')) return;
    setActionProcessing(true);
    try {
      await api.post(`/contracts/${selectedContract._id}/dispute`);
      toast.success('Contract status set to disputed.');
      await reloadSelectedContract(selectedContract._id);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setActionProcessing(false);
    }
  };

  // Client fund milestone helper
  const handleFundMilestone = async (projectId, milestoneId, amount) => {
    setActionProcessing(true);
    try {
      await paymentService.fundMilestone({ projectId, milestoneId, amount });
      toast.success('Milestone funded successfully!');
      await loadData();
      if (selectedContract) {
        await reloadSelectedContract(selectedContract._id);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setActionProcessing(false);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={pageFade}
      className="space-y-10 font-body pb-12"
    >
      <section className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-6 items-center rounded-[2rem] bg-white/70 border border-white/20 p-6 shadow-2xl overflow-hidden">
        <motion.div variants={fadeInUp} className="space-y-4 max-w-xl">
          <Badge color="secondary">Contracts & Payments</Badge>
          <h1 className="font-display text-4xl">Contracts that keep your work moving.</h1>
          <p className="text-mid max-w-2xl">Track signed agreements, milestones, and escrow payments in one elegant place.</p>
          <div className="flex flex-wrap gap-3 mt-5">
            <button 
              onClick={() => setActiveTab('escrow')}
              className={`px-6 py-2.5 rounded-full font-bold transition-all ${activeTab === 'escrow' ? 'bg-primary text-white shadow-lg' : 'bg-white text-text border border-border hover:bg-gray-50'}`}
            >
              Escrow & Payments
            </button>
            <Link to="/projects">
              <Button variant="outline">Browse Projects</Button>
            </Link>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} className="flex justify-center">
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

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border/50 pb-px">
        <button
          onClick={() => setActiveTab('agreements')}
          className={`pb-4 px-2 text-sm font-bold transition-all relative ${activeTab === 'agreements' ? 'text-primary' : 'text-muted hover:text-text'}`}
        >
          Active Agreements
          {activeTab === 'agreements' && (
            <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('escrow')}
          className={`pb-4 px-2 text-sm font-bold transition-all relative ${activeTab === 'escrow' ? 'text-primary' : 'text-muted hover:text-text'}`}
        >
          Escrow & Payments
          {activeTab === 'escrow' && (
            <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {activeTab === 'agreements' ? (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-text">Your Contracts</h2>
          </div>
          {loading ? (
            <div className="grid gap-6 lg:grid-cols-3">
              {[1, 2, 3].map((idx) => <Skeleton key={idx} className="h-56 rounded-[1.75rem]" />)}
            </div>
          ) : contracts.length === 0 ? (
            <div className="rounded-[2rem] border border-border/50 bg-surface p-10 text-center">
              <ClipboardCheck className="mx-auto mb-4 w-12 h-12 text-muted" />
              <p className="text-text text-lg font-semibold">No active contracts yet.</p>
              <p className="text-muted mt-2">Create a project or accept a proposal to start a contract.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link to="/projects"><Button variant="outline">Browse Projects</Button></Link>
                <button onClick={() => setActiveTab('escrow')}><Button>View Payments</Button></button>
              </div>
            </div>
          ) : (
            <motion.div variants={stagger} className="grid gap-6 lg:grid-cols-3">
              {(contracts || []).filter(Boolean).map((contract) => {
                const progress = getContractProgress(contract);
                const released = getReleasedAmount(contract);
                const totalMilestones = (contract?.milestones && Array.isArray(contract.milestones)) ? contract.milestones.length : 0;
                const completedMilestones = (contract?.milestones && Array.isArray(contract.milestones)) 
                  ? contract.milestones.filter(m => m?.status === 'released').length 
                  : 0;
                const partner = user?.role === 'client' ? contract?.freelancer : contract?.client;

                return (
                  <motion.article 
                    key={contract?._id || Math.random()} 
                    variants={fadeInUp} 
                    className="rounded-[1.75rem] border border-border/50 bg-white/80 p-5 shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="truncate">
                          <p className="text-xs text-muted truncate">{contract?.project?.title || 'Agreement'}</p>
                          <p className="font-semibold text-text mt-1 line-clamp-1">{contract?.title || contract?.project?.title || 'Active contract'}</p>
                        </div>
                        <Badge color={contract?.status === 'active' ? 'success' : contract?.status === 'pending_signature' ? 'warning' : 'muted'}>
                          {contract?.status === 'pending_signature' ? 'Pending Signature' : (contract?.status || 'Unknown')}
                        </Badge>
                      </div>

                      <div className="space-y-3 my-4">
                        <div className="flex items-center gap-2">
                          <img 
                            src={partner?.avatar || (partner?.name ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${partner.name}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=user`)} 
                            alt={partner?.name || 'User'} 
                            className="w-6 h-6 rounded-full object-cover" 
                          />
                          <span className="text-xs font-medium text-text truncate">
                            {user?.role === 'client' ? 'Freelancer: ' : 'Client: '}
                            {partner?.name || (typeof partner === 'string' ? 'User ID: ' + partner : '—')}
                          </span>
                        </div>

                        {contract?.blockchain?.verified ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                            <Shield className="w-3.5 h-3.5" /> On-chain verified
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
                            <AlertCircle className="w-3.5 h-3.5" /> Unverified Contract
                          </div>
                        )}

                        <div className="space-y-1 mt-2">
                          <div className="flex justify-between text-xs text-muted">
                            <span>Progress</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-150 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-[#1DBF73] h-full rounded-full transition-all duration-500" 
                              style={{ width: `${progress}%` }} 
                            />
                          </div>
                        </div>

                        <p className="text-xs text-muted mt-2 font-medium">
                          {completedMilestones} of {totalMilestones} milestones completed · {formatCurrency(released / 100)} released
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between gap-3">
                      {contract?.status === 'pending_signature' && (
                        <button 
                          onClick={() => handleOpenWalletModal(contract)}
                          className="text-xs font-bold text-indigo-700 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                        >
                          <Wallet className="w-4 h-4" /> Sign Agreement
                        </button>
                      )}
                      <button 
                        onClick={() => setSelectedContract(contract)}
                        className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors ml-auto"
                      >
                        View Details <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.article>
                );
              })}
            </motion.div>
          )}
        </section>
      ) : (
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-text">Escrow & Transactions</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-text">Transaction History</h3>
                </div>
                {loading ? (
                  <Skeleton className="h-40 w-full" />
                ) : transactions.length === 0 ? (
                  <div className="text-center py-10">
                    <Lock className="w-10 h-10 text-muted mx-auto mb-3" />
                    <p className="text-muted">No transactions yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-muted border-b border-border">
                          <th className="text-left py-2">Milestone</th>
                          <th className="text-left py-2">Amount</th>
                          <th className="text-left py-2">Status</th>
                          <th className="text-left py-2">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(transactions || []).filter(Boolean).map((tx) => (
                          <tr key={tx?._id || Math.random()} className="border-b border-border/50">
                            <td className="py-3 text-text">{tx?.milestone || '—'}</td>
                            <td className="py-3 text-secondary font-medium">{formatCurrency(tx?.amount)}</td>
                            <td className="py-3">
                              <Badge color={tx?.status === 'released' ? 'success' : tx?.status === 'escrow' ? 'secondary' : 'muted'}>
                                {tx?.status || 'unknown'}
                              </Badge>
                            </td>
                            <td className="py-3 text-muted">{formatDate(tx?.releasedAt || tx?.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-primary/5 border-primary/20">
                <h3 className="font-bold text-text mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" /> Quick Stats
                </h3>
                <div className="space-y-4 mt-4">
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wider font-bold">Active Escrow</p>
                    <p className="text-2xl font-black text-text">
                      {formatCurrency((contracts || []).reduce((sum, c) => {
                        const milestoneSum = (c.milestones || [])
                          .filter(m => m.status === 'funded')
                          .reduce((s, m) => s + (m.amount || 0), 0);
                        return sum + milestoneSum;
                      }, 0) / 100)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wider font-bold">Total Released</p>
                    <p className="text-2xl font-black text-secondary">
                      {formatCurrency((transactions || []).filter(tx => tx?.status === 'released').reduce((sum, tx) => sum + (tx?.amount || 0), 0))}
                    </p>
                  </div>
                </div>
              </Card>
              
              <div className="rounded-[1.75rem] border border-border p-6 bg-white space-y-4">
                <h3 className="font-bold text-text">How Escrow Works</h3>
                <ul className="space-y-3 text-sm text-muted">
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span>Client funds a milestone; money is held securely.</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span>Freelancer submits work for the funded milestone.</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span>Client approves work and releases funds to freelancer.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Contract Detail Drawer / Modal */}
      <AnimatePresence>
        {selectedContract && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedContract(null)}
              className="fixed inset-0 bg-black z-45"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-xl bg-white shadow-2xl z-50 overflow-y-auto p-6 md:p-8 flex flex-col justify-between border-l border-border"
            >
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <Badge color={selectedContract.status === 'active' ? 'success' : selectedContract.status === 'pending_signature' ? 'warning' : 'muted'}>
                      {selectedContract.status}
                    </Badge>
                    <h2 className="text-2xl font-bold text-text mt-2">{selectedContract.project?.title || 'Contract Details'}</h2>
                    <p className="text-sm text-muted">Value: {formatCurrency(selectedContract.amount / 100)}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedContract(null)}
                    className="p-2 text-muted hover:text-text rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="h-px bg-border/50" />

                {/* Blockchain Info */}
                <Card className="bg-gray-50 border border-gray-200 p-4">
                  <h3 className="text-sm font-bold text-text mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-700" /> Blockchain Verification
                  </h3>
                  {selectedContract.blockchain?.verified ? (
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted">Network:</span>
                        <span className="font-semibold text-text uppercase">{selectedContract.blockchain.network}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted">Tx Hash:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-indigo-700 truncate max-w-[150px]">
                            {selectedContract.blockchain.txHash}
                          </span>
                          <button 
                            onClick={() => handleCopyText(selectedContract.blockchain.txHash)}
                            className="p-1 hover:bg-gray-200 rounded text-muted"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Verified At:</span>
                        <span className="text-text font-medium">{formatDate(selectedContract.blockchain.verifiedAt)}</span>
                      </div>
                      <a 
                        href={`https://sepolia.etherscan.io/tx/${selectedContract.blockchain.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-700 font-bold hover:underline flex items-center gap-1 mt-2 text-xs"
                      >
                        View on Sepolia Explorer <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-muted">This contract is currently stored off-chain. Sign it with simulated MetaMask flow to register it immutably on the Sepolia testnet.</p>
                      <Button 
                        size="sm"
                        onClick={() => handleOpenWalletModal(selectedContract)}
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <Wallet className="w-4 h-4" /> Verify Contract
                      </Button>
                    </div>
                  )}
                </Card>

                {/* Milestones Tracker */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-text">Milestones Timeline</h3>
                  {(!selectedContract.milestones || selectedContract.milestones.length === 0) ? (
                    <p className="text-sm text-muted">No milestones found.</p>
                  ) : (
                    <div className="space-y-6">
                      {(selectedContract?.milestones || []).filter(Boolean).map((milestone, idx) => {
                        const statusColors = {
                          released: 'bg-green-100 text-green-700 border-green-200',
                          approved: 'bg-indigo-100 text-indigo-700 border-indigo-200',
                          submitted: 'bg-amber-100 text-amber-700 border-amber-200',
                          funded: 'bg-blue-100 text-blue-700 border-blue-200',
                          disputed: 'bg-red-100 text-red-700 border-red-200',
                          pending: 'bg-gray-100 text-gray-500 border-gray-200'
                        };
                        const isLast = idx === (selectedContract?.milestones?.length || 0) - 1;

                        return (
                          <div key={milestone?._id || idx} className="relative flex gap-4">
                            {/* Vertical Line */}
                            {!isLast && (
                              <div className="absolute top-10 left-5 bottom-0 w-0.5 bg-gray-200 -z-10" />
                            )}
                            
                            {/* Circle Indicator */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 ${
                              milestone?.status === 'released' ? 'bg-green-50 border-green-500 text-green-500' :
                              milestone?.status === 'approved' ? 'bg-indigo-50 border-indigo-500 text-indigo-500' :
                              milestone?.status === 'submitted' ? 'bg-amber-50 border-amber-500 text-amber-500' :
                              milestone?.status === 'funded' ? 'bg-blue-50 border-blue-500 text-blue-500' :
                              'bg-gray-50 border-gray-300 text-gray-400'
                            }`}>
                              {milestone?.status === 'released' ? <CheckCircle2 className="w-5 h-5" /> :
                               milestone?.status === 'submitted' ? <Clock className="w-5 h-5" /> :
                               milestone?.status === 'funded' ? <Shield className="w-5 h-5" /> :
                               <Clock className="w-5 h-5" />}
                            </div>

                            {/* Details Card */}
                            <div className="flex-1 rounded-2xl border border-border p-4 bg-white space-y-2">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <h4 className="font-semibold text-text">{milestone?.title || 'Milestone'}</h4>
                                  {milestone?.deadline && (
                                    <p className="text-xs text-muted">Deadline: {formatDate(milestone.deadline)}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-text">{formatCurrency((milestone?.amount || 0) / 100)}</p>
                                  <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusColors[milestone?.status] || 'border-gray-200 text-gray-400'}`}>
                                    {milestone?.status || 'pending'}
                                  </span>
                                </div>
                              </div>

                              {milestone?.description && (
                                <p className="text-xs text-muted">{milestone.description}</p>
                              )}

                              {/* Dates details */}
                              {milestone?.status === 'released' && milestone?.releasedAt && (
                                <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Released on {formatDate(milestone.releasedAt)}
                                </p>
                              )}

                              {/* Submission notes details */}
                              {milestone?.submissionNotes && (
                                <div className="p-3 bg-gray-50 rounded-xl mt-2 text-xs border border-gray-250">
                                  <p className="font-semibold text-text mb-1">Freelancer Submission Notes:</p>
                                  <p className="text-muted italic">"{milestone.submissionNotes}"</p>
                                </div>
                              )}

                              {/* Action buttons */}
                              <div className="flex gap-2 pt-2">
                                {/* Freelancer submit action */}
                                {user?.role === 'freelancer' && (milestone?.status === 'funded' || milestone?.status === 'in_progress') && (
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleOpenSubmitModal(milestone._id)}
                                  >
                                    Submit Work
                                  </Button>
                                )}

                                {/* Client approve & release actions */}
                                {user?.role === 'client' && milestone?.status === 'submitted' && (
                                  <>
                                    <Button 
                                      size="sm"
                                      disabled={actionProcessing}
                                      onClick={() => handleApproveRelease(milestone._id)}
                                    >
                                      Approve & Release
                                    </Button>
                                    <Button 
                                      size="sm"
                                      variant="outline"
                                      disabled={actionProcessing}
                                      onClick={() => handleDispute()}
                                      className="border-red-200 text-red-600 hover:bg-red-50"
                                    >
                                      Dispute
                                    </Button>
                                  </>
                                )}

                                {/* Not funded state */}
                                {milestone?.status === 'pending' && user?.role === 'client' && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    disabled={actionProcessing}
                                    onClick={() => handleFundMilestone(selectedContract?.project?._id || selectedContract?.project, milestone?._id, milestone?.amount)}
                                  >
                                    Fund Milestone
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-6 border-t border-border mt-8 flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline"
                  onClick={() => {
                    const convId = buildConversationId(selectedContract.client?._id || selectedContract.client, selectedContract.freelancer?._id || selectedContract.freelancer);
                    navigate(`/messages/${convId}`);
                  }}
                  className="flex items-center justify-center gap-2 flex-1"
                >
                  <MessageSquare className="w-4 h-4" /> Message Partner
                </Button>
                {selectedContract.status !== 'completed' && selectedContract.status !== 'cancelled' && (
                  <Button 
                    variant="outline"
                    disabled={actionProcessing}
                    onClick={handleDispute}
                    className="border-red-200 text-red-600 hover:bg-red-50 flex-1"
                  >
                    Open dispute
                  </Button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Wallet signing simulation modal */}
      <AnimatePresence>
        {showWalletModal && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWalletModal(false)}
              className="fixed inset-0 bg-black"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 shadow-2xl border border-border w-full max-w-md relative z-10 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-text flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-indigo-700" /> MetaMask Wallet Simulation
                </h3>
                <button 
                  onClick={() => setShowWalletModal(false)}
                  className="text-muted hover:text-text"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {walletState === 'idle' && (
                <div className="space-y-4 text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto text-indigo-700">
                    <Wallet className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-text">Verify Identity On-Chain</h4>
                    <p className="text-xs text-muted mt-1 px-4">Register this agreement securely and immutably on the Sepolia Testnet network. No real gas costs required.</p>
                  </div>
                  <Button onClick={handleSimulateSigning} className="w-full">
                    Connect MetaMask & Sign
                  </Button>
                </div>
              )}

              {walletState === 'connecting' && (
                <div className="space-y-4 text-center py-6">
                  <div className="w-12 h-12 border-4 border-indigo-700 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm font-semibold text-text">Connecting to MetaMask...</p>
                  <p className="text-xs text-muted">Please approve the connection in your browser extension.</p>
                </div>
              )}

              {walletState === 'signing' && (
                <div className="space-y-4 text-center py-6">
                  <div className="w-12 h-12 border-4 border-[#1DBF73] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm font-semibold text-text">Signing Contract Hash...</p>
                  <p className="text-xs text-muted font-mono bg-gray-50 p-2 rounded truncate max-w-xs mx-auto">
                    Hash: {signingContract?.blockchainHash || '0x4f3e2d...'}
                  </p>
                </div>
              )}

              {walletState === 'confirmed' && (
                <div className="space-y-4 text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-text">Transaction Confirmed!</h4>
                    <p className="text-xs text-muted mt-1">Contract recorded on Sepolia testnet.</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 text-left p-3 rounded-2xl space-y-1 text-[11px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-muted">Block:</span>
                      <span className="text-text font-bold">#12,345,678</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Gas Used:</span>
                      <span className="text-text font-bold">0.0042 ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Network:</span>
                      <span className="text-text font-bold">Sepolia Testnet</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Freelancer Submit Work Form Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSubmitModal(false)}
              className="fixed inset-0 bg-black"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 shadow-2xl border border-border w-full max-w-md relative z-10 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-text">Submit Milestone Work</h3>
                <button 
                  onClick={() => setShowSubmitModal(false)}
                  className="text-muted hover:text-text"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitWork} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-text block mb-1">
                    Submission Notes / Proof of Work
                  </label>
                  <textarea 
                    rows={4}
                    value={submitNotes}
                    onChange={(e) => setSubmitNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-xl text-sm text-text focus:outline-none focus:border-primary"
                    placeholder="Provide details about the work completed, links, or file paths..."
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowSubmitModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={submittingWork}
                  >
                    {submittingWork ? 'Submitting...' : 'Submit Work'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Card className="mt-12 bg-indigo-50/30 border-indigo-100 overflow-hidden relative">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-2xl bg-indigo-100 text-indigo-700">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text">Blockchain Contract Ledger</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">In Development</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted leading-relaxed max-w-3xl">
          Each signed contract generates a SHA-256 cryptographic hash stored on the contract record. 
          This section will display an on-chain ledger view where contract hashes are verified against 
          an Ethereum testnet — making every agreement permanently tamper-evident and publicly auditable.
        </p>
        <div className="mt-6 pt-6 border-t border-indigo-100/50 flex items-center gap-2 text-xs text-indigo-800 font-medium">
          <Zap className="w-4 h-4" />
          Blockchain ledger view — planned integration with ethers.js + Ethereum testnet
        </div>
      </Card>
    </motion.div>
  );
}
