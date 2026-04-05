"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/providers/auth-provider"
import { Avatar } from "@/components/ui/avatar"
import { Plus, Users, LogOut, Receipt, Copy, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Group } from "@/lib/types"
import { generateInviteCode } from "@/lib/constants"

export default function DashboardPage() {
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
      return
    }

    if (user) {
      fetchGroups()
    }
  }, [user, authLoading, router])

  const fetchGroups = async () => {
    setLoading(true)
    const { data } = await supabase
      .from("group_members")
      .select(`
        group_id,
        groups (*)
      `)
      .eq("user_id", user!.id)

    if (data) {
      const groupList = data
        .map((gm) => gm.groups as unknown as Group)
        .filter((g): g is Group => g !== null)
      setGroups(groupList)
    }
    setLoading(false)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
              <Receipt className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">SplitBD</span>
          </div>
          <div className="flex items-center gap-3">
            {profile && (
              <div className="flex items-center gap-2">
                <Avatar name={profile.display_name} color={profile.avatar_color} size="sm" />
                <span className="text-sm font-medium text-foreground hidden sm:inline">
                  {profile.display_name}
                </span>
              </div>
            )}
            <button
              onClick={handleSignOut}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Your Groups</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowJoinModal(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Users className="h-4 w-4" />
              Join Group
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Group
            </button>
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No groups yet</h2>
            <p className="text-muted-foreground mb-6">
              Create a group to start tracking shared expenses with friends
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create your first group
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/group/${group.id}`}
                className="bg-card rounded-2xl border border-border p-6 hover:border-primary/50 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{group.name}</h3>
                {group.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{group.description}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false)
            fetchGroups()
          }}
        />
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <JoinGroupModal
          onClose={() => setShowJoinModal(false)}
          onJoined={() => {
            setShowJoinModal(false)
            fetchGroups()
          }}
        />
      )}
    </div>
  )
}

function CreateGroupModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const { user } = useAuth()
  const supabase = createClient()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    const code = generateInviteCode()

    // Create group
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .insert({
        name,
        description: description || null,
        created_by: user.id,
        invite_code: code,
      })
      .select()
      .single()

    if (groupError) {
      toast.error(groupError.message)
      setLoading(false)
      return
    }

    // Add creator as member
    const { error: memberError } = await supabase
      .from("group_members")
      .insert({
        group_id: group.id,
        user_id: user.id,
      })

    if (memberError) {
      toast.error(memberError.message)
      setLoading(false)
      return
    }

    setInviteCode(code)
    setLoading(false)
    toast.success("Group created!")
  }

  const copyCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-lg">
        {inviteCode ? (
          <>
            <h2 className="text-xl font-bold text-foreground mb-4">Group Created!</h2>
            <p className="text-muted-foreground mb-4">
              Share this invite code with your friends:
            </p>
            <div className="flex items-center gap-2 mb-6">
              <div className="flex-1 bg-muted rounded-lg px-4 py-3 font-mono text-lg text-center text-foreground">
                {inviteCode}
              </div>
              <button
                onClick={copyCode}
                className="p-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
            <button
              onClick={onCreated}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Go to Group
            </button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-foreground mb-4">Create a Group</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label htmlFor="groupName" className="block text-sm font-medium text-foreground mb-1.5">
                  Group Name
                </label>
                <input
                  id="groupName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Weekend Trip"
                  required
                />
              </div>
              <div>
                <label htmlFor="groupDesc" className="block text-sm font-medium text-foreground mb-1.5">
                  Description (optional)
                </label>
                <input
                  id="groupDesc"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Cox's Bazar trip expenses"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

function JoinGroupModal({
  onClose,
  onJoined,
}: {
  onClose: () => void
  onJoined: () => void
}) {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const supabase = createClient()

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)

    // Find group by invite code
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id")
      .eq("invite_code", code.toUpperCase())
      .single()

    if (groupError || !group) {
      toast.error("Invalid invite code")
      setLoading(false)
      return
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", group.id)
      .eq("user_id", user.id)
      .single()

    if (existing) {
      toast.error("You're already a member of this group")
      setLoading(false)
      return
    }

    // Join group
    const { error: joinError } = await supabase
      .from("group_members")
      .insert({
        group_id: group.id,
        user_id: user.id,
      })

    if (joinError) {
      toast.error(joinError.message)
      setLoading(false)
      return
    }

    toast.success("Joined group successfully!")
    setLoading(false)
    onJoined()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-bold text-foreground mb-4">Join a Group</h2>
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label htmlFor="inviteCode" className="block text-sm font-medium text-foreground mb-1.5">
              Invite Code
            </label>
            <input
              id="inviteCode"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono text-center tracking-widest"
              placeholder="ABCD1234"
              maxLength={8}
              required
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || code.length < 8}
              className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Join
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
