import { Badge } from "@/components/ui/badge"

interface RankBadgeProps {
  rank: string
  points?: number
  showPoints?: boolean
}

export function RankBadge({ rank, points, showPoints = false }: RankBadgeProps) {
  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'Matros':
        return 'bg-slate-500 hover:bg-slate-600'
      case 'Styrmann':
        return 'bg-blue-500 hover:bg-blue-600'
      case 'Overstyrrmann':
        return 'bg-purple-500 hover:bg-purple-600'
      case 'Kaptein':
        return 'bg-amber-500 hover:bg-amber-600'
      case 'Skipsreder':
        return 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600'
      default:
        return 'bg-gray-500 hover:bg-gray-600'
    }
  }

  const getRankIcon = (rank: string) => {
    switch (rank) {
      case 'Matros':
        return '⚓'
      case 'Styrmann':
        return '🎖️'
      case 'Overstyrrmann':
        return '⭐'
      case 'Kaptein':
        return '👑'
      case 'Skipsreder':
        return '🏆'
      default:
        return '⚓'
    }
  }

  return (
    <Badge className={`${getRankColor(rank)} text-white`}>
      <span className="mr-1">{getRankIcon(rank)}</span>
      {rank}
      {showPoints && points !== undefined && (
        <span className="ml-1 opacity-80">({points}p)</span>
      )}
    </Badge>
  )
}
