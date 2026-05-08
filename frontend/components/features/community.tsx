'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Users, MessageCircle, ThumbsUp, Plus, X, Send, Calendar } from 'lucide-react'
import { api } from '@/lib/api'

const N = '#0a2540'; const NL = '#00ABE4'; const LD = '#c8dff0';

const CATEGORIES = ['career', 'finance', 'housing', 'relationships', 'health', 'legal']

const UPCOMING_AMAS = [
  { title: 'Ask a Financial Advisor', date: 'Coming Soon', expert: 'Jane Smith, CFP' },
  { title: 'Tenant Rights Q&A', date: 'Coming Soon', expert: 'Legal Aid Society' },
]

interface Post {
  id: string
  _id?: string
  title: string
  content: string
  category: string
  author: string
  anonymous: boolean
  likes: number
  likedBy: string[]
  replies: Reply[]
  createdAt: string
}

interface Reply {
  id: string
  content: string
  author: string
  likes: number
  createdAt: string
}

export default function Community() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewPost, setShowNewPost] = useState(false)
  const [activePost, setActivePost] = useState<Post | null>(null)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [filterCat, setFilterCat] = useState('')

  // New post form
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newCategory, setNewCategory] = useState('finance')
  const [newAnon, setNewAnon] = useState(false)

  const loadPosts = async (cat?: string) => {
    try {
      const res = await api.getPosts(cat || undefined, 20, 0)
      if (res.success) setPosts(res.posts || [])
    } catch { setPosts([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadPosts(filterCat) }, [filterCat])

  const handleCreatePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) return
    setSubmitting(true)
    try {
      const res = await api.createPost(newTitle, newContent, newCategory, newAnon)
      if (res.success) {
        setShowNewPost(false)
        setNewTitle(''); setNewContent(''); setNewCategory('finance'); setNewAnon(false)
        loadPosts(filterCat)
      }
    } catch {}
    setSubmitting(false)
  }

  const handleLike = async (postId: string) => {
    try {
      await api.likePost(postId)
      loadPosts(filterCat)
    } catch {}
  }

  const handleReply = async () => {
    if (!activePost || !replyText.trim()) return
    setSubmitting(true)
    try {
      await api.addReply(activePost.id || activePost._id!, replyText)
      setReplyText('')
      const res = await api.getPost(activePost.id || activePost._id!)
      if (res.success) setActivePost(res.post)
      loadPosts(filterCat)
    } catch {}
    setSubmitting(false)
  }

  const catColor: Record<string, string> = {
    career: '#2563eb', finance: '#059669', housing: '#d97706',
    relationships: '#db2777', health: '#dc2626', legal: '#7c3aed',
  }

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
          style={{ background: 'rgba(17,20,57,0.07)', border: `1px solid ${LD}` }}>
          <Users className="w-4 h-4" style={{ color: NL }} />
          <span className="text-sm font-medium" style={{ color: N }}>Connect & Learn</span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: N }}>Community</h1>
            <p className="text-sm mt-1" style={{ color: '#6b6f9e' }}>Ask questions, share experiences, learn from others.</p>
          </div>
          <Button onClick={() => setShowNewPost(true)}
            className="text-white font-semibold btn-shimmer"
            style={{ background: `linear-gradient(135deg, ${N}, ${NL})` }}>
            <Plus className="w-4 h-4 mr-2" /> New Post
          </Button>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button onClick={() => setFilterCat('')}
          className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
          style={{ background: !filterCat ? `linear-gradient(135deg,${N},${NL})` : 'rgba(17,20,57,0.07)',
            color: !filterCat ? '#fff' : N, border: `1px solid ${LD}` }}>
          All
        </button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilterCat(c === filterCat ? '' : c)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all"
            style={{ background: filterCat === c ? catColor[c] : 'rgba(17,20,57,0.07)',
              color: filterCat === c ? '#fff' : N, border: `1px solid ${LD}` }}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Posts */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            [1,2,3].map(i => (
              <div key={i} className="rounded-2xl p-5 animate-pulse" style={{ background: '#fff', border: `1px solid ${LD}` }}>
                <div className="h-4 rounded w-3/4 mb-3" style={{ background: LD }} />
                <div className="h-3 rounded w-1/2" style={{ background: LD }} />
              </div>
            ))
          ) : posts.length === 0 ? (
            <div className="rounded-2xl p-10 text-center" style={{ background: '#fff', border: `1px solid ${LD}` }}>
              <p className="text-lg font-semibold mb-2" style={{ color: N }}>No posts yet</p>
              <p className="text-sm mb-4" style={{ color: '#6b6f9e' }}>Be the first to start a discussion!</p>
              <Button onClick={() => setShowNewPost(true)}
                className="text-white" style={{ background: `linear-gradient(135deg,${N},${NL})` }}>
                Create First Post
              </Button>
            </div>
          ) : posts.map(post => (
            <div key={post.id || post._id} className="rounded-2xl p-5 cursor-pointer transition-all duration-200 bg-white"
              style={{ border: `1.5px solid ${LD}` }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = NL; e.currentTarget.style.boxShadow = '0 4px 16px rgba(17,20,57,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = LD; e.currentTarget.style.boxShadow = 'none' }}
              onClick={() => setActivePost(post)}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-sm flex-1 pr-3" style={{ color: N }}>{post.title}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize flex-shrink-0 text-white"
                  style={{ background: catColor[post.category] || NL }}>
                  {post.category}
                </span>
              </div>
              <p className="text-xs mb-3 line-clamp-2" style={{ color: '#6b6f9e' }}>{post.content}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: '#9999b8' }}>
                  by {post.anonymous ? 'Anonymous' : (post.author || 'User')} · {new Date(post.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-3 text-xs" style={{ color: '#6b6f9e' }}>
                  <button className="flex items-center gap-1 hover:text-red-500 transition-colors"
                    onClick={e => { e.stopPropagation(); handleLike(post.id || post._id!) }}>
                    <ThumbsUp className="w-3.5 h-3.5" /> {post.likes || 0}
                  </button>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5" /> {post.replies?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl p-5 bg-white" style={{ border: `1.5px solid ${LD}` }}>
            <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: N }}>
              <Calendar className="w-4 h-4" style={{ color: NL }} /> Upcoming AMAs
            </h3>
            {UPCOMING_AMAS.map((a, i) => (
              <div key={i} className="p-3 rounded-xl mb-2" style={{ background: 'rgba(17,20,57,0.05)' }}>
                <p className="font-semibold text-sm" style={{ color: N }}>{a.title}</p>
                <p className="text-xs" style={{ color: '#6b6f9e' }}>{a.expert}</p>
                <p className="text-xs mt-1 font-medium" style={{ color: NL }}>{a.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Post Modal */}
      {showNewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(17,20,57,0.4)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6 bg-white" style={{ border: `1.5px solid ${LD}` }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold" style={{ color: N }}>New Post</h3>
              <button onClick={() => setShowNewPost(false)}><X className="w-5 h-5" style={{ color: '#6b6f9e' }} /></button>
            </div>
            <div className="space-y-3">
              <Input placeholder="Title" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                style={{ border: `1.5px solid ${LD}`, color: N }} />
              <Textarea placeholder="What's on your mind?" value={newContent} onChange={e => setNewContent(e.target.value)}
                rows={4} style={{ border: `1.5px solid ${LD}`, color: N }} />
              <div className="flex gap-3 flex-wrap">
                <select value={newCategory} onChange={e => setNewCategory(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg text-sm capitalize"
                  style={{ border: `1.5px solid ${LD}`, color: N, background: '#fff' }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: N }}>
                  <input type="checkbox" checked={newAnon} onChange={e => setNewAnon(e.target.checked)} />
                  Post anonymously
                </label>
              </div>
              <Button onClick={handleCreatePost} disabled={submitting || !newTitle.trim() || !newContent.trim()}
                className="w-full text-white font-semibold"
                style={{ background: `linear-gradient(135deg,${N},${NL})` }}>
                {submitting ? 'Posting…' : 'Post'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Post Detail Modal */}
      {activePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(17,20,57,0.4)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-2xl rounded-2xl bg-white flex flex-col max-h-[85vh]"
            style={{ border: `1.5px solid ${LD}` }}>
            <div className="flex items-start justify-between p-5 border-b" style={{ borderColor: LD }}>
              <div className="flex-1 pr-4">
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize text-white mb-2 inline-block"
                  style={{ background: catColor[activePost.category] || NL }}>{activePost.category}</span>
                <h3 className="font-bold text-lg" style={{ color: N }}>{activePost.title}</h3>
                <p className="text-xs mt-1" style={{ color: '#9999b8' }}>
                  by {activePost.anonymous ? 'Anonymous' : (activePost.author || 'User')} · {new Date(activePost.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button onClick={() => setActivePost(null)}><X className="w-5 h-5" style={{ color: '#6b6f9e' }} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <p className="text-sm mb-6 leading-relaxed" style={{ color: '#3d4280' }}>{activePost.content}</p>
              <h4 className="font-bold text-sm mb-3" style={{ color: N }}>
                Replies ({activePost.replies?.length || 0})
              </h4>
              <div className="space-y-3">
                {(activePost.replies || []).map((r, i) => (
                  <div key={i} className="p-3 rounded-xl" style={{ background: 'rgba(17,20,57,0.05)' }}>
                    <p className="text-sm" style={{ color: N }}>{r.content}</p>
                    <p className="text-xs mt-1" style={{ color: '#9999b8' }}>
                      {r.author || 'User'} · {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t flex gap-2" style={{ borderColor: LD }}>
              <Input placeholder="Write a reply…" value={replyText} onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleReply()}
                style={{ border: `1.5px solid ${LD}`, color: N }} />
              <Button onClick={handleReply} disabled={submitting || !replyText.trim()}
                className="text-white flex-shrink-0"
                style={{ background: `linear-gradient(135deg,${N},${NL})` }}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
