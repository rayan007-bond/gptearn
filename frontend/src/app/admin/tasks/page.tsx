'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import {
    ArrowLeft, Plus, Edit, Trash2,
    Play, Link as LinkIcon, Heart, Gift, Flame
} from 'lucide-react';

interface Task {
    id: number;
    title: string;
    description: string;
    task_link: string;
    reward: number;
    max_completions: number;
    cooldown_hours: number;
    task_type: string;
    is_active: boolean;
    correctAnswer?: string;
}

export default function AdminTasksPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [taskLink, setTaskLink] = useState('');
    const [reward, setReward] = useState('');
    const [maxCompletions, setMaxCompletions] = useState('3');
    const [cooldownHours, setCooldownHours] = useState('1');
    const [taskType, setTaskType] = useState('watch_ads');
    const [correctAnswer, setCorrectAnswer] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/admin');
            return;
        }
        loadTasks(token);
    }, [router]);

    const loadTasks = async (token: string) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/tasks`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch tasks');
            }

            if (Array.isArray(data)) {
                setTasks(data);
            } else {
                setTasks([]);
                console.error('Tasks data is not an array:', data);
            }
        } catch (error: any) {
            showToast(error.message || 'Failed to load tasks', 'error');
            setTasks([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        try {
            const url = editingTask
                ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/tasks/${editingTask.id}`
                : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/tasks`;

            const response = await fetch(url, {
                method: editingTask ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title,
                    description,
                    taskLink,
                    reward: parseFloat(reward),
                    maxCompletions: parseInt(maxCompletions),
                    cooldownHours: parseInt(cooldownHours),
                    taskType,
                    correctAnswer: correctAnswer || null,
                }),
            });

            if (!response.ok) throw new Error('Failed to save task');

            showToast(editingTask ? 'Task updated!' : 'Task created!', 'success');
            setShowForm(false);
            resetForm();
            loadTasks(token);
        } catch (error) {
            showToast('Failed to save task', 'error');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this task?')) return;
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/tasks/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            showToast('Task deleted', 'success');
            loadTasks(token);
        } catch (error) {
            showToast('Failed to delete task', 'error');
        }
    };

    const startEdit = (task: Task) => {
        setEditingTask(task);
        setTitle(task.title || '');
        setDescription(task.description || '');
        setTaskLink(task.task_link || '');
        setReward(task.reward?.toString() || '0');
        setMaxCompletions(task.max_completions?.toString() || '3');
        setCooldownHours(task.cooldown_hours?.toString() || '1');
        setTaskType(task.task_type || 'watch_ads');
        setCorrectAnswer(task.correctAnswer || '');
        setShowForm(true);
    };

    const resetForm = () => {
        setEditingTask(null);
        setTitle('');
        setDescription('');
        setTaskLink('');
        setReward('');
        setMaxCompletions('3');
        setCooldownHours('24');
        setTaskType('watch_ads');
        setCorrectAnswer('');
    };

    const taskTypeIcons: Record<string, any> = {
        watch_ads: Play,
        short_links: LinkIcon,
        social_tasks: Heart,
        daily_bonus: Gift,
        offerwalls: Flame,
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)] p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.push('/admin/dashboard')} className="p-2">
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-2xl font-bold">Manage Tasks</h1>
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowForm(true); }}
                        className="btn btn-primary"
                    >
                        <Plus size={18} className="mr-2" />
                        Add Task
                    </button>
                </div>

                {/* Task Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-[var(--card-bg)] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                            <h2 className="text-xl font-bold mb-4">{editingTask ? 'Edit Task' : 'New Task'}</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Title</label>
                                    <input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="input"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="input min-h-[80px]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Task Link</label>
                                    <input
                                        value={taskLink}
                                        onChange={(e) => setTaskLink(e.target.value)}
                                        className="input"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Reward ($)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={reward}
                                            onChange={(e) => setReward(e.target.value)}
                                            className="input"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Task Type</label>
                                        <select
                                            value={taskType}
                                            onChange={(e) => setTaskType(e.target.value)}
                                            className="input"
                                        >
                                            <option value="watch_ads">Watch Ads</option>
                                            <option value="short_links">Short Links</option>
                                            <option value="social_tasks">Social Tasks</option>
                                            <option value="daily_bonus">Daily Bonus</option>
                                            <option value="offerwalls">Offerwalls</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Max Daily</label>
                                        <input
                                            type="number"
                                            value={maxCompletions}
                                            onChange={(e) => setMaxCompletions(e.target.value)}
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Cooldown (hrs)</label>
                                        <input
                                            type="number"
                                            value={cooldownHours}
                                            onChange={(e) => setCooldownHours(e.target.value)}
                                            className="input"
                                        />
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-1">Correct Answer (Optional)</label>
                                    <input
                                        value={correctAnswer}
                                        onChange={(e) => setCorrectAnswer(e.target.value)}
                                        className="input w-full"
                                        placeholder="User must type this exactly to complete (e.g. Code)"
                                    />
                                    <p className="text-xs text-[var(--muted)] mt-1">Leave empty for no answer verification.</p>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary flex-1">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary flex-1">
                                        {editingTask ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Tasks List */}
                <div className="space-y-3">
                    {tasks.map((task) => {
                        const Icon = taskTypeIcons[task.task_type] || Play;
                        return (
                            <div key={task.id} className="card flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${task.is_active ? 'bg-[var(--primary)]/10' : 'bg-gray-500/10'}`}>
                                    <Icon size={24} className={task.is_active ? 'text-[var(--primary)]' : 'text-gray-500'} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold">{task.title}</h3>
                                        {!task.is_active && (
                                            <span className="text-xs px-2 py-0.5 rounded bg-gray-500/20 text-gray-500">Inactive</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-[var(--muted)] line-clamp-1">{task.description}</p>
                                    <div className="flex gap-3 mt-1 text-xs text-[var(--muted)]">
                                        <span>${parseFloat(task.reward as any).toFixed(2)}</span>
                                        <span>{task.max_completions}x/day</span>
                                        <span>{task.cooldown_hours}h cooldown</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => startEdit(task)} className="p-2 hover:bg-[var(--card-border)] rounded-lg">
                                        <Edit size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(task.id)} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
