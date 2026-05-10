import { useState, useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Send, Image as ImageIcon, Info, X, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  selectMessages, selectTyping, setActiveChat,
  fetchMessages, markChatRead,
} from "../../features/chat/chatSlice";
import { selectCurrentUser } from "../../features/auth/authSlice";
import {
  sendSocketMessage, emitTypingStart, emitTypingStop, emitMessagesRead,
} from "../../socket/socket";
import Avatar from "../common/Avatar";
import { Modal } from "../common";
import { timeAgo } from "../../utils";
import { Link } from "react-router-dom";

// ─── ChatWindow ───────────────────────────────────────────
export function ChatWindow({ chat }) {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const messages = useSelector(selectMessages(chat._id));
  const typing = useSelector(selectTyping(chat._id));
  const loading = useSelector((s) => s.chat.loading);

  const [input, setInput] = useState("");
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    dispatch(setActiveChat(chat._id));
    dispatch(fetchMessages({ chatId: chat._id }));
    emitMessagesRead(chat._id);
    dispatch(markChatRead(chat._id));
    return () => dispatch(setActiveChat(null));
  }, [chat._id, dispatch]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    sendSocketMessage(chat._id, input.trim());
    setInput("");
    emitTypingStop(chat._id);
    clearTimeout(typingTimeout);
    inputRef.current?.focus();
  }, [input, chat._id, typingTimeout]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    emitTypingStart(chat._id);
    clearTimeout(typingTimeout);
    setTypingTimeout(setTimeout(() => emitTypingStop(chat._id), 2000));
  };

  // ─── Header info ─────────────────────────────────
  const isGroup = chat.type === "group";
  const otherUser = !isGroup
    ? chat.participants?.find((p) => p._id !== user._id)
    : null;

  const chatName = isGroup
    ? chat.name || "Group Chat"
    : otherUser?.name || "Chat";

  const memberCount = chat.participants?.length || 0;
  const typingUsers = typing.filter((id) => id !== user._id);

  return (
    <div className="flex flex-col h-full">
      {/* ─── Header ─────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.07] bg-dark-850/50">
        {isGroup ? (
          // Group: show overlapping avatars of first 3 members
          <button
            onClick={() => setShowMembers(true)}
            className="relative flex items-center hover:opacity-80 transition-opacity"
          >
            {chat.participants?.slice(0, 3).map((p, i) => (
              <div
                key={p._id}
                className="ring-2 ring-dark-850 rounded-full"
                style={{ marginLeft: i === 0 ? 0 : -8, zIndex: 3 - i }}
              >
                <Avatar src={p.avatar} name={p.name} size="sm" />
              </div>
            ))}
          </button>
        ) : (
          <Avatar
            src={otherUser?.avatar}
            name={chatName}
            size="sm"
            online
          />
        )}

        <button
          onClick={() => isGroup && setShowMembers(true)}
          className="flex-1 min-w-0 text-left"
        >
          <p className="font-semibold text-sm text-slate-100 truncate">
            {chatName}
          </p>
          <p className="text-xs text-slate-500">
            {isGroup ? (
              <>
                <Users size={10} className="inline mr-1" />
                {memberCount} member{memberCount !== 1 ? "s" : ""} · tap for details
              </>
            ) : (
              "Direct message"
            )}
          </p>
        </button>

        <button onClick={() => setShowMembers(true)} className="btn-ghost p-2">
          <Info size={16} />
        </button>
      </div>

      {/* ─── Messages ──────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {loading && messages.length === 0 && (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full" />
          </div>
        )}

        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 bg-brand-900/40 rounded-2xl flex items-center justify-center mb-3">
              👋
            </div>
            <p className="text-sm text-slate-400 font-medium">
              {isGroup ? "Welcome to the group!" : "Start the conversation"}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              {isGroup
                ? "Coordinate with all players here."
                : "Send the first message."}
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble
            key={msg._id}
            message={msg}
            isMine={
              msg.sender?._id === user._id || msg.sender === user._id
            }
            showAvatar={
              i === 0 || messages[i - 1]?.sender?._id !== msg.sender?._id
            }
            chatType={chat.type}
          />
        ))}

        <AnimatePresence>
          {typingUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 py-1"
            >
              <div className="flex gap-1 px-3 py-2 bg-white/5 rounded-2xl rounded-bl-sm">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
              <span className="text-xs text-slate-500">typing...</span>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* ─── Input ─────────────────────────────── */}
      <div className="px-4 py-3 border-t border-white/[0.07]">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 focus-within:border-brand-500/50 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                isGroup
                  ? `Message ${memberCount} members...`
                  : "Type a message..."
              }
              rows={1}
              className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-500 resize-none outline-none max-h-32"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-10 h-10 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send size={16} className="text-white" />
          </button>
        </div>
      </div>

      {/* ─── Members modal ─────────────────────── */}
      <Modal
        open={showMembers}
        onClose={() => setShowMembers(false)}
        title={isGroup ? `${memberCount} Members` : "Conversation"}
        size="sm"
      >
        {chat.match && (
          <Link
            to={`/matches/${chat.match._id || chat.match}`}
            className="block bg-white/5 rounded-xl p-3 mb-4 hover:bg-white/10 transition-colors"
          >
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
              Match
            </p>
            <p className="text-sm font-semibold text-slate-100">
              {chat.match.title || "View match"}
            </p>
            {chat.match.sport && (
              <p className="text-xs text-slate-400 capitalize mt-0.5">
                {chat.match.sport}
              </p>
            )}
          </Link>
        )}

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {chat.participants?.map((p) => (
            <Link
              key={p._id}
              to={`/profile/${p._id}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <Avatar src={p.avatar} name={p.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">
                  {p.name}
                  {p._id === user._id && (
                    <span className="text-xs text-slate-500 ml-1">(You)</span>
                  )}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </Modal>
    </div>
  );
}

// ─── MessageBubble ────────────────────────────────────────
export function MessageBubble({ message, isMine, showAvatar, chatType }) {
  if (message.messageType === "system") {
    return (
      <div className="flex justify-center py-1">
        <span className="text-xs text-slate-500 bg-white/5 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : ""}`}
    >
      {!isMine && (
        <div className="w-6 flex-shrink-0">
          {showAvatar && (
            <Avatar
              src={message.sender?.avatar}
              name={message.sender?.name}
              size="xs"
            />
          )}
        </div>
      )}
      <div
        className={`max-w-[70%] ${isMine ? "items-end" : "items-start"} flex flex-col`}
      >
        {!isMine && chatType === "group" && showAvatar && (
          <span className="text-[10px] text-slate-500 mb-1 ml-1">
            {message.sender?.name}
          </span>
        )}
        <div
          className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
            isMine
              ? "bg-brand-700 text-brand-50 rounded-br-sm"
              : "bg-[#1e2733] text-slate-200 rounded-bl-sm"
          }`}
        >
          {message.imageUrl && (
            <img
              src={message.imageUrl}
              alt="shared"
              className="max-w-full rounded-lg mb-1 max-h-60 object-cover"
            />
          )}
          {message.isDeleted ? (
            <span className="italic text-slate-400 text-xs">
              This message was deleted.
            </span>
          ) : (
            message.content
          )}
        </div>
        <span className="text-[10px] text-slate-600 mt-0.5 px-1">
          {timeAgo(message.createdAt)}
        </span>
      </div>
    </motion.div>
  );
}

// ─── ChatListItem ─────────────────────────────────────────
export function ChatListItem({ chat, isActive, onClick, currentUserId }) {
  const otherUser = chat.type === "direct"
    ? chat.participants?.find((p) => p._id !== currentUserId)
    : null;

  const displayName = chat.type === "direct"
    ? otherUser?.name || "Unknown"
    : chat.name || "Group";

  const lastMsg = chat.lastMessage;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left ${
        isActive ? "bg-brand-900/40 border border-brand-800/50" : "hover:bg-white/5"
      }`}
    >
      <div className="relative">
        <Avatar
          src={chat.type === "direct" ? otherUser?.avatar : undefined}
          name={displayName}
          size="md"
        />
        {chat.type === "group" && (
          <span className="absolute -bottom-1 -right-1 text-[10px] bg-dark-900 rounded-full w-5 h-5 flex items-center justify-center border border-white/10">
            <Users size={10} className="text-brand-400" />
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm truncate ${isActive ? "text-brand-300" : "text-slate-200"}`}>
          {displayName}
        </p>
        {lastMsg ? (
          <p className="text-xs text-slate-500 truncate">
            {lastMsg.content || (lastMsg.imageUrl ? "📷 Image" : "")}
          </p>
        ) : (
          <p className="text-xs text-slate-600 italic">No messages yet</p>
        )}
        {chat.type === "group" && chat.participants && (
          <p className="text-[10px] text-slate-600 mt-0.5">
            {chat.participants.length} member{chat.participants.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </button>
  );
}
