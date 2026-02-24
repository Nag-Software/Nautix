"use client"

import React from 'react'

type Props = {
  used: number
  limit: number
  size?: number
  strokeWidth?: number
  label?: string
}

export function UsageMeterCircle({ used, limit, size = 96, strokeWidth = 8, label }: Props) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const dash = limit > 0 ? (percent / 100) * circumference : circumference

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="block">
        <g transform={`translate(${size / 2}, ${size / 2})`}>
          <circle
            r={radius}
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-gray-200"
            stroke="currentColor"
            opacity={0.6}
          />
          <circle
            r={radius}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
            stroke="url(#gradient)"
            strokeDasharray={`${dash} ${circumference - dash}`}
            transform={`rotate(-90)`}
          />
        </g>
        <defs>
          <linearGradient id="gradient" x1="0%" x2="100%">
            <stop offset="0%" stopColor="#e3b21e" />
            <stop offset="100%" stopColor="#ffdf7d" />
          </linearGradient>
        </defs>
      </svg>

      <div className="text-center">
        <div className="text-xs md:text-sm text-muted-foreground">{label ?? 'Bruk'}</div>
        <div className="text-sm md:text-lg font-semibold">
          {used} / {limit > 0 ? limit : '∞'} {limit > 0 ? `(${percent}%)` : ''}
        </div>
      </div>
    </div>
  )
}

export default UsageMeterCircle
