"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Category {
  id: string
  name: string
  description: string | null
  slug: string
  icon: string
  post_count: number
}

interface ForumCategoriesProps {
  categories: Category[]
  selectedCategory: string | null
  onSelectCategory: (categoryId: string | null) => void
}

export function ForumCategories({
  categories,
  selectedCategory,
  onSelectCategory,
}: ForumCategoriesProps) {
  return (
    <div className="relative">
      {/* Horizontal scrollable container for mobile, wrapped for desktop */}
      <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
        <div className="flex gap-2 pb-2 sm:flex-wrap sm:pb-0">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectCategory(null)}
            className="gap-1.5 sm:gap-2 flex-shrink-0 h-8 sm:h-9 text-xs sm:text-sm"
          >
            <span>📋</span>
            <span>Alle</span>
            <Badge variant="secondary" className="ml-0.5 h-4 sm:h-5 text-xs">
              {categories.reduce((sum, cat) => sum + cat.post_count, 0)}
            </Badge>
          </Button>

          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => onSelectCategory(category.id)}
              className="gap-1.5 sm:gap-2 flex-shrink-0 h-8 sm:h-9 text-xs sm:text-sm"
            >
              <span>{category.icon}</span>
              <span className="whitespace-nowrap">{category.name}</span>
              <Badge variant="secondary" className="ml-0.5 h-4 sm:h-5 text-xs">
                {category.post_count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>
      
      {/* Gradient fade indicators for scroll on mobile */}
      <div className="pointer-events-none absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-background to-transparent sm:hidden" />
    </div>
  )
}
