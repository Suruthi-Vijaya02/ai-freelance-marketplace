import Badge from './Badge';
import { getMatchScoreColor } from '../../utils/permissions';

export default function MatchScoreBadge({ score, className }) {
  if (score == null || score === 0) return null;
  return (
    <Badge color={getMatchScoreColor(score)} className={className}>
      {score}% match
    </Badge>
  );
}
