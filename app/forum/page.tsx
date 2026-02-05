"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ForumCategories } from "@/components/forum-categories"
import { ForumPostsList } from "@/components/forum-posts-list"
import { ForumPostDrawer } from "@/components/forum-post-drawer"
import { CreatePostDialog } from "@/components/forum-create-post"
import { MyPostsDialog } from "@/components/my-posts-dialog"
import { EditPostDrawer } from "@/components/edit-post-drawer"
import { ForumLeaderboard } from "@/components/forum-leaderboard"
import { ForumUserStats } from "@/components/forum-user-stats"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RefreshCw } from "lucide-react"

interface Category {
  id: string
  name: string
  description: string | null
  slug: string
  icon: string
  post_count: number
}

interface Post {
  id: string
  title: string
  content: string
  view_count: number
  like_count: number
  comment_count: number
  is_pinned: boolean
  created_at: string
  category: {
    name: string
    slug: string
    icon: string
  }
  author: {
    id: string
    email: string
  }
  author_stats: {
    rank: string
    points: number
  }[]
}

export default function ForumPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [editPostId, setEditPostId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
    fetchPosts()
  }, [selectedCategory])

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/forum/categories")
      const data = await response.json()
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setCategories(data)
      } else {
        console.error("Invalid data format:", data)
        setCategories([])
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
      setCategories([])
    }
  }

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const url = selectedCategory
        ? `/api/forum/posts?category_id=${selectedCategory}`
        : "/api/forum/posts"
      const response = await fetch(url)
      const data = await response.json()
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setPosts(data)
      } else {
        console.error("Invalid data format:", data)
        setPosts([])
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchCategories()
    fetchPosts()
  }

  const handlePostEdit = (postId: string) => {
    setSelectedPostId(null)
    setEditPostId(postId)
  }

  const handlePostDelete = () => {
    fetchPosts()
    fetchCategories()
  }

  const handlePostUpdated = () => {
    setEditPostId(null)
    fetchPosts()
    fetchCategories()
  }

  const selectedCategoryName = selectedCategory
    ? categories.find((c) => c.id === selectedCategory)?.name
    : "Alle kategorier"

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Forum</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-3 sm:gap-6 sm:p-6">
          {/* Header with actions - mobile optimized */}
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg sm:text-xl font-bold">Nautix Forum</h2>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="outline" size="icon" onClick={handleRefresh} className="h-9 w-9">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <MyPostsDialog onEditPost={(postId) => setEditPostId(postId)} />
              <CreatePostDialog
                categories={categories}
                onPostCreated={() => {
                  fetchPosts()
                  fetchCategories()
                }}
              />
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-2">
            {categories.length === 0 ? (
              <Card>
                <CardContent className="py-8 sm:py-12 px-4 text-center space-y-3 sm:space-y-4">
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Forumet er ikke satt opp ennå.
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Kjør SQL-skriptet <code className="bg-muted px-2 py-1 rounded text-xs">supabase/forum_schema.sql</code> i Supabase SQL Editor for å sette opp databasen.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <ForumCategories
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            )}
          </div>

          {/* Main Content */}
          <div className="flex flex-col gap-4 sm:gap-6 lg:grid lg:grid-cols-[1fr_300px]">
            {/* Posts List */}
            <div className="space-y-3 lg:order-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-semibold text-muted-foreground">
                  {selectedCategoryName}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">
                  {posts.length} innlegg
                </p>
              </div>
              {loading ? (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  Laster innlegg...
                </div>
              ) : (
                <ForumPostsList
                  posts={posts}
                  onPostClick={setSelectedPostId}
                />
              )}
            </div>

            {/* Sidebar - hidden on mobile, shown on md+ */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4 lg:order-2">
              <ForumUserStats />
              <ForumLeaderboard />
            </div>
          </div>
        </div>

        {/* Post Detail Drawer */}
        <ForumPostDrawer
          postId={selectedPostId}
          open={selectedPostId !== null}
          onClose={() => setSelectedPostId(null)}
          onEdit={() => handlePostEdit(selectedPostId!)}
          onDelete={handlePostDelete}
        />

        {/* Edit Post Drawer */}
        <EditPostDrawer
          postId={editPostId}
          open={editPostId !== null}
          onClose={() => setEditPostId(null)}
          categories={categories}
          onPostUpdated={handlePostUpdated}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}