import { Task } from '@/hooks/useTasks';
import { useComments } from '@/hooks/useComments';
import { useActivityLogs } from '@/hooks/useActivityLogs';
import { useState } from 'react';
import { X, MessageSquare, Activity, Send } from 'lucide-react';

interface TaskDetailsModalProps {
  task: Task;
  onClose: () => void;
}

export default function TaskDetailsModal({ task, onClose }: TaskDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments');
  const { comments, addComment } = useComments(task.id);
  const { logs } = useActivityLogs(task.id);
  const [newComment, setNewComment] = useState('');

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    await addComment(newComment.trim());
    setNewComment('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-start p-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                task.priority === 'high' ? 'bg-red-100 text-red-700' :
                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {task.priority}
              </span>
              <span className="text-xs font-medium px-2 py-1 rounded-md bg-gray-100 text-gray-600 capitalize">
                {task.status.replace('_', ' ')}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{task.title}</h2>
            {task.description && (
              <p className="text-gray-600 mt-2 text-sm">{task.description}</p>
            )}
            {task.tags && task.tags.length > 0 && (
              <div className="flex gap-2 mt-3">
                {task.tags.map(tag => (
                  <span key={tag} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
              activeTab === 'comments' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Comments
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
              activeTab === 'activity' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Activity className="w-4 h-4" /> Activity
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {activeTab === 'comments' ? (
            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-900">User {comment.userId.substring(0, 5)}...</span>
                    <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <div className="text-center text-gray-500 py-8 text-sm">No comments yet.</div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map(log => (
                <div key={log.id} className="flex gap-3 text-sm">
                  <div className="mt-1">
                    <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                  </div>
                  <div>
                    <p className="text-gray-900">
                      <span className="font-medium">User {log.performedBy.substring(0, 5)}...</span> {log.details}
                    </p>
                    <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-center text-gray-500 py-8 text-sm">No activity yet.</div>
              )}
            </div>
          )}
        </div>

        {activeTab === 'comments' && (
          <div className="p-4 bg-white border-t border-gray-100">
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
